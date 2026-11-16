// Status cartouche logic (ARCHITECTURE ADR-15). All records below are FICTIONAL (KURGU), made up
// only to exercise the date arithmetic; they never go to data/.
import { describe, expect, it } from 'vitest';
import type { DateValue, PlaceName, Tenure } from '../../src/schema/index.ts';
import { daySpan, yearsBetween } from '../../src/timeline/dateRange.ts';
import {
  activeTenures,
  ageAt,
  isStatusEmpty,
  placeNameAt,
  statusAt,
} from '../../src/timeline/status.ts';

const d = (iso: string, precision: DateValue['precision'] = 'day', isoEnd?: string): DateValue => ({
  iso,
  precision,
  approximate: false,
  sources: ['k1', 'k2'],
  ...(isoEnd ? { isoEnd } : {}),
});

const tenure = (id: string, kind: Tenure['kind'], start: DateValue, end?: DateValue): Tenure => ({
  id,
  kind,
  title: `KURGU ${id}`,
  start,
  ...(end ? { end } : {}),
  sources: ['k1', 'k2'],
});

describe('daySpan', () => {
  it('turns each precision into the days it may stand for', () => {
    expect(daySpan(d('1900-02-03'))).toEqual({ from: '1900-02-03', to: '1900-02-03' });
    expect(daySpan(d('1900-02', 'month'))).toEqual({ from: '1900-02-01', to: '1900-02-28' });
    expect(daySpan(d('1904-02', 'month'))).toEqual({ from: '1904-02-01', to: '1904-02-29' });
    expect(daySpan(d('1900', 'year'))).toEqual({ from: '1900-01-01', to: '1900-12-31' });
    expect(daySpan(d('1900', 'range', '1901-03'))).toEqual({
      from: '1900-01-01',
      to: '1901-03-31',
    });
  });

  it('counts a birthday as reached on the day itself', () => {
    expect(yearsBetween('1880-05-19', '1900-05-18')).toBe(19);
    expect(yearsBetween('1880-05-19', '1900-05-19')).toBe(20);
  });
});

describe('ageAt', () => {
  const birth = d('1880-05-19');

  it('is certain when both dates are days', () => {
    expect(ageAt(birth, d('1915-08-10'))).toEqual({ min: 35, max: 35 });
  });

  it('becomes a range when the step date is only a year', () => {
    expect(ageAt(birth, d('1915', 'year'))).toEqual({ min: 34, max: 35 });
  });

  it('stays certain for a month that does not contain the birthday', () => {
    expect(ageAt(birth, d('1915-08', 'month'))).toEqual({ min: 35, max: 35 });
  });

  it('is a range when only the birth year is known', () => {
    expect(ageAt(d('1880', 'year'), d('1915-08-10'))).toEqual({ min: 34, max: 35 });
  });

  it('is null before birth', () => {
    expect(ageAt(birth, d('1870'))).toBeNull();
  });
});

describe('activeTenures', () => {
  const tenures = [
    tenure('r1', 'rutbe', d('1900-01-01')),
    tenure('r2', 'rutbe', d('1905-06', 'month')),
    tenure('g1', 'gorev', d('1901', 'year'), d('1903', 'year')),
    tenure('g2', 'gorev', d('1902-04-01'), d('1902-09-30')),
  ];

  it('holds a rank until the next one starts', () => {
    expect(activeTenures(tenures, d('1905-05-31')).rank?.id).toBe('r1');
    expect(activeTenures(tenures, d('1905-07-01')).rank?.id).toBe('r2');
  });

  it('hides the rank when the step may fall either side of a promotion', () => {
    expect(activeTenures(tenures, d('1905-06-15')).rank).toBeNull();
    expect(activeTenures(tenures, d('1905', 'year')).rank).toBeNull();
  });

  it('lists every duty in force, in order of start', () => {
    expect(activeTenures(tenures, d('1902-05-01')).duties.map((t) => t.id)).toEqual(['g1', 'g2']);
  });

  it('hides a duty whose year-precision start or end leaves the step uncertain', () => {
    expect(activeTenures(tenures, d('1901-03-01')).duties).toEqual([]);
    expect(activeTenures(tenures, d('1903-06-01')).duties).toEqual([]);
    expect(activeTenures(tenures, d('1902-12-01')).duties.map((t) => t.id)).toEqual(['g1']);
  });

  it('shows nothing before the first record', () => {
    expect(activeTenures(tenures, d('1899-12-31'))).toEqual({ rank: null, duties: [] });
  });
});

describe('placeNameAt', () => {
  const place: PlaceName = {
    id: 'kurgu-sehir',
    point: { lon: 30, lat: 40, sources: ['k1', 'k2'] },
    names: [
      { name: 'KURGU Eski Ad', validTo: d('1910-12-31'), sources: ['k1'] },
      { name: 'KURGU Yeni Ad', validFrom: d('1911-01-01'), sources: ['k1'] },
    ],
  };

  it('picks the name in force on the date', () => {
    expect(placeNameAt(place, d('1905-01-01'))).toBe('KURGU Eski Ad');
    expect(placeNameAt(place, d('1912-01-01'))).toBe('KURGU Yeni Ad');
  });

  it('gives no name when the date straddles a renaming', () => {
    expect(placeNameAt(place, d('1910', 'range', '1911'))).toBeNull();
  });
});

describe('placeNameAt with an undated name', () => {
  // KURGU: the undated name stands where no period name is sourced; a dated name covers one span.
  const place: PlaceName = {
    id: 'kurgu-sehir-2',
    point: { lon: 30, lat: 40, sources: ['k1', 'k2'] },
    names: [
      { name: 'KURGU Bugünkü Ad', sources: ['k1'] },
      {
        name: 'KURGU Dönem Adı',
        validFrom: d('1937-11-16'),
        validTo: d('1937-12-10'),
        sources: ['k1'],
      },
    ],
  };

  it('uses the dated name inside its span', () => {
    expect(placeNameAt(place, d('1937-11-17'))).toBe('KURGU Dönem Adı');
  });

  it('falls back to the undated name outside it', () => {
    expect(placeNameAt(place, d('1919-09-08'))).toBe('KURGU Bugünkü Ad');
    expect(placeNameAt(place, d('1938-01-01'))).toBe('KURGU Bugünkü Ad');
  });

  it('gives no name when the date may or may not fall inside the span', () => {
    expect(placeNameAt(place, d('1937-11', 'month'))).toBeNull();
  });
});

describe('statusAt', () => {
  it('leaves out every field it has no data for', () => {
    const status = statusAt({ tenures: [], place: null }, d('1900-01-01'));
    expect(status).toEqual({ age: null, rank: null, duties: [], place: null });
    expect(isStatusEmpty(status)).toBe(true);
  });
});
