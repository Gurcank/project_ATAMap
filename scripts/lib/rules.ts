// SPEC §6 build rules 1-8 and referential integrity (ARCHITECTURE ADR-07).
// Pure: no file access, so tests/unit/rules.test.ts can feed it fixtures.
//   Rules 1-2 drop the record and report it (not fatal).
//   Rules 3-8 and broken references are fatal: the build must exit non-zero.
import { createHash } from 'node:crypto';
import type {
  BorderChange,
  DateValue,
  DocumentRecord,
  EventRecord,
  GeoPoint,
  Journey,
  PlaceName,
  SourceRecord,
} from '../../src/schema/index.ts';
import { diplomaticToText } from './diplomatic.ts';

export interface ReferenceEntry {
  /** Contents of data/reference/<docId>.txt */
  text: string;
  /** Parsed data/reference/<docId>.meta.json (only the fields the rules read). */
  meta: { sha256: string; sourceId?: string };
}

export interface Dataset {
  sources: SourceRecord[];
  events: EventRecord[];
  documents: DocumentRecord[];
  journeys: Journey[];
  borders: BorderChange[];
  places: PlaceName[];
  reference: Map<string, ReferenceEntry>;
}

export type RuleId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'bütünlük' | 'uyarı';

export interface Violation {
  rule: RuleId;
  /** Record id, e.g. "tbmm-nutuk-1929-11-01" or "place:ankara". */
  id: string;
  message: string;
  fatal: boolean;
}

export interface RuleResult {
  kept: Omit<Dataset, 'reference'>;
  violations: Violation[];
}

type Kind = 'event' | 'document' | 'journey' | 'border' | 'place';

const sha256Lf = (text: string) =>
  createHash('sha256').update(text.replace(/\r\n/g, '\n'), 'utf8').digest('hex');

function datesOfJourney(j: Journey): DateValue[] {
  return j.legs.flatMap((l) => (l.arrival ? [l.departure, l.arrival] : [l.departure]));
}

function pointsOfJourney(j: Journey): GeoPoint[] {
  return j.legs.flatMap((l) => l.path ?? []);
}

/** Every source id a record touches, wherever it sits inside the record. */
function sourceIdsOf(kind: Kind, rec: unknown): string[] {
  const ids = new Set<string>();
  const add = (list: readonly string[] | undefined) => list?.forEach((s) => ids.add(s));
  const date = (d: DateValue | undefined) => add(d?.sources);
  const point = (p: GeoPoint | undefined) => add(p?.sources);
  switch (kind) {
    case 'event': {
      const e = rec as EventRecord;
      add(e.sources);
      date(e.date);
      break;
    }
    case 'document': {
      const d = rec as DocumentRecord;
      add(d.sources);
      date(d.date);
      break;
    }
    case 'journey': {
      const j = rec as Journey;
      add(j.sources);
      datesOfJourney(j).forEach(date);
      pointsOfJourney(j).forEach(point);
      j.legs.forEach((l) => add(l.sources));
      break;
    }
    case 'border': {
      const b = rec as BorderChange;
      add(b.sources);
      add(b.geometrySources);
      date(b.effective);
      break;
    }
    case 'place': {
      const p = rec as PlaceName;
      point(p.point);
      p.names.forEach((n) => {
        add(n.sources);
        date(n.validFrom);
        date(n.validTo);
      });
      break;
    }
  }
  return [...ids];
}

/** Ids of the places a record points at. */
function placeRefsOf(kind: Kind, rec: unknown): string[] {
  if (kind === 'event') {
    const e = rec as EventRecord;
    return e.placeId ? [e.placeId] : [];
  }
  if (kind === 'document') {
    const d = rec as DocumentRecord;
    return d.toPlaceId ? [d.fromPlaceId, d.toPlaceId] : [d.fromPlaceId];
  }
  if (kind === 'journey') {
    return (rec as Journey).legs.flatMap((l) => [l.fromPlaceId, l.toPlaceId]);
  }
  return [];
}

