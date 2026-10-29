// SVG map (ADR-03): base layers in one <g transform> that d3-zoom moves (no re-projection while
// panning); place labels and document markers sit outside it and are re-positioned from the same
// transform, so their text and 44 px hit targets keep a constant size at any zoom.
import { geoPath } from 'd3-geo';
import { interpolateZoom } from 'd3-interpolate';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, zoomTransform, type ZoomBehavior } from 'd3-zoom';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { cameraDuration, reducedMotion } from '../motion/motionPolicy.ts';
import {
  activeBorders,
  baseLoadFailed,
  currentEvent,
  currentJourney,
  currentPlace,
  documentsState,
  openDocumentId,
  placeById,
} from '../state/app.ts';
import { DETAIL_ZOOM, fallbackBase, fetchBase, type Base } from './baseData.ts';
import { BorderLayer } from './BorderLayer.tsx';
import { DocumentMarker } from './DocumentMarker.tsx';
import { JourneyLayer } from './JourneyLayer.tsx';
import { TransmissionLayer } from './TransmissionLayer.tsx';
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
  const event = currentEvent.value;
  const journey = currentJourney.value;
  const places = placeById.value;
  const docs = documentsState.value.status === 'ready' ? documentsState.value.documents : [];
  const reduced = reducedMotion.value;

  // Places that need a dot and a name: the step's own, the journey's and the documents'.
  const labelled = useMemo(() => {
    const ids = new Set<string>();
    if (place) ids.add(place.id);
    journey?.legs.forEach((l) => {
      ids.add(l.fromPlaceId);
      ids.add(l.toPlaceId);
    });
    docs.forEach((d) => {
      ids.add(d.fromPlaceId);
      if (d.toPlaceId) ids.add(d.toPlaceId);
    });
    return [...ids].flatMap((id) => {
      const p = places.get(id);
      return p ? [p] : [];
    });
  }, [place, journey, docs, places]);

  // What the camera frames: the whole route on a journey step (SPEC §5.2 M8), else the place.
  const focus = useMemo(() => {
    if (!projection) return null;
    const coords: [number, number][] = journey
      ? journey.legs.flatMap((l) => [
          ...(l.path?.map((p): [number, number] => [p.lon, p.lat]) ?? []),
          ...[l.fromPlaceId, l.toPlaceId].flatMap((id) => {
            const p = places.get(id);
            return p ? [[p.point.lon, p.point.lat] as [number, number]] : [];
          }),
        ])
      : place
        ? [[place.point.lon, place.point.lat]]
        : [];
    const pts = coords.flatMap((c) => {
      const xy = projection(c);
      return xy ? [xy] : [];
    });
    if (pts.length === 0) return null;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return {
      x0: Math.min(...xs),
      x1: Math.max(...xs),
      y0: Math.min(...ys),
      y1: Math.max(...ys),
    };
  }, [projection, journey, place, places]);

  // M8: the camera moves to the step; instant under reduced motion (SPEC §5.3).
  useEffect(() => {
    const z = behavior.current;
    const node = svg.current;
    if (!z || !node || !focus || size.w === 0) return;
    const compact = size.w < COMPACT_WIDTH;
    // Over the cartouches the visible map is the upper part, so aim the step there.
    const fx = size.w / 2;
    const fy = size.h * (compact ? 0.3 : 0.42);
    const visibleH = size.h * (compact ? 0.5 : 0.7);
    const boxW = focus.x1 - focus.x0;
    const boxH = focus.y1 - focus.y0;
    const fit = Math.min((size.w * 0.8) / Math.max(boxW, 1), (visibleH * 0.9) / Math.max(boxH, 1));
    const k = Math.max(MIN_ZOOM, Math.min(STEP_ZOOM, fit));
    const cx = (focus.x0 + focus.x1) / 2;
    const cy = (focus.y0 + focus.y1) / 2;
    const from = zoomTransform(node);
    const fromView: [number, number, number] = [
      (fx - from.x) / from.k,
      (fy - from.y) / from.k,
      size.w / from.k,
    ];
    const toView: [number, number, number] = [cx, cy, size.w / k];
    const frame = (view: [number, number, number]) => {
      const scale = size.w / view[2];
      return zoomIdentity.translate(fx - view[0] * scale, fy - view[1] * scale).scale(scale);
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
  }, [focus, size.w, size.h]);

  const project = (c: [number, number]): [number, number] | null => {
    const xy = projection?.(c);
    return xy ? (transform.apply(xy) as [number, number]) : null;
  };
  const dotAt = (id: string) => {
    const p = places.get(id);
    return p ? project([p.point.lon, p.point.lat]) : null;
  };

  // Markers sit above their sending place, side by side when several documents share one.
  const markerGroups = new Map<string, typeof docs>();
  docs.forEach((d) =>
    markerGroups.set(d.fromPlaceId, [...(markerGroups.get(d.fromPlaceId) ?? []), d]),
  );

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
        <defs>
          {/* Hatching for approximate or occupied borders (SPEC §3.1, A14). */}
          <pattern
            id="hatch"
            patternUnits="userSpaceOnUse"
            width="7"
            height="7"
            patternTransform="rotate(45)"
          >
            <path class={styles.hatch} d="M0 0V7" />
          </pattern>
        </defs>
        <rect class={styles.sea} width={size.w} height={size.h} />
        {paths && projection && (
          <g class={styles.viewport} transform={transform.toString()}>
            <path class={styles.land} d={paths.land} />
            <path class={styles.lakes} d={paths.lakes} />
            <BorderLayer borders={activeBorders.value} projection={projection} />
          </g>
        )}
        {projection && (
          <g class={styles.overlay}>
            {journey && (
              <JourneyLayer
                journey={journey}
                places={places}
                project={project}
                stepKey={event?.id ?? ''}
                reduced={reduced}
                width={size.w}
                height={size.h}
              />
            )}
            <TransmissionLayer
              documents={docs}
              places={places}
              project={project}
              stepKey={event?.id ?? ''}
              reduced={reduced}
            />
            {labelled.map((p) => {
              const at = dotAt(p.id);
              return at ? (
                <g key={p.id} transform={`translate(${at[0]} ${at[1]})`}>
                  <circle class={styles.dot} r="4" />
                  <text class={styles.label} x="10" y="5">
                    {p.names[0]?.name}
                  </text>
                </g>
              ) : null;
            })}
            {[...markerGroups].flatMap(([placeId, group]) => {
              const at = dotAt(placeId);
              if (!at) return [];
              return group.map((doc, i) => (
                <DocumentMarker
                  key={doc.id}
                  doc={doc}
                  x={at[0] + (i - (group.length - 1) / 2) * MARKER_SPACING}
                  y={at[1] - MARKER_LIFT}
                  active={openDocumentId.value === doc.id}
                />
              ));
            })}
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
