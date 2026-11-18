// SVG map (ADR-03), in two layers:
//   base     the table, the sheet and the print, in map space, drawn at a committed transform. While
//            the camera moves, this layer is only moved and scaled by a CSS transform (composited,
//            no repaint), so the coast's water lines stay on screen; it is redrawn sharp once the
//            camera rests, or sooner when the scale has drifted far (2026-11-17).
//   overlay  routes, dispatches, place names and document markers in screen space, re-positioned
//            from the live transform, so text and 44 px hit targets keep their size. d3-zoom listens
//            on this layer.
import { geoContains, geoPath } from 'd3-geo';
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
  reportStepAnimation,
} from '../state/app.ts';
import { DETAIL_ZOOM, fallbackBase, fetchBase, type Base } from './baseData.ts';
import { BorderLayer } from './BorderLayer.tsx';
import { DocumentMarker } from './DocumentMarker.tsx';
import { JourneyLayer } from './JourneyLayer.tsx';
import { dotBox, placeLabels, type Box } from './labels.ts';
import { clearTextCache, textWidth, tokenPx } from './measure.ts';
import { TransmissionLayer } from './TransmissionLayer.tsx';
import styles from './MapCanvas.module.css';
import { createProjection } from './projection.ts';
import { buildSheet } from './sheet.ts';
import { SheetDefs, SheetOver, SheetUnder } from './SheetLayer.tsx';
import { placeNameAt } from '../timeline/status.ts';

/**
 * Land test for bowing sea routes (A31). The embedded 110m drawing is used on purpose: it is always
 * there, so a route keeps the same curve whichever base level is on screen.
 */
const onLand = (point: [number, number]) =>
  fallbackBase.land.features.some((f) => geoContains(f, point));

/** Zoom the camera settles at for a step, and the closest the user may zoom in. */
const STEP_ZOOM = 2.6;
const MAX_ZOOM = 14;
/** Furthest out: the whole sheet and a strip of table around it fit the screen. */
const SHEET_FIT = 0.92;
/** Table the camera may show beyond the sheet, as a share of the screen. */
const TABLE_VIEW = 0.15;
/** Redraw the base layer this long after the camera stops, or at once past these scale drifts:
 *  zooming in only blurs the drawing, zooming out uncovers undrawn edges, so out redraws sooner. */
const COMMIT_DELAY = 140;
const MAX_DRIFT_IN = 1.6;
const MAX_DRIFT_OUT = 1.2;
/** The base layer is drawn this share of the screen past each edge, so panning and a moderate
 *  zoom-out show drawn map at once instead of blank edges until the redraw (2026-11-18). */
const OVERSCAN = 0.3;
/** Below this width the cartouches form one strip over the lower half (SPEC §4.3). */
const COMPACT_WIDTH = 768;
const MARKER_SPACING = 48;
const MARKER_LIFT = 38;
/** Half the 44 px hit target of a document marker: names keep off it. */
const MARKER_HALF = 22;
/** Thinner than this, the measured band is not trusted and the fixed ratios are used. */
const MIN_BAND = 120;

interface Size {
  w: number;
  h: number;
}

/**
 * Compact screens: the band of the map between the top-left column and the bottom strip, both
 * marked with data-map-edge. Measured on every camera move because both change height with the
 * step (status rows, event text). Null when either is missing or the band is too thin to use.
 */
function compactBand(node: SVGSVGElement): { top: number; bottom: number } | null {
  const origin = node.getBoundingClientRect().top;
  const edge = (name: string) =>
    document.querySelector(`[data-map-edge="${name}"]`)?.getBoundingClientRect();
  const corner = edge('top');
  const dock = edge('bottom');
  if (!corner || !dock) return null;
  const top = corner.bottom - origin;
  const bottom = dock.top - origin;
  return bottom - top >= MIN_BAND ? { top, bottom } : null;
}

