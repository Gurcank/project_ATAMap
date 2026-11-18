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
/** The loupe shows this many days around the pointer: about two years either side. */
const LOUPE_SPAN = 4 * 365;
const MONTH = 30.44;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface Loupe {
  /** First day shown in the loupe. */
  start: number;
}

// The chronology as a radio tuning dial (2026-11-17), on a true time scale: a lit dial face in a
// bakelite bezel, a tick for every year (longer every five, with figures every ten), journeys
// marked like stations under the scale, and a red needle at the current step.
//   Pointer (2026-11-18): pressing the dial opens a loupe above it with the two years either side
//   of the pressed day spread over the whole width, every event its own tick; the pointer picks
//   among them and letting go takes that step. Moving past either end slides the loupe along. Esc
//   cancels. The camera only moves on release, not on every pixel.
//   Keyboard and screen readers: a native range input lies over the face; arrow keys move one
//   step, Page keys about a year, Home and End go to the ends.
export function Timeline() {
  const all = steps.value;
  const count = all.length;
  const current = currentIndex.value;
  const [preview, setPreview] = useState<number | null>(null);
  const [loupe, setLoupe] = useState<Loupe | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const face = useRef<HTMLDivElement>(null);
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
    if (loupe) {
      el.style.setProperty('--loupe-at', String(((days[shown] ?? 0) - loupe.start) / LOUPE_SPAN));
    }
    el.querySelectorAll<HTMLElement>('[data-at]').forEach((li) => {
      li.style.setProperty('--at', li.dataset.at ?? '0');
    });
  }, [shown, days, loupe]);

  // Esc while the loupe is open cancels the choice.
  useLayoutEffect(() => {
    if (!loupe) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setLoupe(null);
      setPreview(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [loupe]);

  if (count === 0 || current < 0) return null;
  const step = all[shown];
  const valueText = step ? `${formatDate(step.date)}, ${step.title}` : '';
  const pick = (day: number) => nearest(days, day);

  /** Where the pointer is across the scale, 0..1 (unclamped past the ends). */
  const fractionAt = (clientX: number) => {
    const box = face.current?.getBoundingClientRect();
    if (!box) return 0;
    const inset = 8; // the scale's own side margin (--space-8)
    return (clientX - box.left - inset) / Math.max(1, box.width - 2 * inset);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault(); // the loupe takes over from the native slider's drag
    (e.currentTarget as HTMLInputElement).focus();
    (e.currentTarget as HTMLInputElement).setPointerCapture(e.pointerId);
    const day = clamp(fractionAt(e.clientX), 0, 1) * SPAN_DAYS;
    setLoupe({ start: clamp(day - LOUPE_SPAN / 2, 0, SPAN_DAYS - LOUPE_SPAN) });
    setPreview(pick(day));
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!loupe) return;
    const f = fractionAt(e.clientX);
    // Past an end, the loupe slides so the pointer's day stays at that end.
    let start = loupe.start;
    if (f < 0) start = clamp(start + f * LOUPE_SPAN, 0, SPAN_DAYS - LOUPE_SPAN);
    if (f > 1) start = clamp(start + (f - 1) * LOUPE_SPAN, 0, SPAN_DAYS - LOUPE_SPAN);
    if (start !== loupe.start) setLoupe({ start });
    setPreview(pick(start + clamp(f, 0, 1) * LOUPE_SPAN));
  };

  const onPointerUp = () => {
    if (!loupe) return;
    if (preview !== null) goToIndex(preview);
    setLoupe(null);
    setPreview(null);
  };

  const onPointerCancel = () => {
    setLoupe(null);
    setPreview(null);
  };

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
      {loupe && <LoupeView start={loupe.start} all={all} days={days} shown={shown} />}
      <div class={styles.face} ref={face} aria-hidden="true">
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onInput={(e) => setPreview(pick(Number(e.currentTarget.value)))}
        onChange={(e) => {
          setPreview(null);
          goToIndex(pick(Number(e.currentTarget.value)));
        }}
        onBlur={() => setPreview(null)}
      />
      {preview !== null && step && !loupe && (
        <p class={styles.bubble} aria-hidden="true">
          <span class={styles.bubbleDate}>{formatDate(step.date)}</span>
          {step.title}
        </p>
      )}
    </div>
  );
}

interface LoupeProps {
  start: number;
  all: typeof steps.value;
  days: number[];
  shown: number;
}

/**
 * The magnified stretch of the dial: months and years ticked, every event in it a tick of its own
 * (journeys in the route colour), the chosen one marked by the needle and named on top.
 */
function LoupeView({ start, all, days, shown }: LoupeProps) {
  const x = (day: number) => ((day - start) / LOUPE_SPAN) * 1000;
  const firstMonth = Math.ceil(start / MONTH);
  const months = Array.from({ length: Math.floor(LOUPE_SPAN / MONTH) + 1 }, (_, i) => {
    const day = (firstMonth + i) * MONTH;
    return day <= start + LOUPE_SPAN ? [day] : [];
  }).flat();
  const startYear = FIRST_YEAR + Math.floor(start / 365.25);
  const years = Array.from({ length: 6 }, (_, i) => startYear + i).filter((y) => {
    const d = dayOf(String(y));
    return d >= start && d <= start + LOUPE_SPAN;
  });
  const inView = all.flatMap((s, i) => {
    const d = days[i] ?? 0;
    return d >= start && d <= start + LOUPE_SPAN ? [{ s, i, d }] : [];
  });
  const chosen = all[shown];
  return (
    <div class={styles.loupe} aria-hidden="true">
      {chosen && (
        <p class={styles.loupeLabel}>
          <span class={styles.bubbleDate}>{formatDate(chosen.date)}</span>
          {chosen.title}
        </p>
      )}
      <div class={styles.loupeFace}>
        <svg class={styles.loupeScale} viewBox="0 0 1000 40" preserveAspectRatio="none">
          {months.map((d) => (
            <line key={d} class={styles.year} x1={x(d)} x2={x(d)} y1="40" y2="34" />
          ))}
          {years.map((y) => (
            <line
              key={y}
              class={styles.decade}
              x1={x(dayOf(String(y)))}
              x2={x(dayOf(String(y)))}
              y1="40"
              y2="26"
            />
          ))}
          {inView.map(({ s, i, d }) => (
            <line
              key={s.id}
              class={`${s.journeyId ? styles.eventJourney : styles.eventTick} ${i === shown ? styles.eventChosen : ''}`}
              x1={x(d)}
              x2={x(d)}
              y1="4"
              y2="22"
            />
          ))}
        </svg>
        <ol class={styles.loupeYears}>
          {years.map((y) => (
            <li key={y} data-at={(dayOf(String(y)) - start) / LOUPE_SPAN}>
              {y}
            </li>
          ))}
        </ol>
        <span class={styles.loupeNeedle} />
      </div>
    </div>
  );
}
