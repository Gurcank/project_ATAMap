// Loading of the generated JSON (public/data) with the states SPEC §4.2 asks for.
import { signal } from '@preact/signals';
import type { DocumentRecord, EventRecord, PlaceName } from '../schema/index.ts';

export interface PublicSource {
  institution: string;
  citation: string;
  url?: string;
  page?: string;
  rights: string;
  licence?: string;
}

export interface StepsData {
  events: EventRecord[];
  places: PlaceName[];
  sources: Record<string, PublicSource>;
}

export interface YearDocuments {
  documents: DocumentRecord[];
  sources: Record<string, PublicSource>;
}

export type DataState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: StepsData };

export const dataState = signal<DataState>({ status: 'loading' });

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function loadData(): Promise<void> {
  dataState.value = { status: 'loading' };
  try {
    const data = await getJson<StepsData>('/data/steps.json');
    dataState.value = { status: 'ready', data };
  } catch {
    dataState.value = { status: 'error' };
  }
}

// Documents are split by year (ADR-07); a year is fetched once, the first time a step needs it.
const yearCache = new Map<number, Promise<YearDocuments>>();

export function loadYearDocuments(year: number): Promise<YearDocuments> {
  let cached = yearCache.get(year);
  if (!cached) {
    cached = getJson<YearDocuments>(`/data/documents/${year}.json`);
    // A failed year must be retryable, so it never stays in the cache.
    cached.catch(() => yearCache.delete(year));
    yearCache.set(year, cached);
  }
  return cached;
}