export function applyRules(ds: Dataset): RuleResult {
  const violations: Violation[] = [];
  const fail = (rule: RuleId, id: string, message: string) =>
    violations.push({ rule, id, message, fatal: true });
  const drop = (rule: RuleId, id: string, message: string) =>
    violations.push({ rule, id, message, fatal: false });
  const warn = (id: string, message: string) =>
    violations.push({ rule: 'uyarı', id, message, fatal: false });

  const sourceById = new Map<string, SourceRecord>();
  for (const s of ds.sources) {
    if (sourceById.has(s.id))
      fail('bütünlük', `source:${s.id}`, 'kaynak kimliği birden çok kez var');
    sourceById.set(s.id, s);
    // Rule 8
    if (s.free !== true) fail(8, `source:${s.id}`, 'kaynak ücretsiz değil (free !== true)');
    if (s.rights === 'acik-lisans' && !s.licence) {
      fail('bütünlük', `source:${s.id}`, 'rights "acik-lisans" iken licence zorunlu');
    }
  }

  const duplicateCheck = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) fail('bütünlük', `${label}:${id}`, 'kimlik birden çok kez var');
      seen.add(id);
    }
  };
  duplicateCheck(
    'event',
    ds.events.map((r) => r.id),
  );
  duplicateCheck(
    'document',
    ds.documents.map((r) => r.id),
  );
  duplicateCheck(
    'journey',
    ds.journeys.map((r) => r.id),
  );
  duplicateCheck(
    'border',
    ds.borders.map((r) => r.id),
  );
  duplicateCheck(
    'place',
    ds.places.map((r) => r.id),
  );

  // Rule 5: every DateValue and GeoPoint carries >= 2 distinct sources, or one when primaryDocument.
  const checkDate = (id: string, where: string, d: DateValue) => {
    const distinct = new Set(d.sources).size;
    if (distinct !== d.sources.length) fail(5, id, `${where}: aynı kaynak birden çok kez sayılmış`);
    if (distinct >= 2) return;
    if (distinct === 1 && d.primaryDocument === true) return;
    fail(
      5,
      id,
      `${where}: ${distinct} kaynak var; tek kaynak yalnız primaryDocument ise kabul edilir`,
    );
  };
  const checkPoint = (id: string, where: string, p: GeoPoint) => {
    const distinct = new Set(p.sources).size;
    if (distinct !== p.sources.length) fail(5, id, `${where}: aynı kaynak birden çok kez sayılmış`);
    if (distinct < 2)
      fail(5, id, `${where}: koordinat için ${distinct} kaynak var, en az 2 gerekir`);
  };

  for (const e of ds.events) checkDate(`event:${e.id}`, 'date', e.date);
  for (const d of ds.documents) checkDate(`document:${d.id}`, 'date', d.date);
  for (const j of ds.journeys) {
    j.legs.forEach((l, i) => {
      checkDate(`journey:${j.id}`, `legs[${i}].departure`, l.departure);
      if (l.arrival) checkDate(`journey:${j.id}`, `legs[${i}].arrival`, l.arrival);
      l.path?.forEach((p, k) => checkPoint(`journey:${j.id}`, `legs[${i}].path[${k}]`, p));
    });
  }
  for (const b of ds.borders) checkDate(`border:${b.id}`, 'effective', b.effective);
  for (const p of ds.places) {
    checkPoint(`place:${p.id}`, 'point', p.point);
    p.names.forEach((n, i) => {
      if (n.validFrom) checkDate(`place:${p.id}`, `names[${i}].validFrom`, n.validFrom);
      if (n.validTo) checkDate(`place:${p.id}`, `names[${i}].validTo`, n.validTo);
      if (n.sources.length === 0) {
        warn(`place:${p.id}`, `names[${i}] ("${n.name}") için dönem adı kaynağı yok (açık)`);
      }
    });
  }

  // Rules 3, 4, 7 on documents.
  for (const d of ds.documents) {
    const id = `document:${d.id}`;
    if (d.fullText !== undefined && d.originalScript !== 'latin') {
      fail(3, id, 'fullText yalnız aslı Latin harfli belgede bulunabilir');
    }
    if (d.attributionDisputed && !d.disputeNote) {
      fail(4, id, 'attributionDisputed true iken disputeNote zorunlu');
    }
    if (d.fullText === undefined) continue;
    const ref = ds.reference.get(d.id);
    if (!ref) {
      fail(7, id, `data/reference/${d.id}.txt veya .meta.json yok`);
    } else {
      if (sha256Lf(ref.text) !== ref.meta.sha256) {
        fail(
          7,
          id,
          'referans dosyası, kayıtlı sha256 ile uyuşmuyor (yakalandıktan sonra değişmiş)',
        );
      }
      if (diplomaticToText(ref.text) !== d.fullText) {
        fail(7, id, 'fullText, referans dosyasından üretilen metinle karakter karakter aynı değil');
      }
      if (ref.meta.sourceId !== undefined && !d.sources.includes(ref.meta.sourceId)) {
        fail(
          7,
          id,
          `referans meta kaynağı (${ref.meta.sourceId}) belgenin kaynakları arasında yok`,
        );
      }
    }
    const withPage = d.sources.some((s) => sourceById.get(s)?.page);
    if (!withPage) fail(7, id, 'fullText için kaynak sayfa numarası (page) zorunlu');
  }

  // Rule 6
  for (const b of ds.borders) {
    const id = `border:${b.id}`;
    if (b.geometrySources.length === 0) {
      fail(6, id, 'geometri kendi kaynağını taşımalı (geometrySources boş)');
    } else if (b.geometryOrigin === 'elle-cizim') {
      const described = b.geometrySources.some(
        (s) => (sourceById.get(s)?.citation ?? '').trim() !== '',
      );
      if (!described) fail(6, id, 'elle çizim için kaynak tarifi (citation) zorunlu');
    }
  }

  // Referential integrity. Unknown source ids are fatal; unknown place/document/journey ids too.
  const placeIds = new Set(ds.places.map((p) => p.id));
  const documentIds = new Set(ds.documents.map((d) => d.id));
  const journeyIds = new Set(ds.journeys.map((j) => j.id));
  const checkRefs = (kind: Kind, label: string, rec: { id: string }) => {
    for (const sid of sourceIdsOf(kind, rec)) {
      if (!sourceById.has(sid))
        fail('bütünlük', `${label}:${rec.id}`, `bilinmeyen kaynak kimliği "${sid}"`);
    }
    for (const pid of placeRefsOf(kind, rec)) {
      if (!placeIds.has(pid))
        fail('bütünlük', `${label}:${rec.id}`, `bilinmeyen yer kimliği "${pid}"`);
    }
  };
  ds.events.forEach((e) => {
    checkRefs('event', 'event', e);
    e.documentIds?.forEach((x) => {
      if (!documentIds.has(x)) fail('bütünlük', `event:${e.id}`, `bilinmeyen belge kimliği "${x}"`);
    });
    if (e.journeyId && !journeyIds.has(e.journeyId)) {
      fail('bütünlük', `event:${e.id}`, `bilinmeyen seyahat kimliği "${e.journeyId}"`);
    }
  });
  ds.documents.forEach((d) => checkRefs('document', 'document', d));
  ds.journeys.forEach((j) => checkRefs('journey', 'journey', j));
  ds.borders.forEach((b) => checkRefs('border', 'border', b));
  ds.places.forEach((p) => checkRefs('place', 'place', p));

  // Rules 1-2: drop records whose sources are unverified or copyrighted. A record that depends on a
  // dropped record is dropped too (a document leaves its event's list, an event loses its place...).
  const unusable = (sid: string): 'unverified' | 'telifli' | null => {
    const s = sourceById.get(sid);
    if (!s) return null; // already reported as a reference error
    if (s.rights === 'telifli') return 'telifli';
    if (!s.verified) return 'unverified';
    return null;
  };
  const dropped = new Set<string>();
  const screen = <T extends { id: string }>(kind: Kind, label: string, list: T[]): T[] =>
    list.filter((rec) => {
      const key = `${label}:${rec.id}`;
      for (const sid of sourceIdsOf(kind, rec)) {
        const why = unusable(sid);
        if (why === 'telifli') {
          drop(2, key, `kaynak "${sid}" telifli; kayıt çıktıda yok`);
          dropped.add(key);
          return false;
        }
        if (why === 'unverified') {
          drop(1, key, `kaynak "${sid}" doğrulanmamış (verified: false); kayıt çıktıda yok`);
          dropped.add(key);
          return false;
        }
      }
      if (kind === 'document') {
        const d = rec as unknown as DocumentRecord;
        if (d.fullText !== undefined) {
          const bad = d.sources.find((s) => sourceById.get(s)?.rights !== 'kamu-mali');
          if (bad) {
            drop(2, key, `fullText kaynağı "${bad}" kamu-mali değil; kayıt çıktıda yok`);
            dropped.add(key);
            return false;
          }
        }
      }
      return true;
    });

  let events = screen('event', 'event', ds.events);
  let documents = screen('document', 'document', ds.documents);
  const journeys = screen('journey', 'journey', ds.journeys);
  const borders = screen('border', 'border', ds.borders);
  const places = screen('place', 'place', ds.places);

  const livePlaces = new Set(places.map((p) => p.id));
  const liveJourneys = new Set(journeys.map((j) => j.id));
  const cascade = <T extends { id: string }>(
    label: string,
    list: T[],
    keep: (rec: T) => string | null,
  ): T[] =>
    list.filter((rec) => {
      const reason = keep(rec);
      if (reason === null) return true;
      const key = `${label}:${rec.id}`;
      drop(1, key, `${reason}; kayıt çıktıda yok`);
      dropped.add(key);
      return false;
    });

  documents = cascade('document', documents, (d) => {
    const missing = placeRefsOf('document', d).find((p) => !livePlaces.has(p));
    return missing ? `yer "${missing}" çıktıda yok` : null;
  });
  const liveDocuments = new Set(documents.map((d) => d.id));
  events = cascade('event', events, (e) => {
    if (e.placeId && !livePlaces.has(e.placeId)) return `yer "${e.placeId}" çıktıda yok`;
    if (e.journeyId && !liveJourneys.has(e.journeyId))
      return `seyahat "${e.journeyId}" çıktıda yok`;
    return null;
  });
  // Events keep living when a listed document is gone, but stop listing it.
  events = events.map((e) => {
    if (!e.documentIds) return e;
    const documentIdsLive = e.documentIds.filter((x) => liveDocuments.has(x));
    return documentIdsLive.length === e.documentIds.length
      ? e
      : { ...e, documentIds: documentIdsLive };
  });

  return {
    kept: { sources: ds.sources, events, documents, journeys, borders, places },
    violations,
  };
}
