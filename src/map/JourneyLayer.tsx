// Journey route and vehicle (SPEC §5.2 M1, M2). Drawn in screen space on top of the map: the path
// is re-projected on every pan/zoom frame, so dashes and line widths keep a constant look.
//   M1  the route is revealed like ink: a mask path whose dash offset runs 1 -> 0 (pathLength="1")
//   M2  the vehicle follows the revealed part of the route, leg by leg
// A route that is not documented (routeKind 'yaklasik') is a faint dashed great-circle arc with
// the label "yaklaşık rota" (A8), placed where it covers no place name (labels.ts). Under reduced
// motion the route is complete and the vehicle stands still halfway along the journey (A32).
import { useEffect, useLayoutEffect, useMemo, useRef } from 'preact/hooks';
import type { Journey, PlaceName } from '../schema/index.ts';
import { VEHICLE_LABEL, VEHICLE_PATH, VEHICLE_TRAIL } from './vehicles.ts';
import {
  densify,
  geodesic,
  halfway,
  placeAlong,
  seaArc,
  smoothLeg,
  toPathData,
  type LonLat,
  type XY,
} from './along.ts';
import styles from './JourneyLayer.module.css';
import { placeAlong as spotAlong, type Box, type Spot } from './labels.ts';
import { textWidth, tokenPx } from './measure.ts';

interface Props {
  journey: Journey;
  places: Map<string, PlaceName>;
  /** lon/lat -> screen px, zoom transform included; changes on every pan frame. */
  project: (point: LonLat) => XY | null;
  /** Changes whenever the step changes, so the same journey replays on re-entry. */
  stepKey: string;
  reduced: boolean;
  width: number;
  height: number;
  /** Whether a lon/lat point is on land; sea legs are bowed away from it (A31). */
  onLand?: ((point: LonLat) => boolean) | undefined;
  /** Screen boxes the route label must not cover: place dots, names and document markers. */
  avoid?: Box[] | undefined;
  /** Told how long the route takes to draw, so autoplay waits for the arrival (A2). */
  onAnimation?: ((ms: number) => void) | undefined;
}

const ROUTE_LABEL = 'yaklaşık rota';

/** Where along a leg the route label may go, best first. */
const LABEL_STOPS = [0.5, 0.38, 0.62, 0.25, 0.75];

const MIN_MS = 1500;
const MAX_MS = 6000;
const MS_PER_PX = 2.5;

const lonLat = (place: PlaceName | undefined): LonLat | null =>
  place ? [place.point.lon, place.point.lat] : null;

