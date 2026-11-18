// Application state (ARCHITECTURE ADR-09): signals around the pure step engine in src/timeline/.
import { computed, effect, signal } from '@preact/signals';
import { buildMatcher } from '../format/glossary.ts';
import { stepAnimationMs } from '../motion/motionPolicy.ts';
import type { DocumentRecord } from '../schema/index.ts';
import { activeBorderChanges } from '../timeline/borders.ts';
import { statusAt, type Status } from '../timeline/status.ts';
import { buildSteps, nextStepId, prevStepId, stepDuration, type Speed } from '../timeline/steps.ts';
import { dataState, loadYearDocuments, type PublicSource } from './data.ts';

export const currentId = signal<string | null>(null);
export const autoplay = signal(false);
/** Autoplay speed (2026-11-17): 1 or 2 times as fast. */
export const speed = signal<Speed>(1);
export const openDocumentId = signal<string | null>(null);
/** SPEC §4.2 "Hata: altlık dosyası": the 50m file failed, the embedded 110m drawing stays. */
export const baseLoadFailed = signal(false);

export const events = computed(() =>
  dataState.value.status === 'ready' ? dataState.value.data.events : [],
);
export const steps = computed(() => buildSteps(events.value));
export const currentEvent = computed(
  () => events.value.find((e) => e.id === currentId.value) ?? null,
);
export const currentIndex = computed(() => steps.value.findIndex((s) => s.id === currentId.value));
export const canGoPrev = computed(() => prevStepId(steps.value, currentId.value) !== null);
export const canGoNext = computed(() => nextStepId(steps.value, currentId.value) !== null);

export const sources = computed<Record<string, PublicSource>>(() =>
  dataState.value.status === 'ready' ? dataState.value.data.sources : {},
);
/** Glossary entries by id, and the matcher that finds their words in a text. */
export const glossaryById = computed(() => {
  const list = dataState.value.status === 'ready' ? (dataState.value.data.glossary ?? []) : [];
  return new Map(list.map((g) => [g.id, g]));
});
export const glossaryMatcher = computed(() => buildMatcher([...glossaryById.value.values()]));
/** The one glossary card open at a time: the opening term's own key. */
export const openGlossaryKey = signal<string | null>(null);

export const placeById = computed(() => {
  const places = dataState.value.status === 'ready' ? dataState.value.data.places : [];
  return new Map(places.map((p) => [p.id, p]));
});

/** The journey the current step belongs to (SPEC §5.2 M1/M2), if any. */
export const currentJourney = computed(() => {
  const id = currentEvent.value?.journeyId;
  if (dataState.value.status !== 'ready' || id === undefined) return null;
  return dataState.value.data.journeys.find((j) => j.id === id) ?? null;
});

/** Per polity, the border change in force on the step's date (see activeBorderChanges). */
export const activeBorders = computed(() => {
  const event = currentEvent.value;
  if (event === null || dataState.value.status !== 'ready') return [];
  return activeBorderChanges(dataState.value.data.borders, event.date.iso);
});

export const currentPlace = computed(() => {
  const placeId = currentEvent.value?.placeId;
  if (dataState.value.status !== 'ready' || placeId === undefined) return null;
  return dataState.value.data.places.find((p) => p.id === placeId) ?? null;
});

/** Age, rank, duties and place on the step's date (SPEC K3, ADR-15). */
export const currentStatus = computed<Status | null>(() => {
  const event = currentEvent.value;
  if (event === null || dataState.value.status !== 'ready') return null;
  const { birth, tenures } = dataState.value.data;
  return statusAt({ birth, tenures, place: currentPlace.value }, event.date);
});

// ---- Navigation. Any manual control stops autoplay first (SPEC §5.1). ----

export function goTo(id: string | null): void {
  if (id === null) return;
  currentId.value = id;
}
export function goNext(): void {
  autoplay.value = false;
  goTo(nextStepId(steps.value, currentId.value));
}
export function goPrev(): void {
  autoplay.value = false;
  goTo(prevStepId(steps.value, currentId.value));
}
/** The chronology line picks a step by its position. */
export function goToIndex(index: number): void {
  autoplay.value = false;
  goTo(steps.value[index]?.id ?? null);
}
export function toggleSpeed(): void {
  speed.value = speed.value === 1 ? 2 : 1;
}
export function toggleAutoplay(): void {
  if (autoplay.value) {
    autoplay.value = false;
    return;
  }
  // From the last step, "Otomatik" starts over rather than doing nothing.
  if (!canGoNext.value) goTo(steps.value[0]?.id ?? null);
  timing = { stepId: '', since: 0 }; // the current step is timed afresh
  autoplay.value = true;
}