export function MapCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const baseSvg = useRef<SVGSVGElement>(null);
  const behavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [transform, setTransform] = useState(zoomIdentity);
  const [base, setBase] = useState<Base>(fallbackBase);
  // Bumped once the web fonts are in: label widths were measured with the narrower fallback.
  const [, setFontsReady] = useState(0);
  useEffect(() => {
    void document.fonts?.ready.then(() => {
      clearTextCache();
      setFontsReady((n) => n + 1);
    });
  }, []);
  const camera = useRef(0);
  // The transform the base layer is drawn at; the live `transform` differs from it while moving.
  const [committed, setCommitted] = useState(zoomIdentity);
  const committedRef = useRef(zoomIdentity);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
  const sheet = useMemo(() => (projection ? buildSheet(projection) : null), [projection]);
  const minZoom = sheet
    ? Math.min(
        (size.w * SHEET_FIT) / (sheet.paper.x1 - sheet.paper.x0),
        (size.h * SHEET_FIT) / (sheet.paper.y1 - sheet.paper.y0),
      )
    : 1;

  // d3-zoom behaviour: created once, its extent follows the size.
  useEffect(() => {
    const node = svg.current;
    if (!node) return;
    const commit = (t: typeof zoomIdentity) => {
      committedRef.current = t;
      setCommitted(t);
    };
    const z = d3zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      const t = event.transform as typeof zoomIdentity;
      setTransform(t);
      clearTimeout(settle.current);
      const drift = t.k / committedRef.current.k;
      if (drift > MAX_DRIFT_IN || drift < 1 / MAX_DRIFT_OUT) commit(t);
      else settle.current = setTimeout(() => commit(t), COMMIT_DELAY);
    });
    behavior.current = z;
    select(node).call(z);
    return () => {
      select(node).on('.zoom', null);
      behavior.current = null;
    };
  }, []);
  // The camera stays over the sheet, with a little table showing past its edges at most.
  useEffect(() => {
    const z = behavior.current;
    if (!z || !sheet) return;
    const { x0, y0, x1, y1 } = sheet.paper;
    const padX = (size.w * TABLE_VIEW) / minZoom;
    const padY = (size.h * TABLE_VIEW) / minZoom;
    z.scaleExtent([minZoom, MAX_ZOOM])
      .extent([
        [0, 0],
        [size.w, size.h],
      ])
      .translateExtent([
        [x0 - padX, y0 - padY],
        [x1 + padX, y1 + padY],
      ]);
  }, [sheet, minZoom, size.w, size.h]);

  // While moving, the base layer is only moved and scaled from where it was drawn. The layer is
  // drawn `pad` px wider on each side (overscan) and shifted back by it: a map point drawn at
  // pad + c(p) in the layer must land on t(p) on screen.
  const pad = { x: Math.round(size.w * OVERSCAN), y: Math.round(size.h * OVERSCAN) };
  useEffect(() => {
    const node = baseSvg.current;
    if (!node) return;
    const scale = transform.k / committed.k;
    const dx = transform.x - scale * committed.x - scale * pad.x;
    const dy = transform.y - scale * committed.y - scale * pad.y;
    node.style.setProperty('transform', `translate(${dx}px, ${dy}px) scale(${scale})`);
  }, [transform, committed, pad.x, pad.y]);

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
    // Over the cartouches the visible map is the upper part, so aim the step there. On compact
    // screens the top-left column spans the width (A29), so the step goes in the band below it.
    const band = compact ? compactBand(node) : null;
    const fx = size.w / 2;
    const fy = band ? (band.top + band.bottom) / 2 : size.h * (compact ? 0.3 : 0.42);
    const visibleH = band ? band.bottom - band.top : size.h * (compact ? 0.5 : 0.7);
    const boxW = focus.x1 - focus.x0;
    const boxH = focus.y1 - focus.y0;
    const fit = Math.min((size.w * 0.8) / Math.max(boxW, 1), (visibleH * 0.9) / Math.max(boxH, 1));
    const k = Math.max(minZoom, Math.min(STEP_ZOOM, fit));
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
  }, [focus, size.w, size.h, minZoom]);

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
  const markers = [...markerGroups].flatMap(([placeId, group]) => {
    const at = dotAt(placeId);
    if (!at) return [];
    return group.map((doc, i) => ({
      doc,
      x: at[0] + (i - (group.length - 1) / 2) * MARKER_SPACING,
      y: at[1] - MARKER_LIFT,
    }));
  });

  // Names go around their dots without covering each other, the markers or the screen edge; the
  // step's own place is placed first (it is first in `labelled`).
  const labelSize = size.w > 0 ? tokenPx('--text-16') : 16;
  const markerBoxes: Box[] = markers.map(({ x, y }) => ({
    x0: x - MARKER_HALF,
    y0: y - MARKER_HALF,
    x1: x + MARKER_HALF,
    y1: y + MARKER_HALF,
  }));
  // The name in force on the step's date (Elâziz in November 1937), else the place's first name.
  const nameOf = (p: (typeof labelled)[number]) =>
    (event ? placeNameAt(p, event.date) : null) ?? p.names[0]?.name ?? '';
  const dots = labelled.flatMap((p) => {
    const at = dotAt(p.id);
    return at ? [{ place: p, x: at[0], y: at[1] }] : [];
  });
  const spots = placeLabels(
    dots.map(({ place: p, x, y }) => ({
      id: p.id,
      x,
      y,
      width: textWidth(nameOf(p), '--text-16'),
      size: labelSize,
    })),
    markerBoxes,
    { x0: 0, y0: 0, x1: size.w, y1: size.h },
  );
  // The route label keeps off every dot, name and marker drawn here.
  const routeAvoid: Box[] = [
    ...markerBoxes,
    ...dots.map(({ x, y }) => dotBox(x, y)),
    ...[...spots.values()].map((s) => s.box),
  ];

  return (
    <div class={styles.wrap} ref={wrap}>
      <svg
        ref={baseSvg}
        class={styles.base}
        width={size.w + 2 * pad.x}
        height={size.h + 2 * pad.y}
        aria-hidden="true"
      >
        <defs>
          {paths && <path id="land-shape" class={styles.shape} d={paths.land} />}
          {/* Land only: the territory colour and its coastal brush stroke stop at the base map's
              own coast, so they never double the coastline (BorderLayer). */}
          {paths && (
            <clipPath id="land-clip">
              <use href="#land-shape" />
            </clipPath>
          )}
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
          {sheet && <SheetDefs sheet={sheet} k={committed.k} />}
        </defs>
        {paths && projection && sheet && (
          <g transform={`translate(${pad.x} ${pad.y}) ${committed.toString()}`}>
            <SheetUnder sheet={sheet} k={committed.k} />
            {/* The print, inside the atlas neatline. */}
            <g clip-path="url(#frame-clip)">
              <rect
                class={styles.sea}
                x={sheet.frameBox.x0}
                y={sheet.frameBox.y0}
                width={sheet.frameBox.x1 - sheet.frameBox.x0}
                height={sheet.frameBox.y1 - sheet.frameBox.y0}
              />
              {/* Engraver's water lines: two thin strokes parallel to every coast (SPEC §3.2). */}
              <use href="#land-shape" class={styles.waterOuterInk} />
              <use href="#land-shape" class={styles.waterOuterSea} />
              <use href="#land-shape" class={styles.waterInnerInk} />
              <use href="#land-shape" class={styles.waterInnerSea} />
              <use href="#land-shape" class={styles.land} />
              <path class={styles.lakes} d={paths.lakes} />
              <BorderLayer borders={activeBorders.value} projection={projection} />
            </g>
            <SheetOver sheet={sheet} k={committed.k} />
          </g>
        )}
      </svg>
      <svg
        ref={svg}
        class={styles.svg}
        width={size.w}
        height={size.h}
        role="group"
        aria-label="Harita: dönem altlığı üzerinde olayın yeri"
      >
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
                onLand={onLand}
                avoid={routeAvoid}
                onAnimation={(ms) => event && reportStepAnimation(event.id, ms)}
              />
            )}
            <TransmissionLayer
              documents={docs}
              places={places}
              project={project}
              stepKey={event?.id ?? ''}
              reduced={reduced}
              onAnimation={(ms) => event && reportStepAnimation(event.id, ms)}
            />
            {dots.map(({ place: p, x, y }) => {
              const spot = spots.get(p.id);
              return (
                <g key={p.id}>
                  <circle class={styles.dot} cx={x} cy={y} r="4" />
                  {spot && (
                    <text class={styles.label} x={spot.x} y={spot.y} text-anchor={spot.anchor}>
                      {nameOf(p)}
                    </text>
                  )}
                </g>
              );
            })}
            {markers.map(({ doc, x, y }) => (
              <DocumentMarker
                key={doc.id}
                doc={doc}
                x={x}
                y={y}
                active={openDocumentId.value === doc.id}
              />
            ))}
          </g>
        )}
      </svg>
      {/* The camera's own vignette: it stays on screen while the table moves under it. */}
      <div class={styles.vignette} aria-hidden="true" />
      {/* The step's place and documents in words, for screen readers (the map is a picture). */}
      <p class="visually-hidden" aria-live="polite">
        {event && place ? `${nameOf(place)}: ${event.title}` : ''}
      </p>
    </div>
  );
}
