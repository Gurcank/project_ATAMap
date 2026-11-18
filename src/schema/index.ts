// Zod schema for the data files (SPEC §6, ARCHITECTURE ADR-07).
// Only scripts and tests import this file's runtime values. Browser code imports the types alone
// (`import type`), so Zod never reaches the bundle.
//
// Records refer to sources by id: every `sources: string[]` below holds ids from sources.json.
// Structure is checked here; the eight build rules and referential integrity live in
// scripts/lib/rules.ts so they can report by rule number.
import { z } from 'zod';

const note = z.string().optional();

export const DatePrecision = z.enum(['day', 'month', 'year', 'range']);

const ISO_DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const ISO_YEAR = /^\d{4}$/;
const ISO_ANY = (s: string) => ISO_DAY.test(s) || ISO_MONTH.test(s) || ISO_YEAR.test(s);
const ISO_FOR = { day: ISO_DAY, month: ISO_MONTH, year: ISO_YEAR } as const;

export const DateValue = z
  .strictObject({
    iso: z.string().refine(ISO_ANY, 'ISO 8601 tarih bekleniyor (YYYY-AA-GG, YYYY-AA veya YYYY)'),
    isoEnd: z.string().refine(ISO_ANY, 'ISO 8601 tarih bekleniyor').optional(),
    precision: DatePrecision,
    approximate: z.boolean(),
    original: z.string().optional(),
    conversion: z.enum(['source', 'ttk-cevirici']).optional(),
    primaryDocument: z.boolean().optional(),
    // A date agreed by convention rather than the actual one, as the sources say (SPEC A25).
    conventional: z.boolean().optional(),
    sources: z.array(z.string()),
    $note: note,
  })
  .superRefine((d, ctx) => {
    if (d.precision !== 'range') {
      if (!ISO_FOR[d.precision].test(d.iso)) {
        ctx.addIssue({
          code: 'custom',
          path: ['iso'],
          message: `precision "${d.precision}" ile iso biçimi uyuşmuyor`,
        });
      }
      if (d.isoEnd !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['isoEnd'],
          message: 'isoEnd yalnız precision "range" iken yazılır',
        });
      }
    } else if (d.isoEnd === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['isoEnd'],
        message: 'precision "range" için isoEnd zorunlu',
      });
    } else if (d.isoEnd < d.iso) {
      ctx.addIssue({
        code: 'custom',
        path: ['isoEnd'],
        message: 'isoEnd, iso tarihinden önce olamaz',
      });
    }
  });

// 'hakki-sakli-olgu': an official state publication whose text is reserved; facts only (K5).
export const RightsStatus = z.enum(['kamu-mali', 'acik-lisans', 'hakki-sakli-olgu', 'telifli']);

export const SourceRecord = z.strictObject({
  id: z.string().min(1),
  institution: z.string().min(1),
  citation: z.string().min(1),
  url: z.url().optional(),
  page: z.string().optional(),
  archiveRef: z.string().optional(),
  accessedAt: z.string().regex(ISO_DAY),
  rights: RightsStatus,
  licence: z.string().optional(),
  // Rule 8 rejects `free !== true` with a report; the schema only checks the type.
  free: z.boolean(),
  verified: z.boolean(),
  // Ids of sources this one cites as its own basis: the two are not independent (rule 10).
  basedOn: z.array(z.string()).optional(),
  // A state institution's publication: one is enough for a date or a place (rule 5, K5).
  official: z.boolean().optional(),
  $note: note,
});

export const GeoPoint = z.strictObject({
  lon: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  sources: z.array(z.string()),
  $note: note,
});

export const EventRecord = z.strictObject({
  id: z.string().min(1),
  date: DateValue,
  title: z.string().min(1).max(60),
  text: z.string().min(1).max(240),
  placeId: z.string().optional(),
  sources: z.array(z.string()),
  documentIds: z.array(z.string()).optional(),
  journeyId: z.string().optional(),
  $note: note,
});

export const DocumentRecord = z.strictObject({
  id: z.string().min(1),
  kind: z.enum(['mektup', 'telgraf', 'konusma']),
  date: DateValue,
  fromPlaceId: z.string(),
  toPlaceId: z.string().optional(),
  sender: z.string().min(1),
  recipient: z.string().optional(),
  originalScript: z.enum(['latin', 'arap']),
  fullText: z.string().optional(),
  attributionDisputed: z.boolean(),
  disputeNote: z.string().optional(),
  sources: z.array(z.string()),
  $note: note,
});