export function JourneyLayer({
  journey,
  places,
  project,
  stepKey,
  reduced,
  width,
  height,
  onLand,
  avoid = [],
  onAnimation,
}: Props) {
  const routes = useRef<(SVGPathElement | null)[]>([]);
  const reveals = useRef<(SVGPathElement | null)[]>([]);
  const glyphs = useRef<(SVGGElement | null)[]>([]);
  // Where the vehicle stands: which leg and how far along it (0..1).
  const stand = useRef({ leg: journey.legs.length - 1, p: 1 });

  // Geographic points of each leg: documented path when there is one, else the great circle.
  const legs = useMemo(
    () =>
      journey.legs.map((leg) => {
        const from = lonLat(places.get(leg.fromPlaceId));
        const to = lonLat(places.get(leg.toPlaceId));
        const documented = leg.path?.map((p): LonLat => [p.lon, p.lat]);
        const points =
          documented && documented.length >= 2
            ? densify(documented)
            : from && to
              ? leg.vehicle === 'gemi' && onLand
                ? seaArc(from, to, onLand)
                : geodesic(from, to)
              : [];
        return { leg, points, documented: Boolean(documented && documented.length >= 2) };
      }),
    [journey, places, onLand],
  );

  // Undocumented land legs are drawn as one smooth curve through the stops; documented paths and
  // sea arcs keep their own shape.
  const projected = legs.map(({ points }) =>
    points.map(project).filter((p): p is XY => p !== null),
  );
  const curved = (i: number) => {
    const spec = legs[i];
    return spec !== undefined && !spec.documented && spec.leg.vehicle !== 'gemi';
  };
  const screen = projected.map((pts, i) => {
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (!curved(i) || !a || !b) return pts;
    const prev = projected[i - 1]?.[0];
    const next = projected[i + 1]?.at(-1);
    return smoothLeg(prev, a, b, next);
  });

  // One "yaklaşık rota" label per journey, land or sea alike (2026-11-17): a label on every leg
  // piles up into an unreadable stack. It goes on the longest approximate leg where it covers
  // nothing, trying shorter legs before accepting an overlap.
  const labelSpots = new Map<number, Spot>();
  const taken = [...avoid];
  const labelSize = width > 0 ? tokenPx('--text-14') : 14;
  {
    const kind = legs
      .map(({ leg }, i) => ({ leg, i, pts: screen[i] ?? [] }))
      .filter(({ leg }) => leg.routeKind === 'yaklasik')
      .map((l) => {
        const first = l.pts[0];
        const last = l.pts[l.pts.length - 1];
        return {
          ...l,
          span: first && last ? Math.hypot(last[0] - first[0], last[1] - first[1]) : 0,
        };
      })
      .sort((x, y) => y.span - x.span);
    const head = kind[0];
    const labelWidth = textWidth(ROUTE_LABEL, '--text-14', true);
    const bounds = { x0: 0, y0: 0, x1: width, y1: height };
    let chosen: { i: number; spot: Spot } | undefined;
    for (const { i, pts } of kind) {
      const stops = LABEL_STOPS.flatMap((f) => {
        const pt = pts[Math.round(f * (pts.length - 1))];
        return pt ? [pt] : [];
      });
      const spot = spotAlong(stops, labelWidth, labelSize, taken, bounds);
      if (!spot) continue;
      const clear = taken.every(
        (o) =>
          spot.box.x1 <= o.x0 || o.x1 <= spot.box.x0 || spot.box.y1 <= o.y0 || o.y1 <= spot.box.y0,
      );
      if (!chosen || clear) chosen = { i, spot };
      if (clear) break;
    }
    if (!chosen && head) {
      const mid = head.pts[Math.floor(head.pts.length / 2)];
      if (mid) chosen = { i: head.i, spot: spotAlong([mid], labelWidth, labelSize, [])! };
    }
    if (chosen) {
      labelSpots.set(chosen.i, chosen.spot);
      taken.push(chosen.spot.box);
    }
  }

  const park = () => {
    const { leg, p } = stand.current;
    glyphs.current.forEach((g, i) => {
      g?.setAttribute('visibility', i === leg ? 'visible' : 'hidden');
      // Smoke, dust and wake only while the vehicle is on its way (never under reduced motion).
      g?.toggleAttribute('data-moving', i === leg && !reduced && p > 0 && p < 1);
    });
    const route = routes.current[leg];
    const glyph = glyphs.current[leg];
    const spec = legs[leg];
    if (route && glyph && spec) placeAlong(route, glyph, p, spec.leg.vehicle);
  };

  // Every render re-projects the paths, so the vehicle is put back on its (new) route, and the
  // dashes carry on from one leg to the next instead of restarting at every stop.
  useLayoutEffect(() => {
    park();
    let along = 0;
    routes.current.forEach((r) => {
      if (!r) return;
      r.style.setProperty('stroke-dashoffset', String(-along));
      along += r.getTotalLength();
    });
  });

  useEffect(() => {
    const lengths = routes.current.map((r) => r?.getTotalLength() ?? 0);
    const sum = lengths.reduce((a, b) => a + b, 0);
    if (reduced) {
      stand.current = halfway(lengths, sum);
      park();
      return;
    }
    const total = Math.min(MAX_MS, Math.max(MIN_MS, MIN_MS + sum * MS_PER_PX));
    onAnimation?.(total);
    let at = 0;
    const timeline = lengths.map((len) => {
      const duration = sum > 0 ? (total * len) / sum : total / legs.length;
      const entry = { delay: at, duration };
      at += duration;
      return entry;
    });
    const animations = reveals.current.map((el, i) =>
      el?.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: timeline[i]?.duration ?? 0,
        delay: timeline[i]?.delay ?? 0,
        easing: 'linear',
        fill: 'both',
      }),
    );
    stand.current = { leg: 0, p: 0 };
    park();
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = now - start;
      let leg = 0;
      timeline.forEach((entry, i) => {
        if (t >= entry.delay) leg = i;
      });
      const entry = timeline[leg];
      const p = entry && entry.duration > 0 ? Math.min(1, (t - entry.delay) / entry.duration) : 1;
      stand.current = { leg, p };
      park();
      if (t < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      animations.forEach((a) => a?.cancel());
    };
    // park() reads refs and `legs`; replaying is driven by the step, not by pan frames.
  }, [journey.id, stepKey, reduced]);

  return (
    <g class={styles.layer} aria-hidden="true">
      <defs>
        {legs.map((_, i) => (
          <mask
            key={i}
            id={`reveal-${journey.id}-${i}`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={width}
            height={height}
          >
            <path
              ref={(el) => {
                reveals.current[i] = el;
              }}
              class={styles.reveal}
              d={toPathData(screen[i] ?? [])}
              pathLength="1"
            />
          </mask>
        ))}
      </defs>
      {legs.map(({ leg }, i) => {
        const points = screen[i] ?? [];
        const label = labelSpots.get(i);
        const approximate = leg.routeKind === 'yaklasik';
        return (
          <g key={i}>
            <path
              ref={(el) => {
                routes.current[i] = el;
              }}
              class={approximate ? styles.routeApproximate : styles.route}
              d={toPathData(points)}
              mask={`url(#reveal-${journey.id}-${i})`}
            />
            {approximate && label && (
              <text class={styles.label} x={label.x} y={label.y} text-anchor={label.anchor}>
                {ROUTE_LABEL}
              </text>
            )}
            <g
              ref={(el) => {
                glyphs.current[i] = el;
              }}
              class={styles.vehicle}
              visibility="hidden"
            >
              <title>{VEHICLE_LABEL[leg.vehicle]}</title>
              {VEHICLE_TRAIL[leg.vehicle].wake && (
                <path class={styles.wake} d={VEHICLE_TRAIL[leg.vehicle].wake} />
              )}
              {VEHICLE_TRAIL[leg.vehicle].puffs.map(([x, y], k) => (
                <circle key={k} class={styles.puff} cx={x} cy={y} r="1.6" />
              ))}
              <path class={styles.body} d={VEHICLE_PATH[leg.vehicle]} />
            </g>
          </g>
        );
      })}
    </g>
  );
}
