// SPEC §6 build rules 1-11: each has a rejected example in tests/fixtures (ARCHITECTURE §6.1).
import { describe, expect, it } from 'vitest';
import { applyRules } from '../../scripts/lib/rules.ts';
import { DateValue, DocumentRecord, EventRecord, SourceRecord } from '../../src/schema/index.ts';
import { rejectedCases, validDataset } from '../fixtures/dataset.ts';

describe('applyRules', () => {
  it('accepts the fictional valid dataset without violations', () => {
    const { violations, kept } = applyRules(validDataset());
    expect(violations).toEqual([]);
    expect(kept.events).toHaveLength(1);
    expect(kept.documents).toHaveLength(2);
    expect(kept.tenures).toHaveLength(3);
    expect(kept.person).not.toBeNull();
  });

  it.each(rejectedCases)('$name', ({ rule, fatal, id, mutate }) => {
    const ds = validDataset();
    mutate(ds);
    const { violations } = applyRules(ds);
    const hit = violations.find((v) => v.rule === rule && v.id === id);
    expect(hit, JSON.stringify(violations)).toBeDefined();
    expect(hit?.fatal).toBe(fatal);
  });

  it('drops a record with an unverified source from the output (rule 1)', () => {
    const ds = validDataset();
    ds.sources.find((s) => s.id === 'k2')!.verified = false;
    const { kept } = applyRules(ds);
    expect(kept.events).toHaveLength(0);
  });

  it('drops events that point at a dropped place', () => {
    const ds = validDataset();
    ds.sources.find((s) => s.id === 'k3')!.verified = false; // a place coordinate source
    const { kept, violations } = applyRules(ds);
    expect(kept.places).toHaveLength(0);
    expect(kept.events).toHaveLength(0);
    expect(kept.documents).toHaveLength(0);
    expect(violations.some((v) => v.id === 'event:kurgu-olay' && v.rule === 1)).toBe(true);
  });

  it('drops a journey whose leg ends at a dropped place, and its event', () => {
    const ds = validDataset();
    const date = {
      iso: '1900-01-05',
      precision: 'day' as const,
      approximate: false,
      sources: ['k1', 'k2'],
    };
    ds.places.push({
      id: 'kurgu-ikinci-sehir',
      point: { lon: 31, lat: 40, sources: ['k2', 'k3'] },
      names: [{ name: 'Kurgu İkinci Şehir', sources: ['k1'] }],
    });
    ds.journeys.push({
      id: 'kurgu-yol',
      title: 'Kurgu yol',
      sources: ['k1', 'k2'],
      legs: [
        {
          fromPlaceId: 'kurgu-sehir',
          toPlaceId: 'kurgu-ikinci-sehir',
          vehicle: 'tren',
          departure: date,
          routeKind: 'yaklasik',
          sources: ['k1', 'k2'],
        },
      ],
    });
    ds.events.push({
      id: 'kurgu-yol-olayi',
      date,
      title: 'Kurgu yolculuk',
      text: 'Kurgu bir yolculuk yaptı.',
      placeId: 'kurgu-sehir',
      journeyId: 'kurgu-yol',
      sources: ['k1', 'k2'],
    });
    expect(applyRules(ds).kept.journeys).toHaveLength(1);
    // The second place loses a coordinate source; the first place stays.
    ds.places[1]!.point.sources = ['k2', 'k4'];
    ds.sources.find((s) => s.id === 'k4')!.verified = false;
    const { kept, violations } = applyRules(ds);
    expect(kept.journeys).toHaveLength(0);
    expect(kept.events.map((e) => e.id)).toEqual(['kurgu-olay']);
    expect(violations.some((v) => v.id === 'journey:kurgu-yol' && v.rule === 1)).toBe(true);
  });

  describe('official sources (K5)', () => {
    // KURGU: a made-up state publication, facts only.
    const official = (extra: Record<string, unknown> = {}) => ({
      id: 'k-resmi',
      institution: 'KURGU Bakanlığı',
      citation: 'KURGU resmî kronoloji',
      url: 'https://ata.msb.gov.tr/kurgu',
      accessedAt: '2026-01-01',
      rights: 'hakki-sakli-olgu' as const,
      official: true,
      free: true,
      verified: true,
      ...extra,
    });

    it('accepts one official source for a date, even from a former hint-only state site', () => {
      const ds = validDataset();
      ds.sources.push(official());
      ds.events[0]!.date.sources = ['k-resmi'];
      const { violations, kept } = applyRules(ds);
      expect(violations).toEqual([]);
      expect(kept.events).toHaveLength(1);
    });

    it('drops a record whose facts come from a reserved source that is not official', () => {
      const ds = validDataset();
      ds.sources.push(official({ official: false }));
      ds.events[0]!.date.sources = ['k1', 'k-resmi'];
      const { violations, kept } = applyRules(ds);
      expect(kept.events).toHaveLength(0);
      expect(violations.some((v) => v.id === 'event:kurgu-olay' && v.rule === 2)).toBe(true);
    });

    it('never takes a full text from a reserved official source', () => {
      const ds = validDataset();
      ds.sources.push(official());
      ds.documents[0]!.sources = ['k1', 'k-resmi'];
      const { violations, kept } = applyRules(ds);
      expect(kept.documents.map((d) => d.id)).not.toContain('kurgu-belge');
      expect(violations.some((v) => v.id === 'document:kurgu-belge' && v.rule === 2)).toBe(true);
    });
  });

  it('keeps an event but stops listing a dropped document', () => {
    const ds = validDataset();
    ds.sources.find((s) => s.id === 'k1')!.verified = false;
    ds.places[0]!.names[0]!.sources = ['k2'];
    ds.events[0]!.sources = ['k2'];
    ds.events[0]!.date.sources = ['k2', 'k3'];
    const { kept } = applyRules(ds);
    expect(kept.events).toHaveLength(1);
    expect(kept.events[0]?.documentIds).toEqual([]);
  });

  it('drops tenures and the birth date whose sources are unverified (rule 1)', () => {
    const ds = validDataset();
    ds.sources.find((s) => s.id === 'k2')!.verified = false;
    const { kept, violations } = applyRules(ds);
    expect(kept.tenures).toHaveLength(0);
    expect(kept.person).toBeNull();
    expect(violations.some((v) => v.id === 'person:birth' && v.rule === 1)).toBe(true);
  });

  it('works without tenures.json and person.json', () => {
    const ds = validDataset();
    ds.tenures = [];
    ds.person = null;
    const { violations } = applyRules(ds);
    expect(violations).toEqual([]);
  });

  it('reports a missing period name as a non-fatal warning', () => {
    const ds = validDataset();
    ds.places[0]!.names[0]!.sources = [];
    const { violations } = applyRules(ds);
    const warning = violations.find((v) => v.rule === 'uyarı');
    expect(warning?.fatal).toBe(false);
  });
});

