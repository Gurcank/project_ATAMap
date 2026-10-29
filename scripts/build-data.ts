// data/*.json -> public/data/ (ARCHITECTURE ADR-07).
// Validates structure with Zod, applies SPEC §6 rules 1-8, then writes:
//   public/data/steps.json            events, places, journeys, borders, cited sources
//   public/data/documents/<year>.json documents of that year, cited sources
// Exits non-zero on any fatal violation, so Vercel stops before publishing.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ZodType } from 'zod';
import {
  BordersFile,
  DocumentsFile,
  EventsFile,
  JourneysFile,
  PlacesFile,
  SourcesFile,
} from '../src/schema/index.ts';
import { applyRules, type Dataset, type ReferenceEntry } from './lib/rules.ts';

const ROOT = join(import.meta.dirname, '..');
const DATA = join(ROOT, 'data');
const OUT = join(ROOT, 'public', 'data');

let schemaErrors = 0;
function load<K extends string, T>(file: string, key: K, schema: ZodType<Record<K, T[]>>): T[] {
  const path = join(DATA, file);
  if (!existsSync(path)) return [];
  const parsed = schema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (parsed.success) return parsed.data[key];
  for (const issue of parsed.error.issues) {
    console.error(`ŞEMA HATASI ${file}: ${issue.path.join('.')}: ${issue.message}`);
  }
  schemaErrors += parsed.error.issues.length;
  return [];
}

const reference = new Map<string, ReferenceEntry>();
const refDir = join(DATA, 'reference');
if (existsSync(refDir)) {
  for (const name of readdirSync(refDir).filter((f) => f.endsWith('.meta.json'))) {
    const docId = name.slice(0, -'.meta.json'.length);
    const txt = join(refDir, `${docId}.txt`);
    if (!existsSync(txt)) continue;
    reference.set(docId, {
      text: readFileSync(txt, 'utf8'),
      meta: JSON.parse(readFileSync(join(refDir, name), 'utf8')) as ReferenceEntry['meta'],
    });
  }
}

const dataset: Dataset = {
  sources: load('sources.json', 'sources', SourcesFile as never),
  events: load('events.json', 'events', EventsFile as never),
  documents: load('documents.json', 'documents', DocumentsFile as never),
  journeys: load('journeys.json', 'journeys', JourneysFile as never),
  borders: load('borders.json', 'borders', BordersFile as never),
  places: load('places.json', 'places', PlacesFile as never),
  reference,
};
if (schemaErrors > 0) {
  console.error(`build-data: ${schemaErrors} şema hatası. Çıktı yazılmadı.`);
  process.exit(1);
}

const { kept, violations } = applyRules(dataset);

const label = { fatal: 'HATA', drop: 'ELENDİ', warn: 'UYARI' } as const;
for (const v of violations) {
  const kind = v.fatal ? label.fatal : v.rule === 'uyarı' ? label.warn : label.drop;
  const rule = typeof v.rule === 'number' ? `kural ${v.rule}` : v.rule;
  (v.fatal ? console.error : console.log)(`${kind} [${rule}] ${v.id}: ${v.message}`);
}
const fatal = violations.filter((v) => v.fatal).length;
if (fatal > 0) {
  console.error(`build-data: ${fatal} ihlal. Çıktı yazılmadı.`);
  process.exit(1);
}

// Public form of a source: what the künye line needs, nothing about our bookkeeping.
const sourceById = new Map(kept.sources.map((s) => [s.id, s]));
const publicSources = (ids: Iterable<string>) => {
  const out: Record<string, unknown> = {};
  for (const id of [...new Set(ids)].sort()) {
    const s = sourceById.get(id);
    if (!s) continue;
    out[id] = {
      institution: s.institution,
      citation: s.citation,
      ...(s.url ? { url: s.url } : {}),
      ...(s.page ? { page: s.page } : {}),
      rights: s.rights,
      ...(s.licence ? { licence: s.licence } : {}),
    };
  }
  return out;
};

// Strips our own `$note` bookkeeping, at any depth.
const clean = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value, (k, v: unknown) => (k === '$note' ? undefined : v))) as T;

// Source ids a kept record cites (for the cited-sources map).
const idsIn = (value: unknown): string[] => {
  const ids: string[] = [];
  JSON.stringify(value, (k, v: unknown) => {
    if (k === 'sources' || k === 'geometrySources') ids.push(...(v as string[]));
    return v;
  });
  return ids;
};

const byDate =
  <T extends { id: string }>(get: (r: T) => string) =>
  (a: T, b: T) =>
    get(a).localeCompare(get(b)) || a.id.localeCompare(b.id);

const events = [...kept.events].sort(byDate((e) => e.date.iso));
const journeys = [...kept.journeys].sort(byDate((j) => j.legs[0]?.departure.iso ?? ''));
const borders = [...kept.borders].sort(byDate((b) => b.effective.iso));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'documents'), { recursive: true });

const steps = { events, places: kept.places, journeys, borders };
writeFileSync(
  join(OUT, 'steps.json'),
  JSON.stringify(clean({ ...steps, sources: publicSources(idsIn(steps)) })) + '\n',
);

const byYear = new Map<string, typeof kept.documents>();
for (const d of [...kept.documents].sort(byDate((x) => x.date.iso))) {
  const year = d.date.iso.slice(0, 4);
  byYear.set(year, [...(byYear.get(year) ?? []), d]);
}
for (const [year, documents] of byYear) {
  writeFileSync(
    join(OUT, 'documents', `${year}.json`),
    JSON.stringify(clean({ documents, sources: publicSources(idsIn(documents)) })) + '\n',
  );
}

const dropped = violations.filter((v) => !v.fatal && v.rule !== 'uyarı').length;
console.log(
  `build-data: ${events.length} olay, ${kept.documents.length} belge (${byYear.size} yıl dosyası), ` +
    `${kept.places.length} yer, ${journeys.length} seyahat, ${borders.length} sınır; ${dropped} kayıt elendi.`,
);
