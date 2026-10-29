// KURGU VERİ: Bu dosyadaki kayıtlar tamamen uydurmadır ve yalnız derleme kurallarını denemek
// içindir (CLAUDE.md kural 3). `data/` altına kopyalanmaz, siteye girmez.
import { createHash } from 'node:crypto';
import type { Dataset } from '../../scripts/lib/rules.ts';
import { diplomaticToText } from '../../scripts/lib/diplomatic.ts';

const REFERENCE_TEXT = '## s.1 sol 0.5\n¶ KURGU belge metni, birinci satır\n¶ ikinci paragraf\n';
const sha = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

const source = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  institution: `KURGU kurum ${id}`,
  citation: `KURGU künye ${id}`,
  accessedAt: '2026-01-01',
  rights: 'kamu-mali' as const,
  free: true,
  verified: true,
  ...extra,
});

/** A dataset that passes every rule. Each rejected case below breaks exactly one thing. */
export function validDataset(): Dataset {
  return {
    sources: [
      source('k1', { page: 's. 1' }),
      source('k2'),
      source('k3', { rights: 'acik-lisans', licence: 'CC0-1.0' }),
    ],
    places: [
      {
        id: 'kurgu-sehir',
        point: { lon: 30, lat: 40, sources: ['k2', 'k3'] },
        names: [{ name: 'Kurgu Şehri', sources: ['k1'] }],
      },
    ],
    events: [
      {
        id: 'kurgu-olay',
        date: { iso: '1900-01-02', precision: 'day', approximate: false, sources: ['k1', 'k2'] },
        title: 'Kurgu olay',
        text: 'Kurgu bir olay oldu.',
        placeId: 'kurgu-sehir',
        sources: ['k1', 'k2'],
        documentIds: ['kurgu-belge'],
      },
    ],
    documents: [
      {
        id: 'kurgu-belge',
        kind: 'telgraf',
        date: {
          iso: '1900-01-02',
          precision: 'day',
          approximate: false,
          primaryDocument: true,
          sources: ['k1'],
        },
        fromPlaceId: 'kurgu-sehir',
        sender: 'Kurgu Gönderen',
        originalScript: 'latin',
        fullText: diplomaticToText(REFERENCE_TEXT),
        attributionDisputed: false,
        sources: ['k1'],
      },
      {
        id: 'kurgu-arap-belge',
        kind: 'mektup',
        date: {
          iso: '1900-01-03',
          precision: 'day',
          approximate: false,
          primaryDocument: true,
          sources: ['k2'],
        },
        fromPlaceId: 'kurgu-sehir',
        sender: 'Kurgu Gönderen',
        originalScript: 'arap',
        attributionDisputed: false,
        sources: ['k2'],
      },
    ],
    journeys: [],
    borders: [
      {
        id: 'kurgu-sinir',
        effective: { iso: '1900', precision: 'year', approximate: false, sources: ['k1', 'k2'] },
        kind: 'diger',
        title: 'Kurgu sınır değişikliği',
        polity: 'Kurgu Devleti',
        geometry: 'kurgu.geojson',
        geometryOrigin: 'elle-cizim',
        geometryApproximate: true,
        geometrySources: ['k1'],
        sources: ['k1', 'k2'],
      },
    ],
    reference: new Map([
      [
        'kurgu-belge',
        { text: REFERENCE_TEXT, meta: { sha256: sha(REFERENCE_TEXT), sourceId: 'k1' } },
      ],
    ]),
  };
}

export interface RejectedCase {
  name: string;
  /** SPEC §6 rule number, or 'bütünlük'. */
  rule: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'bütünlük';
  /** Rules 1-2 drop the record; the rest fail the build. */
  fatal: boolean;
  /** Id the violation must name. */
  id: string;
  mutate: (ds: Dataset) => void;
}

const doc = (ds: Dataset) => ds.documents[0]!;

