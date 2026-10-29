// Step engine: pure, no DOM (ARCHITECTURE ADR-09). Everything that could change while A1 is open
// (what a mode switch keeps, how long a step lasts) lives here and is covered by unit tests.

export type StepMode = 'olay' | 'seyahat' | 'yil';

export interface TimelineEvent {
  id: string;
  date: { iso: string };
  text: string;
  journeyId?: string | undefined;
}

const byDate = (a: TimelineEvent, b: TimelineEvent) =>
  a.date.iso.localeCompare(b.date.iso) || a.id.localeCompare(b.id);

/**
 * Steps for a mode (SPEC §5.1).
 *  olay    every event
 *  seyahat events that belong to a journey (A5: others are skipped, their markers stay on the map)
 *  yil     the first event of each year; years without records never appear (A4)
 */
export function buildSteps<T extends TimelineEvent>(events: readonly T[], mode: StepMode): T[] {
  const sorted = [...events].sort(byDate);
  if (mode === 'olay') return sorted;
  if (mode === 'seyahat') return sorted.filter((e) => e.journeyId !== undefined);
  const seen = new Set<string>();
  return sorted.filter((e) => {
    const year = e.date.iso.slice(0, 4);
    if (seen.has(year)) return false;
    seen.add(year);
    return true;
  });
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
 * A1, first rule: on a mode switch keep the latest step of the new mode that is not later than the
 * current event, so the map never jumps forward in time. If every step is later, take the first.
 * Returns null only when the new mode has no steps at all.
 */
export function remapOnModeChange<T extends TimelineEvent>(
  events: readonly T[],
  currentId: string | null,
  newMode: StepMode,
): string | null {
  const steps = buildSteps(events, newMode);
  if (steps.length === 0) return null;
  const current = events.find((e) => e.id === currentId);
  if (!current) return steps[0]?.id ?? null;
  const notLater = steps.filter((s) => byDate(s, current) <= 0);
  return (notLater.at(-1) ?? steps[0])?.id ?? null;
}

/** A2: animation time plus reading time. 55 ms per character is about 18 characters a second. */
export const READING_MS_PER_CHAR = 55;
export const MIN_READING_MS = 2500;

export function stepDuration(event: Pick<TimelineEvent, 'text'>, animationMs: number): number {
  return animationMs + Math.max(MIN_READING_MS, event.text.length * READING_MS_PER_CHAR);
}
