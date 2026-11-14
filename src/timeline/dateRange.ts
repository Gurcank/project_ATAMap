// A DateValue as the span of days it may stand for (ARCHITECTURE ADR-15).
// "1915" may be any day of 1915; "1915-08" any day of August. Comparisons that must be certain
// (is this rank surely held on this step?) use these bounds instead of the iso string alone.
// Pure, shared by the build rules and the browser; strings compare as ISO days ("YYYY-MM-DD").
import type { DateValue } from '../schema/index.ts';

export interface DaySpan {
  /** Earliest day the value may stand for. */
  from: string;
  /** Latest day the value may stand for. */
  to: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function lastDayOfMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Earliest day of a "YYYY", "YYYY-MM" or "YYYY-MM-DD" string. */
function lower(iso: string): string {
  if (iso.length === 4) return `${iso}-01-01`;
  if (iso.length === 7) return `${iso}-01`;
  return iso;
}

/** Latest day of a "YYYY", "YYYY-MM" or "YYYY-MM-DD" string. */
function upper(iso: string): string {
  if (iso.length === 4) return `${iso}-12-31`;
  if (iso.length === 7) {
    const [y, m] = iso.split('-').map(Number) as [number, number];
    return `${iso}-${pad(lastDayOfMonth(y, m))}`;
  }
  return iso;
}

export function daySpan(d: Pick<DateValue, 'iso' | 'isoEnd' | 'precision'>): DaySpan {
  const end = d.precision === 'range' && d.isoEnd !== undefined ? d.isoEnd : d.iso;
  return { from: lower(d.iso), to: upper(end) };
}

/** Whole years between two ISO days (birthday on `day` counts as reached). */
export function yearsBetween(start: string, day: string): number {
  const years = Number(day.slice(0, 4)) - Number(start.slice(0, 4));
  return day.slice(5) < start.slice(5) ? years - 1 : years;
}
