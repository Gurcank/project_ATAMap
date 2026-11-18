import { useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { formatDate } from '../format/date.ts';
import { currentIndex, goNext, goPrev, goToIndex, steps } from '../state/app.ts';
import styles from './Timeline.module.css';

const FIRST_YEAR = 1881;
const LAST_YEAR = 1938;
const DAY = 86_400_000;
const START = Date.UTC(FIRST_YEAR, 0, 1);
const END = Date.UTC(LAST_YEAR, 11, 31);
const SPAN_DAYS = Math.round((END - START) / DAY);

/** Days since 1 January 1881 for an ISO date of year, month or day precision. */
function dayOf(iso: string): number {
  const [y = FIRST_YEAR, m = 1, d = 1] = iso.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - START) / DAY);
}

/** Index of the step closest in time to a day; steps are in date order. */
function nearest(days: number[], day: number): number {
  let best = 0;
  days.forEach((d, i) => {
    if (Math.abs(d - day) < Math.abs((days[best] ?? 0) - day)) best = i;
  });
  return best;
}

const DECADES = [1890, 1900, 1910, 1920, 1930];
const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
/** Where each tick ends (it starts on the baseline at y 22 of 40): longer for rounder years. */
const TICK = { year: 16, lustrum: 12, decade: 6 } as const;
const along = (day: number) => day / SPAN_DAYS;

// The chronology as a radio tuning dial (2026-11-17), on a true time scale: a lit dial face in a
// bakelite bezel, a tick for every year (longer every five, with figures every ten), journeys
// marked like stations under the scale, and a red needle at the current step. A native range input
// lies over the face (one value per day) and gives dragging, clicking and screen-reader support;
// the needle snaps to the step nearest in time. While dragging, the date and title of that
// step show above it, and the step is taken when the thumb is let go, so the camera does not fly
// on every pixel. Arrow keys move one step, Page keys about a year.
export function Timeline() {
  const all = steps.value;
  const count = all.length;
  const current = currentIndex.value;
  const [preview, setPreview] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const shown = preview ?? current;

  const days = useMemo(() => all.map((s) => dayOf(s.date.iso)), [all]);
  const journeys = useMemo(
    () => all.flatMap((s, i) => (s.journeyId ? [along(days[i] ?? 0)] : [])),
    [all, days],
  );

  // Positions go through the CSSOM (CSP forbids style attributes): the thumb's, for the preview
  // bubble, and each year label's.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    el.style.setProperty('--at', String(along(days[shown] ?? 0)));
    el.querySelectorAll<HTMLElement>('[data-at]').forEach((li) => {
      li.style.setProperty('--at', li.dataset.at ?? '0');
    });
  }, [shown, days]);

  if (count === 0 || current < 0) return null;
  const step = all[shown];
  const valueText = step ? `${formatDate(step.date)}, ${step.title}` : '';
  const pick = (day: number) => nearest(days, day);

  const onKeyDown = (e: KeyboardEvent) => {
    const jump: Record<string, () => void> = {
      ArrowRight: goNext,
      ArrowUp: goNext,
      ArrowLeft: goPrev,
      ArrowDown: goPrev,
      PageUp: () => goToIndex(pick((days[current] ?? 0) + 365)),
      PageDown: () => goToIndex(pick((days[current] ?? 0) - 365)),
      Home: () => goToIndex(0),
      End: () => goToIndex(count - 1),
    };
    const action = jump[e.key];
    if (!action) return;
    e.preventDefault();
    setPreview(null);
    action();
  };

  return (
    <div class={styles.timeline} ref={root}>
      <div class={styles.face} aria-hidden="true">
        <svg class={styles.scale} viewBox="0 0 1000 40" preserveAspectRatio="none">
          {YEARS.map((year) => {
            const x = along(dayOf(String(year))) * 1000;
            const size = year % 10 === 0 ? 'decade' : year % 5 === 0 ? 'lustrum' : 'year';
            return <line key={year} class={styles[size]} x1={x} x2={x} y1="22" y2={TICK[size]} />;
          })}
          <line class={styles.baseline} x1="0" x2="1000" y1="22" y2="22" />
          {journeys.map((x, i) => (
            <circle key={i} class={styles.station} cx={x * 1000} cy="31" r="1.6" />
          ))}
        </svg>
        <span class={styles.needle} />
      </div>
      <ol class={styles.years} aria-hidden="true">
        <li data-at="0">{FIRST_YEAR}</li>
        {DECADES.map((year, i) => (
          <li
            key={year}
            class={i % 2 === 0 ? styles.minor : styles.major}
            data-at={along(dayOf(String(year)))}
          >
            {year}
          </li>
        ))}
        <li data-at="1">{LAST_YEAR}</li>
      </ol>
      <input
        class={styles.range}
        type="range"
        min="0"
        max={SPAN_DAYS}
        step="1"
        value={days[shown] ?? 0}
        aria-label="Kronoloji"
        aria-valuetext={valueText}
        onKeyDown={onKeyDown}
        onInput={(e) => setPreview(pick(Number(e.currentTarget.value)))}
        onChange={(e) => {
          setPreview(null);
          goToIndex(pick(Number(e.currentTarget.value)));
        }}
        onBlur={() => setPreview(null)}
      />
      {preview !== null && step && (
        <p class={styles.bubble} aria-hidden="true">
          <span class={styles.bubbleDate}>{formatDate(step.date)}</span>
          {step.title}
        </p>
      )}
    </div>
  );
}
