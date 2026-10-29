import { describe, expect, it } from 'vitest';
import { asCollection, polygonProblems, rewindForD3 } from '../../scripts/lib/geo.ts';
import { densify, geodesic, toPathData } from '../../src/map/along.ts';
import { activeBorderChanges, dayKey } from '../../src/timeline/borders.ts';

// Fictional polities and dates: only the selection rule is under test.
const change = (id: string, polity: string, iso: string) => ({ id, polity, effective: { iso } });

describe('activeBorderChanges (SPEC §4)', () => {
  const changes = [
    change('a2', 'A', '1901-12-01'),
    change('a1', 'A', '1900-12-01'),
    change('b1', 'B', '1900-06'),
  ];
  it('takes the latest change not later than the date, per polity', () => {
    expect(
      activeBorderChanges(changes, '1901-03-03')
        .map((c) => c.id)
        .sort(),
    ).toEqual(['a1', 'b1']);
    expect(
      activeBorderChanges(changes, '1902-02-02')
        .map((c) => c.id)
        .sort(),
    ).toEqual(['a2', 'b1']);
  });
  it('draws nothing for a polity before its first change', () => {
    expect(activeBorderChanges(changes, '1900-05-05')).toEqual([]);
  });
  it('is inclusive on the effective day', () => {
    expect(activeBorderChanges(changes, '1900-12-01').map((c) => c.id)).toContain('a1');
  });
  it('compares month and year precision as their first day', () => {
    expect(dayKey('1900')).toBe('1900-01-01');
    expect(dayKey('1900-06')).toBe('1900-06-01');
    expect(activeBorderChanges(changes, '1900-06-01').map((c) => c.id)).toContain('b1');
  });
});

describe('border geometry (build-borders)', () => {
  const square = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
  ];
  it('accepts a Feature, a FeatureCollection and a bare Polygon', () => {
    const polygon = { type: 'Polygon', coordinates: [square] };
    expect(asCollection(polygon).features).toHaveLength(1);
    expect(asCollection({ type: 'Feature', geometry: polygon }).features).toHaveLength(1);
    expect(
      asCollection({ type: 'FeatureCollection', features: [{ geometry: polygon }] }).type,
    ).toBe('FeatureCollection');
    expect(() => asCollection({ type: 'Point' })).toThrow();
  });
  it('rejects anything but closed polygons', () => {
    const point = asCollection({
      type: 'FeatureCollection',
      features: [{ geometry: { type: 'Point', coordinates: [0, 0] } }],
    });
    expect(polygonProblems(point).join()).toContain('Polygon');
    const open = asCollection({ type: 'Polygon', coordinates: [square.slice(0, 4)] });
    expect(polygonProblems(open).join()).toContain('kapalı');
    expect(polygonProblems({ features: [] })).toContain('geometri boş');
    expect(polygonProblems(asCollection({ type: 'Polygon', coordinates: [square] }))).toEqual([]);
  });
  it('rewinds rings clockwise for d3 (exterior) so d3 does not fill the complement', () => {
    const ccw = asCollection({ type: 'Polygon', coordinates: [square] }); // (0,0)->(1,0)->(1,1): counter-clockwise
    rewindForD3(ccw);
    const ring = (ccw.features[0]!.geometry!.coordinates as number[][][])[0]!;
    const area =
      ring.reduce(
        (s, p, i) =>
          s + p[0]! * ring[(i + 1) % ring.length]![1]! - ring[(i + 1) % ring.length]![0]! * p[1]!,
        0,
      ) / 2;
    expect(area).toBeLessThan(0);
  });
});

describe('route sampling (src/map/along.ts)', () => {
  it('geodesic returns steps + 1 points from a to b', () => {
    const points = geodesic([0, 0], [10, 0], 10);
    expect(points).toHaveLength(11);
    expect(points[0]).toEqual([0, 0]);
    expect(points[10]![0]).toBeCloseTo(10, 6);
  });
  it('densify joins documented points without repeating the shared ones', () => {
    const points = densify(
      [
        [0, 0],
        [5, 0],
        [10, 0],
      ],
      4,
    );
    expect(points).toHaveLength(9);
  });
  it('toPathData writes M then L commands', () => {
    expect(
      toPathData([
        [1, 2],
        [3, 4],
      ]),
    ).toBe('M1.0 2.0L3.0 4.0');
    expect(toPathData([])).toBe('');
  });
});
