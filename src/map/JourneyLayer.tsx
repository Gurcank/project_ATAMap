// Journey route and vehicle (SPEC §5.2 M1, M2). Drawn in screen space on top of the map: the path
// is re-projected on every pan/zoom frame, so dashes and line widths keep a constant look.
//   M1  the route is revealed like ink: a mask path whose dash offset runs 1 -> 0 (pathLength="1")
//   M2  the vehicle follows the revealed part of the route, leg by leg
// A route that is not documented (routeKind 'yaklasik') is a faint dashed great-circle arc with
// the label "yaklaşık rota" (A8). Under reduced motion the route is complete and the vehicle
// stands at the end (SPEC §5.3).
import { useEffect, useLayoutEffect, useMemo, useRef } from 'preact/hooks';
import type { Journey, PlaceName } from '../schema/index.ts';
import { VEHICLE_LABEL, VEHICLE_PATH } from './vehicles.ts';
import { densify, geodesic, placeAlong, toPathData, type LonLat, type XY } from './along.ts';
import styles from './JourneyLayer.module.css';

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
}

const MIN_MS = 1500;
const MAX_MS = 6000;
const MS_PER_PX = 2.5;

const lonLat = (place: PlaceName | undefined): LonLat | null =>
  place ? [place.point.lon, place.point.lat] : null;

export function JourneyLayer({ journey, places, project, stepKey, reduced, width, height }: Props) {
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
              ? geodesic(from, to)
              : [];
        return { leg, points };
      }),
    [journey, places],
  );

  const screen = legs.map(({ points }) => points.map(project).filter((p): p is XY => p !== null));

  const park = () => {
    const { leg, p } = stand.current;
    glyphs.current.forEach((g, i) =>
      g?.setAttribute('visibility', i === leg ? 'visible' : 'hidden'),
    );
    const route = routes.current[leg];
    const glyph = glyphs.current[leg];
    const spec = legs[leg];
    if (route && glyph && spec) placeAlong(route, glyph, p, spec.leg.vehicle);
  };

  // Every render re-projects the paths, so the vehicle is put back on its (new) route.
  useLayoutEffect(park);

  useEffect(() => {
    const last = legs.length - 1;
    if (reduced) {
      stand.current = { leg: last, p: 1 };
      park();
      return;
    }
    const lengths = routes.current.map((r) => r?.getTotalLength() ?? 0);
    const sum = lengths.reduce((a, b) => a + b, 0);
    const total = Math.min(MAX_MS, Math.max(MIN_MS, MIN_MS + sum * MS_PER_PX));
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
        const mid = points[Math.floor(points.length / 2)];
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
            {approximate && mid && (
              <text class={styles.label} x={mid[0]} y={mid[1] - 8} text-anchor="middle">
                yaklaşık rota
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
              <path d={VEHICLE_PATH[leg.vehicle]} />
            </g>
          </g>
        );
      })}
    </g>
  );
}
