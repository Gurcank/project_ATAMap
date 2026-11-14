// What the status cartouche shows for a step (SPEC K3, ARCHITECTURE ADR-15). Pure, no DOM.
// A field is shown only when the step's date surely falls inside the record's interval; a partial
// overlap (month or year precision) hides the field instead of guessing.
import type { DateValue, PlaceName, Tenure } from '../schema/index.ts';
import { daySpan, yearsBetween, type DaySpan } from './dateRange.ts';

export interface Age {
  /** Equal to max when the age is certain on that date. */
  min: number;
  max: number;
}

export interface Status {
  age: Age | null;
  rank: string | null;
  /** Every duty in force, in order of start (SPEC A26). */
  duties: string[];
  place: string | null;
}

/** Bounds a record surely covers: from its latest possible start to its earliest possible end. */
interface Interval {
  from: string;
  to: string | null;
  /** True when `to` is the start of what replaces it (a rank ends where the next one starts). */
  toExclusive: boolean;
}

function surelyWithin(step: DaySpan, iv: Interval): boolean {
  if (step.from < iv.from) return false;
  if (iv.to === null) return true;
  return iv.toExclusive ? step.to < iv.to : step.to <= iv.to;
}

export function ageAt(birth: DateValue, date: DateValue): Age | null {
  const b = daySpan(birth);
  const d = daySpan(date);
  const max = yearsBetween(b.from, d.to);
  if (max < 0) return null;
  return { min: Math.max(0, yearsBetween(b.to, d.from)), max };
}

const startOf = (t: Tenure) => daySpan(t.start).from;
const byStart = (a: Tenure, b: Tenure) => startOf(a).localeCompare(startOf(b));

function intervalOf(t: Tenure, nextRank: Tenure | undefined): Interval {
  const from = daySpan(t.start).to;
  if (t.end) return { from, to: daySpan(t.end).from, toExclusive: false };
  if (nextRank) return { from, to: startOf(nextRank), toExclusive: true };
  return { from, to: null, toExclusive: false };
}

export function activeTenures(
  tenures: readonly Tenure[],
  date: DateValue,
): { rank: Tenure | null; duties: Tenure[] } {
  const step = daySpan(date);
  const ranks = tenures.filter((t) => t.kind === 'rutbe').sort(byStart);
  const rank = ranks.find((t, i) => surelyWithin(step, intervalOf(t, ranks[i + 1]))) ?? null;
  const duties = tenures
    .filter((t) => t.kind === 'gorev' && surelyWithin(step, intervalOf(t, undefined)))
    .sort(byStart);
  return { rank, duties };
}

/** The period name in force on the date; null when none, or more than one, surely applies. */
export function placeNameAt(place: PlaceName, date: DateValue): string | null {
  const step = daySpan(date);
  const valid = place.names.filter((n) =>
    surelyWithin(step, {
      from: n.validFrom ? daySpan(n.validFrom).to : '',
      to: n.validTo ? daySpan(n.validTo).from : null,
      toExclusive: false,
    }),
  );
  return valid.length === 1 ? valid[0]!.name : null;
}

export function statusAt(
  input: { birth?: DateValue | undefined; tenures: readonly Tenure[]; place: PlaceName | null },
  date: DateValue,
): Status {
  const { rank, duties } = activeTenures(input.tenures, date);
  return {
    age: input.birth ? ageAt(input.birth, date) : null,
    rank: rank?.title ?? null,
    duties: duties.map((t) => t.title),
    place: input.place ? placeNameAt(input.place, date) : null,
  };
}

export const isStatusEmpty = (s: Status) =>
  s.age === null && s.rank === null && s.duties.length === 0 && s.place === null;
