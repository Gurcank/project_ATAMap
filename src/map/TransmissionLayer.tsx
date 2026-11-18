// Letter and telegram dispatch (SPEC §5.2 M3, M4). Only documents with a known recipient place
// are animated (`toPlaceId`); the others simply have their marker.
//   M3 letter    a sealed envelope flies an arc from sender to recipient, turning with it (1.2 s);
//                on arrival it settles and a wax seal is pressed at the recipient and stays
//   M4 telegram  a wire on poles is strung between the two points while a signal runs along it
//                (0.8 s); a ring goes out from the recipient when it lands
// Under reduced motion the end state is shown at once (SPEC §5.3): the arrival animations use
// --dur-arrive, which is 0 there.
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import type { DocumentRecord, PlaceName } from '../schema/index.ts';
import { placeAlong, toPathData, type LonLat, type XY } from './along.ts';
import styles from './TransmissionLayer.module.css';

interface Props {
  documents: DocumentRecord[];
  places: Map<string, PlaceName>;
  project: (point: LonLat) => XY | null;
  stepKey: string;
  reduced: boolean;
  /** Told how long the dispatch takes, arrival included, so autoplay waits for it (A2). */
  onAnimation?: ((ms: number) => void) | undefined;
}

// Same values as --dur-letter, --dur-telegram and --dur-arrive in tokens.css (JS cannot read them
// cheaply).
const LETTER_MS = 1200;
const TELEGRAM_MS = 800;
const ARRIVE_MS = 500;
/** Screen distance between telegraph poles, and half a pole's length. */
const POLE_SPACING = 22;
const POLE_HALF = 3.5;

/** Short ticks across the wire at even spacing: the telegraph poles. */
function poles(a: XY, b: XY): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  const count = Math.floor(length / POLE_SPACING);
  if (count < 2) return '';
  const nx = (-dy / length) * POLE_HALF;
  const ny = (dx / length) * POLE_HALF;
  let d = '';
  for (let k = 1; k < count; k++) {
    const x = a[0] + (dx * k) / count;
    const y = a[1] + (dy * k) / count;
    d += `M${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}L${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)}`;
  }
  return d;
}

const lonLat = (place: PlaceName | undefined): LonLat | null =>
  place ? [place.point.lon, place.point.lat] : null;

/** Quadratic arc: the straight line bowed sideways by a fifth of its length. */
function arc(a: XY, b: XY): XY[] {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const cx = mx - dy * 0.2;
  const cy = my + dx * 0.2;
  return Array.from({ length: 33 }, (_, i) => {
    const t = i / 32;
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * cx + t * t * b[0],
      u * u * a[1] + 2 * u * t * cy + t * t * b[1],
    ];
  });
}

function Dispatch({
  doc,
  from,
  to,
  stepKey,
  reduced,
}: {
  doc: DocumentRecord;
  from: XY;
  to: XY;
  stepKey: string;
  reduced: boolean;
}) {
  const route = useRef<SVGPathElement>(null);
  const glyph = useRef<SVGGElement>(null);
  const progress = useRef(1);
  const letter = doc.kind === 'mektup';
  const points: XY[] = letter ? arc(from, to) : [from, to];

  // The sender and recipient move on every pan frame: put the glyph back on the new path.
  useLayoutEffect(() => {
    if (route.current && glyph.current) {
      placeAlong(route.current, glyph.current, progress.current, 'ucak');
    }
  });

  useEffect(() => {
    const el = route.current;
    if (reduced || !el) {
      progress.current = 1;
      return;
    }
    const duration = letter ? LETTER_MS : TELEGRAM_MS;
    const animation = el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration,
      easing: 'linear',
      fill: 'both',
    });
    progress.current = 0;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      progress.current = Math.min(1, (now - start) / duration);
      if (route.current && glyph.current) {
        placeAlong(route.current, glyph.current, progress.current, 'ucak');
      }
      if (progress.current < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      animation.cancel();
    };
  }, [doc.id, stepKey, reduced, letter]);

  return (
    <g class={letter ? styles.letter : styles.telegram} data-dispatch={doc.kind}>
      {!letter && <path class={styles.poles} d={poles(from, to)} />}
      <path ref={route} class={styles.line} d={toPathData(points)} pathLength="1" />
      <g ref={glyph} class={styles.glyph}>
        {letter ? (
          <>
            <path class={styles.envelope} d="M-7 -5 H7 V5 H-7 Z" />
            <path class={styles.flap} d="M-7 -5 L0 1 L7 -5" />
            <circle class={styles.seal} cx="0" cy="1" r="1.8" />
          </>
        ) : (
          <>
            <circle class={styles.halo} r="6" />
            <circle class={styles.spark} r="2.5" />
          </>
        )}
      </g>
      {letter ? (
        <g class={styles.stamp} transform={`translate(${to[0]} ${to[1]})`}>
          <circle class={styles.stampRing} r="7" />
          <circle class={styles.stampWax} r="4.5" />
        </g>
      ) : (
        <circle class={styles.ring} cx={to[0]} cy={to[1]} r="5" />
      )}
    </g>
  );
}

export function TransmissionLayer({
  documents,
  places,
  project,
  stepKey,
  reduced,
  onAnimation,
}: Props) {
  const dispatched = documents.filter((d) => d.toPlaceId !== undefined);
  const longest = dispatched.some((d) => d.kind === 'mektup') ? LETTER_MS : TELEGRAM_MS;
  useEffect(() => {
    if (!reduced && dispatched.length > 0) onAnimation?.(longest + ARRIVE_MS);
    // Reported once per step; the callback itself is new on every render.
  }, [stepKey, reduced, dispatched.length, longest]);
  return (
    <g class={styles.layer} aria-hidden="true">
      {documents.map((doc) => {
        if (doc.toPlaceId === undefined) return null;
        const a = lonLat(places.get(doc.fromPlaceId));
        const b = lonLat(places.get(doc.toPlaceId));
        const from = a ? project(a) : null;
        const to = b ? project(b) : null;
        if (!from || !to) return null;
        return (
          <Dispatch
            // Keyed by step too, so the CSS arrival animations replay when a step is re-entered.
            key={`${doc.id}-${stepKey}`}
            doc={doc}
            from={from}
            to={to}
            stepKey={stepKey}
            reduced={reduced}
          />
        );
      })}
    </g>
  );
}
