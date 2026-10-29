// Application state (ARCHITECTURE ADR-09): signals around the pure step engine in src/timeline/.
import { computed, effect, signal } from '@preact/signals';
import { stepAnimationMs } from '../motion/motionPolicy.ts';
import type { DocumentRecord } from '../schema/index.ts';
import {
  buildSteps,
  nextStepId,
  prevStepId,
  remapOnModeChange,
  stepDuration,
  type StepMode,
} from '../timeline/steps.ts';
import { dataState, loadYearDocuments, type PublicSource } from './data.ts';

export const mode = signal<StepMode>('olay');
export const currentId = signal<string | null>(null);
export const autoplay = signal(false);
export const openDocumentId = signal<string | null>(null);
/** SPEC §4.2 "Hata: altlık dosyası": the 50m file failed, the embedded 110m drawing stays. */
export const baseLoadFailed = signal(false);

export const events = computed(() =>
  dataState.value.status === 'ready' ? dataState.value.data.events : [],
);
export const steps = computed(() => buildSteps(events.value, mode.value));
export const currentEvent = computed(
  () => events.value.find((e) => e.id === currentId.value) ?? null,
);
export const currentIndex = computed(() => steps.value.findIndex((s) => s.id === currentId.value));
export const canGoPrev = computed(() => prevStepId(steps.value, currentId.value) !== null);
export const canGoNext = computed(() => nextStepId(steps.value, currentId.value) !== null);
/** Modes that have at least one step; the selector disables the rest (no empty mode to land in). */
export const modeHasSteps = computed(() => ({
  olay: buildSteps(events.value, 'olay').length > 0,
  seyahat: buildSteps(events.value, 'seyahat').length > 0,
  yil: buildSteps(events.value, 'yil').length > 0,
}));

export const sources = computed<Record<string, PublicSource>>(() =>
  dataState.value.status === 'ready' ? dataState.value.data.sources : {},
);
export const currentPlace = computed(() => {
  const placeId = currentEvent.value?.placeId;
  if (dataState.value.status !== 'ready' || placeId === undefined) return null;
  return dataState.value.data.places.find((p) => p.id === placeId) ?? null;
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
export function setMode(next: StepMode): void {
  if (next === mode.value || !modeHasSteps.value[next]) return;
  autoplay.value = false;
  const id = remapOnModeChange(events.value, currentId.value, next);
  mode.value = next;
  goTo(id);
}
export function toggleAutoplay(): void {
  if (autoplay.value) {
    autoplay.value = false;
    return;
  }
  // From the last step, "Otomatik" starts over rather than doing nothing.
  if (!canGoNext.value) goTo(steps.value[0]?.id ?? null);
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

// ---- Autoplay (A2, A3): advances after the reading time; never opens a document. ----

effect(() => {
  if (!autoplay.value) return;
  const event = currentEvent.value;
  if (event === null) return;
  const timer = setTimeout(
    () => {
      const next = nextStepId(steps.peek(), event.id);
      if (next === null) autoplay.value = false;
      else currentId.value = next;
    },
    stepDuration(event, stepAnimationMs()),
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
