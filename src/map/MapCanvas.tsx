// SVG map (ADR-03): base layers in one <g transform> that d3-zoom moves (no re-projection while
// panning); place labels and document markers sit outside it and are re-positioned from the same
// transform, so their text and 44 px hit targets keep a constant size at any zoom.
import { geoPath } from 'd3-geo';
import { interpolateZoom } from 'd3-interpolate';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, zoomTransform, type ZoomBehavior } from 'd3-zoom';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { cameraDuration } from '../motion/motionPolicy.ts';
import {
  baseLoadFailed,
  currentEvent,
  currentPlace,
  documentsState,
  openDocumentId,
} from '../state/app.ts';
import { DETAIL_ZOOM, fallbackBase, fetchBase, type Base } from './baseData.ts';
import { DocumentMarker } from './DocumentMarker.tsx';
import styles from './MapCanvas.module.css';
import { createProjection } from './projection.ts';
import { regionOutline } from './region.ts';

/** Zoom the camera settles at for a step, and the widest the user may zoom out/in. */
const STEP_ZOOM = 2.6;
const MIN_ZOOM = 1;
const MAX_ZOOM = 14;
/** Below this width the cartouches form one strip over the lower half (SPEC §4.3). */
const COMPACT_WIDTH = 768;
const MARKER_SPACING = 48;
const MARKER_LIFT = 38;

interface Size {
  w: number;
  h: number;
}

export function MapCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const behavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [transform, setTransform] = useState(zoomIdentity);
  const [base, setBase] = useState<Base>(fallbackBase);
  const camera = useRef(0);

  // Size follows the container (no fixed viewBox: the projection is fitted to the real pixels).
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 50m after first paint; a failure leaves the embedded 110m drawing and raises the note.
  useEffect(() => {
    fetchBase('50m').then(setBase, () => {
      baseLoadFailed.value = true;
    });
  }, []);

  // 10m once, the first time the user zooms past DETAIL_ZOOM.
  const wantsDetail = transform.k >= DETAIL_ZOOM && base.level !== '10m';
  useEffect(() => {
    if (!wantsDetail) return;
    let cancelled = false;
    fetchBase('10m').then(
      (detail) => !cancelled && setBase(detail),
      () => undefined, // 50m stays; the zoom still works, just coarser
    );
    return () => {
      cancelled = true;
    };
  }, [wantsDetail]);

  const projection = useMemo(
    () => (size.w > 0 ? createProjection(size.w, size.h) : null),
    [size.w, size.h],
  );
  const paths = useMemo(() => {
    if (!projection) return null;
    const path = geoPath(projection);
    const d = (fc: Base['land']) => fc.features.map((f) => path(f) ?? '').join('');
    return { land: d(base.land), lakes: d(base.lakes) };
  }, [projection, base]);

  // d3-zoom behaviour: created once, its extent follows the size.
  useEffect(() => {
    const node = svg.current;
    if (!node) return;
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .on('zoom', (event) => setTransform(event.transform));
    behavior.current = z;
    select(node).call(z);
    return () => {
      select(node).on('.zoom', null);
      behavior.current = null;
    };
  }, []);
  // Panning is limited to the clipped base map: past it there is only blank sea.
  useEffect(() => {
    const z = behavior.current;
    if (!z || !projection) return;
    const [[x0, y0], [x1, y1]] = geoPath(projection).bounds({
      type: 'MultiPoint',
      coordinates: regionOutline(),
    });
    z.extent([
      [0, 0],
      [size.w, size.h],
    ]).translateExtent([
      [x0, y0],
      [x1, y1],
    ]);
  }, [projection, size.w, size.h]);

  const place = currentPlace.value;
  const placeXY = useMemo(
    () => (projection && place ? projection([place.point.lon, place.point.lat]) : null),
    [projection, place],
  );

  // M8: the camera moves to the step's place; instant under reduced motion (SPEC §5.3).
  useEffect(() => {
    const z = behavior.current;
    const node = svg.current;
    if (!z || !node || !placeXY || size.w === 0) return;
    // Over the cartouches the visible map is the upper part, so aim the place there.
    const fx = size.w / 2;
    const fy = size.h * (size.w < COMPACT_WIDTH ? 0.3 : 0.42);
    const [px, py] = placeXY;
    const from = zoomTransform(node);
    const fromView: [number, number, number] = [
      (fx - from.x) / from.k,
      (fy - from.y) / from.k,
      size.w / from.k,
    ];
    const toView: [number, number, number] = [px, py, size.w / STEP_ZOOM];
    const frame = (view: [number, number, number]) => {
      const k = size.w / view[2];
      return zoomIdentity.translate(fx - view[0] * k, fy - view[1] * k).scale(k);
    };
    const interpolate = interpolateZoom(fromView, toView);
    const hop = Math.hypot(toView[0] - fromView[0], toView[1] - fromView[1]) / size.w;
    const duration = cameraDuration(hop);
    cancelAnimationFrame(camera.current);
    if (duration === 0) {
      select(node).call(z.transform, frame(toView));
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - start) / duration);
      select(node).call(z.transform, frame(interpolate(u)));
      if (u < 1) camera.current = requestAnimationFrame(tick);
    };
    camera.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(camera.current);
  }, [placeXY, size.w, size.h]);

  const screen = (point: [number, number] | null) => (point ? transform.apply(point) : null);
  const at = screen(placeXY);
  const docs = documentsState.value.status === 'ready' ? documentsState.value.documents : [];
  const event = currentEvent.value;

  return (
    <div class={styles.wrap} ref={wrap}>
      <svg
        ref={svg}
        class={styles.svg}
        width={size.w}
        height={size.h}
        role="group"
        aria-label="Harita: dönem altlığı üzerinde olayın yeri"
      >
        <rect class={styles.sea} width={size.w} height={size.h} />
        {paths && (
          <g class={styles.viewport} transform={transform.toString()}>
            <path class={styles.land} d={paths.land} />
            <path class={styles.lakes} d={paths.lakes} />
          </g>
        )}
        {at && place && (
          <g class={styles.overlay}>
            <g transform={`translate(${at[0]} ${at[1]})`}>
              <circle class={styles.dot} r="4" />
              <text class={styles.label} x="10" y="5">
                {place.names[0]?.name}
              </text>
            </g>
            {docs.map((doc, i) => (
              <DocumentMarker
                key={doc.id}
                doc={doc}
                x={at[0] + (i - (docs.length - 1) / 2) * MARKER_SPACING}
                y={at[1] - MARKER_LIFT}
                active={openDocumentId.value === doc.id}
              />
            ))}
          </g>
        )}
      </svg>
      {/* The step's place and documents in words, for screen readers (the map is a picture). */}
      <p class="visually-hidden" aria-live="polite">
        {event && place ? `${place.names[0]?.name}: ${event.title}` : ''}
      </p>
    </div>
  );
}