export const rejectedCases: RejectedCase[] = [
  {
    name: 'kural 1: doğrulanmamış kaynak',
    rule: 1,
    fatal: false,
    id: 'event:kurgu-olay',
    mutate: (ds) => {
      ds.sources.find((s) => s.id === 'k2')!.verified = false;
    },
  },
  {
    name: 'kural 2: telifli kaynak',
    rule: 2,
    fatal: false,
    id: 'event:kurgu-olay',
    mutate: (ds) => {
      ds.sources.find((s) => s.id === 'k2')!.rights = 'telifli';
    },
  },
  {
    name: 'kural 2: fullText kaynağı kamu-mali değil',
    rule: 2,
    fatal: false,
    id: 'document:kurgu-belge',
    mutate: (ds) => {
      const s = ds.sources.find((x) => x.id === 'k1')!;
      s.rights = 'acik-lisans';
      s.licence = 'CC0-1.0';
    },
  },
  {
    name: 'kural 3: Arap harfli asılda fullText',
    rule: 3,
    fatal: true,
    id: 'document:kurgu-arap-belge',
    mutate: (ds) => {
      ds.documents[1]!.fullText = 'kurgu metin';
    },
  },
  {
    name: 'kural 4: atfı tartışmalı ama disputeNote yok',
    rule: 4,
    fatal: true,
    id: 'document:kurgu-belge',
    mutate: (ds) => {
      doc(ds).attributionDisputed = true;
    },
  },
  {
    name: 'kural 5: birincil belge olmayan tek kaynaklı tarih',
    rule: 5,
    fatal: true,
    id: 'event:kurgu-olay',
    mutate: (ds) => {
      ds.events[0]!.date.sources = ['k1'];
    },
  },
  {
    name: 'kural 5: tek kaynaklı koordinat',
    rule: 5,
    fatal: true,
    id: 'place:kurgu-sehir',
    mutate: (ds) => {
      ds.places[0]!.point.sources = ['k2'];
    },
  },
  {
    name: 'kural 5: aynı kaynak iki kez sayılmış',
    rule: 5,
    fatal: true,
    id: 'event:kurgu-olay',
    mutate: (ds) => {
      ds.events[0]!.date.sources = ['k1', 'k1'];
    },
  },
  {
    name: 'kural 6: elle çizimde geometri kaynağı yok',
    rule: 6,
    fatal: true,
    id: 'border:kurgu-sinir',
    mutate: (ds) => {
      ds.borders[0]!.geometrySources = [];
    },
  },
  {
    name: 'kural 7: fullText referans metinden farklı',
    rule: 7,
    fatal: true,
    id: 'document:kurgu-belge',
    mutate: (ds) => {
      doc(ds).fullText = `${doc(ds).fullText} (düzeltilmiş)`;
    },
  },
  {
    name: 'kural 7: referans dosyası yok',
    rule: 7,
    fatal: true,
    id: 'document:kurgu-belge',
    mutate: (ds) => {
      ds.reference.clear();
    },
  },
  {
    name: 'kural 7: referans sha256 uyuşmuyor',
    rule: 7,
    fatal: true,
    id: 'document:kurgu-belge',
    mutate: (ds) => {
      ds.reference.get('kurgu-belge')!.meta.sha256 = 'f'.repeat(64);
    },
  },
  {
    name: 'kural 7: kaynakta sayfa numarası yok',
    rule: 7,
    fatal: true,
    id: 'document:kurgu-belge',
    mutate: (ds) => {
      delete ds.sources.find((s) => s.id === 'k1')!.page;
    },
  },
  {
    name: 'kural 8: ücretli kaynak',
    rule: 8,
    fatal: true,
    id: 'source:k3',
    mutate: (ds) => {
      ds.sources.find((s) => s.id === 'k3')!.free = false;
    },
  },
  {
    name: 'bütünlük: olayda bilinmeyen yer',
    rule: 'bütünlük',
    fatal: true,
    id: 'event:kurgu-olay',
    mutate: (ds) => {
      ds.events[0]!.placeId = 'yok-boyle-bir-yer';
    },
  },
  {
    name: 'bütünlük: bilinmeyen kaynak kimliği',
    rule: 'bütünlük',
    fatal: true,
    id: 'event:kurgu-olay',
    mutate: (ds) => {
      ds.events[0]!.sources = ['k1', 'yok'];
    },
  },
];
