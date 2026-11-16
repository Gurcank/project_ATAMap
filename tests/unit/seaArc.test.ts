import { describe, expect, it } from 'vitest';
import { halfway, seaArc, type LonLat } from '../../src/map/along.ts';

// A made-up peninsula between the two ports: a box of land straddling the straight line.
const peninsula = ([lon, lat]: LonLat) => lon > 31 && lon < 35 && lat > 40.6 && lat < 41.4;
const noLand = () => false;

describe('seaArc (A31)', () => {
  it('keeps the straight line when it stays at sea', () => {
    const route = seaArc([29, 41], [36, 41], noLand);
    expect(route.every(([, lat]) => Math.abs(lat - 41) < 1e-9)).toBe(true);
  });

  it('bows the route off the land between the ports', () => {
    const route = seaArc([29, 41], [36, 41], peninsula);
    const inner = route.slice(5, -5);
    expect(inner.filter(peninsula)).toHaveLength(0);
  });

  it('falls back to the great circle when no bow keeps the route at sea', () => {
    const everywhere = () => true;
    const route = seaArc([29, 41], [36, 41], everywhere);
    // The great circle between two points on the same parallel bulges toward the pole a little.
    const mid = route[Math.floor(route.length / 2)];
    expect(mid?.[1]).toBeGreaterThan(41);
    expect(mid?.[1]).toBeLessThan(41.3);
  });

  it('starts and ends at the ports', () => {
    const route = seaArc([29, 41], [36, 41], peninsula);
    expect(route[0]).toEqual([29, 41]);
    expect(route.at(-1)).toEqual([36, 41]);
  });
});

describe('halfway (A32, reduced motion)', () => {
  it('stands in the leg that holds half the total length', () => {
    // Legs of 100, 300 and 100 px: half of 500 is 250, i.e. 150 px into the second leg.
    expect(halfway([100, 300, 100], 500)).toEqual({ leg: 1, p: 0.5 });
  });

  it('copes with a journey of one leg and with zero length', () => {
    expect(halfway([80], 80)).toEqual({ leg: 0, p: 0.5 });
    expect(halfway([0, 0, 0], 0)).toEqual({ leg: 1, p: 0.5 });
  });
});