export const Vehicle = z.enum(['at', 'tren', 'gemi', 'otomobil', 'ucak']);

export const JourneyLeg = z.strictObject({
  fromPlaceId: z.string(),
  toPlaceId: z.string(),
  vehicle: Vehicle,
  departure: DateValue,
  arrival: DateValue.optional(),
  path: z.array(GeoPoint).optional(),
  routeKind: z.enum(['kaynakli', 'yaklasik']),
  sources: z.array(z.string()),
  $note: note,
});

export const Journey = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  legs: z.array(JourneyLeg).min(1),
  sources: z.array(z.string()),
  $note: note,
});

export const BorderChange = z.strictObject({
  id: z.string().min(1),
  effective: DateValue,
  kind: z.enum(['antlasma', 'ilhak', 'isgal', 'bagimsizlik', 'diger']),
  title: z.string().min(1),
  polity: z.string().min(1),
  geometry: z.string().min(1),
  geometryOrigin: z.enum(['cshapes', 'elle-cizim']),
  geometryApproximate: z.boolean(),
  geometrySources: z.array(z.string()),
  sources: z.array(z.string()),
  $note: note,
});

export const PlaceName = z.strictObject({
  id: z.string().min(1),
  point: GeoPoint,
  names: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        validFrom: DateValue.optional(),
        validTo: DateValue.optional(),
        sources: z.array(z.string()),
        $note: note,
      }),
    )
    .min(1),
  modernName: z.string().optional(),
  $note: note,
});

// Status cartouche (SPEC K3, ARCHITECTURE ADR-15). Rule 9 checks the intervals.
export const Tenure = z.strictObject({
  id: z.string().min(1),
  kind: z.enum(['rutbe', 'gorev']),
  title: z.string().min(1),
  start: DateValue,
  end: DateValue.optional(),
  sources: z.array(z.string()),
  $note: note,
});

/**
 * An old word explained on hover (2026-11-17). `meaning` and `today` are our own sentences; the
 * meaning comes from the sources (rule 12: one official source or two independent ones). Stays
 * out of the site until the user approves the wording (`verified`).
 */
export const GlossaryEntry = z.strictObject({
  id: z.string().min(1),
  /** Base forms and period spellings, matched at a word start with Turkish suffixes allowed. */
  terms: z.array(z.string().min(2)).min(1),
  /** Phrases that start like a term but are something else (e.g. "mebusan" for "mebus"). */
  exclude: z.array(z.string().min(2)).optional(),
  meaning: z.string().min(1).max(200),
  today: z.string().min(1).max(120).optional(),
  sources: z.array(z.string()).min(1),
  verified: z.boolean(),
  $note: note,
});

export const Person = z.strictObject({
  birth: DateValue,
  $note: note,
});

// File wrappers: each data file is `{ "$comment"?: string, "<key>": [...] }`.
const file = <K extends string, T extends z.ZodType>(key: K, item: T) =>
  z.strictObject({ $comment: z.string().optional(), [key]: z.array(item) } as {
    $comment: z.ZodOptional<z.ZodString>;
  } & Record<K, z.ZodArray<T>>);

export const SourcesFile = file('sources', SourceRecord);
export const EventsFile = file('events', EventRecord);
export const DocumentsFile = file('documents', DocumentRecord);
export const JourneysFile = file('journeys', Journey);
export const BordersFile = file('borders', BorderChange);
export const PlacesFile = file('places', PlaceName);
export const TenuresFile = file('tenures', Tenure);
export const GlossaryFile = file('glossary', GlossaryEntry);
// person.json holds one record, not a list.
export const PersonFile = z.strictObject({ $comment: z.string().optional(), person: Person });

export type DateValue = z.infer<typeof DateValue>;
export type SourceRecord = z.infer<typeof SourceRecord>;
export type GeoPoint = z.infer<typeof GeoPoint>;
export type EventRecord = z.infer<typeof EventRecord>;
export type DocumentRecord = z.infer<typeof DocumentRecord>;
export type Journey = z.infer<typeof Journey>;
export type JourneyLeg = z.infer<typeof JourneyLeg>;
export type BorderChange = z.infer<typeof BorderChange>;
export type PlaceName = z.infer<typeof PlaceName>;
export type Vehicle = z.infer<typeof Vehicle>;
export type Tenure = z.infer<typeof Tenure>;
export type Person = z.infer<typeof Person>;
export type GlossaryEntry = z.infer<typeof GlossaryEntry>;
