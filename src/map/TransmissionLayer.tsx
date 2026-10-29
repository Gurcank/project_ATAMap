// Letter and telegram dispatch (SPEC §5.2 M3, M4). Only documents with a known recipient place
// are animated (`toPlaceId`); the others simply have their marker.
//   M3 letter    a sealed envelope travels an arc from sender to recipient (1.2 s); a seal stays
//   M4 telegram  a thin straight line is drawn between the two points, a pulse runs along it (0.8 s)
// Under reduced motion the end state is shown at once (SPEC §5.3).
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
}

// Same values as --dur-letter and --dur-telegram in tokens.css (JS cannot read them cheaply).
const LETTER_MS = 1200;
const TELEGRAM_MS = 800;

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
      <path ref={route} class={styles.line} d={toPathData(points)} pathLength="1" />
      <g ref={glyph} class={styles.glyph}>
        {letter ? (
          <>
            <path d="M-7 -5 H7 V5 H-7 Z M-7 -5 L0 1 L7 -5" />
            <circle class={styles.seal} cx="0" cy="1" r="2" />
          </>
        ) : (
          <circle r="3.5" />
        )}
      </g>
      {letter && <circle class={styles.stamp} cx={to[0]} cy={to[1]} r="4" />}
    </g>
  );
}

export function TransmissionLayer({ documents, places, project, stepKey, reduced }: Props) {
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
            key={doc.id}
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