describe('schema', () => {
  const date = { iso: '1900-01-02', precision: 'day', approximate: false, sources: ['k1'] };

  it('checks the ISO format against the precision', () => {
    expect(DateValue.safeParse(date).success).toBe(true);
    expect(DateValue.safeParse({ ...date, precision: 'year' }).success).toBe(false);
    expect(DateValue.safeParse({ ...date, iso: '1900-13-01' }).success).toBe(false);
  });

  it('accepts the conventional-date flag (SPEC A25)', () => {
    expect(DateValue.safeParse({ ...date, conventional: true }).success).toBe(true);
    expect(DateValue.safeParse({ ...date, conventional: 'evet' }).success).toBe(false);
  });

  it('requires isoEnd for ranges and forbids it otherwise', () => {
    expect(DateValue.safeParse({ ...date, iso: '1900', precision: 'range' }).success).toBe(false);
    expect(
      DateValue.safeParse({ ...date, iso: '1900', isoEnd: '1901', precision: 'range' }).success,
    ).toBe(true);
    expect(DateValue.safeParse({ ...date, isoEnd: '1901' }).success).toBe(false);
    expect(
      DateValue.safeParse({ ...date, iso: '1901', isoEnd: '1900', precision: 'range' }).success,
    ).toBe(false);
  });

  it('limits event title to 60 and text to 240 characters', () => {
    const event = { id: 'e', date, title: 'x', text: 'y', sources: ['k1'] };
    expect(EventRecord.safeParse(event).success).toBe(true);
    expect(EventRecord.safeParse({ ...event, title: 'x'.repeat(61) }).success).toBe(false);
    expect(EventRecord.safeParse({ ...event, text: 'y'.repeat(241) }).success).toBe(false);
  });

  it('rejects fields outside SPEC §6', () => {
    const doc = {
      id: 'd',
      kind: 'mektup',
      date,
      fromPlaceId: 'p',
      sender: 's',
      originalScript: 'latin',
      attributionDisputed: false,
      sources: ['k1'],
    };
    expect(DocumentRecord.safeParse(doc).success).toBe(true);
    expect(DocumentRecord.safeParse({ ...doc, summary: 'özet' }).success).toBe(false);
    expect(DocumentRecord.safeParse({ ...doc, kind: 'not' }).success).toBe(false);
  });

  it('accepts the shipped source records', () => {
    const base = {
      id: 's',
      institution: 'i',
      citation: 'c',
      accessedAt: '2026-01-01',
      rights: 'kamu-mali',
      free: true,
      verified: true,
    };
    expect(SourceRecord.safeParse(base).success).toBe(true);
    expect(SourceRecord.safeParse({ ...base, rights: 'ücretli' }).success).toBe(false);
  });
});