// ---- URL: #adim=<eventId> (ADR-09). replaceState, so Back does not walk the steps. ----

const HASH_KEY = 'adim';
const idFromHash = () => new URLSearchParams(location.hash.slice(1)).get(HASH_KEY);

effect(() => {
  const id = currentId.value;
  if (id === null) return;
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.get(HASH_KEY) === id) return;
  params.set(HASH_KEY, id);
  history.replaceState(null, '', `#${params.toString()}`);
});

// Pick the first step once the data arrives; a valid #adim wins.
effect(() => {
  if (dataState.value.status !== 'ready' || currentId.peek() !== null) return;
  const fromHash = idFromHash();
  const known = events.value.some((e) => e.id === fromHash);
  currentId.value = known ? fromHash : (steps.value[0]?.id ?? null);
});

window.addEventListener('hashchange', () => {
  const id = idFromHash();
  if (id !== null && id !== currentId.value && events.value.some((e) => e.id === id)) {
    currentId.value = id;
  }
});

// ---- Autoplay (A2, A3): advances after the animation and reading time; never opens a document. ----

/**
 * How long the current step's own animation runs. The map layers report it once they know (a
 * route's length is only known on screen), so autoplay never moves on before the vehicle arrives.
 */
const reportedAnimation = signal<{ stepId: string; ms: number } | null>(null);
export function reportStepAnimation(stepId: string, ms: number): void {
  const current = reportedAnimation.peek();
  if (current?.stepId === stepId && current.ms >= ms) return;
  reportedAnimation.value = { stepId, ms };
}

/** When autoplay started timing the current step. */
let timing = { stepId: '', since: 0 };

effect(() => {
  if (!autoplay.value) return;
  const event = currentEvent.value;
  if (event === null) return;
  if (timing.stepId !== event.id) timing = { stepId: event.id, since: performance.now() };
  const reported = reportedAnimation.value;
  const animation = reported?.stepId === event.id ? reported.ms : stepAnimationMs();
  // A late report re-arms the timer; the time already spent on the step counts.
  const remaining =
    stepDuration(event, animation, speed.value) - (performance.now() - timing.since);
  const timer = setTimeout(
    () => {
      const next = nextStepId(steps.peek(), event.id);
      if (next === null) autoplay.value = false;
      else currentId.value = next;
    },
    Math.max(0, remaining),
  );
  return () => clearTimeout(timer);
});

// ---- Documents of the current step ----

export type DocumentsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; year: number }
  | { status: 'ready'; documents: DocumentRecord[]; sources: Record<string, PublicSource> };

export const documentsState = signal<DocumentsState>({ status: 'idle' });
export const retryDocuments = signal(0);

effect(() => {
  const event = currentEvent.value;
  void retryDocuments.value; // dependency: bumping it re-runs the load
  openDocumentId.value = null; // a document never outlives its step
  if (event === null || !event.documentIds || event.documentIds.length === 0) {
    documentsState.value = { status: 'idle' };
    return;
  }
  const year = Number(event.date.iso.slice(0, 4));
  const wanted = new Set(event.documentIds);
  let stale = false;
  // The previous step's markers stay until the new ones arrive (SPEC §4.2: no spinner).
  loadYearDocuments(year).then(
    (res) => {
      if (stale) return;
      documentsState.value = {
        status: 'ready',
        documents: res.documents.filter((d) => wanted.has(d.id)),
        sources: res.sources,
      };
    },
    () => {
      if (!stale) documentsState.value = { status: 'error', year };
    },
  );
  return () => {
    stale = true;
  };
});

export const openDocument = computed(() => {
  const state = documentsState.value;
  if (state.status !== 'ready' || openDocumentId.value === null) return null;
  return state.documents.find((d) => d.id === openDocumentId.value) ?? null;
});
