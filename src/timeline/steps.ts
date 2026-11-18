// Step engine: pure, no DOM (ARCHITECTURE ADR-09). How steps are ordered and how long a step lasts
// under autoplay live here and are covered by unit tests. Every event is one step (2026-11-17: the
// event / journey / year units were removed; the chronology line picks any step directly).

export interface TimelineEvent {
  id: string;
  date: { iso: string };
  text: string;
  journeyId?: string | undefined;
}

const byDate = (a: TimelineEvent, b: TimelineEvent) =>
  a.date.iso.localeCompare(b.date.iso) || a.id.localeCompare(b.id);

/** Every event in date order; events on the same date by id, so the order is stable. */
export function buildSteps<T extends TimelineEvent>(events: readonly T[]): T[] {
  return [...events].sort(byDate);
}

export function indexOfStep(steps: readonly TimelineEvent[], id: string | null): number {
  return id === null ? -1 : steps.findIndex((s) => s.id === id);
}

export function nextStepId(steps: readonly TimelineEvent[], id: string | null): string | null {
  const i = indexOfStep(steps, id);
  return steps[i + 1]?.id ?? null;
}

export function prevStepId(steps: readonly TimelineEvent[], id: string | null): string | null {
  const i = indexOfStep(steps, id);
  return i > 0 ? (steps[i - 1]?.id ?? null) : null;
}

/**
 * A2 (2026-11-17): the step's own animation plus a reading time, divided by the chosen speed.
 * 30 ms per character is about 33 characters a second; the reading time stays between 1.5 and 5 s
 * so a one-line step is not rushed and a long one does not stall the tour.
 */
export const READING_MS_PER_CHAR = 30;
export const MIN_READING_MS = 1500;
export const MAX_READING_MS = 5000;
export const SPEEDS = [1, 2] as const;
export type Speed = (typeof SPEEDS)[number];

export function stepDuration(
  event: Pick<TimelineEvent, 'text'>,
  animationMs: number,
  speed: Speed = 1,
): number {
  const reading = Math.min(
    MAX_READING_MS,
    Math.max(MIN_READING_MS, event.text.length * READING_MS_PER_CHAR),
  );
  return Math.round((animationMs + reading) / speed);
}
