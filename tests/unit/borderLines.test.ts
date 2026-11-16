import { describe, expect, it } from 'vitest';
import { inRings, landBorderLines, landTest, type Pt } from '../../scripts/lib/borderLines.ts';

// Fictional geography: land is the half-plane lon < 10; the sea lies east of it. The polity is a
// box from lon 6 to 10 (its east side is the coast) and lat 40 to 42. Its west side borders land.
const land = landTest([
  [
    [
      [-50, 0],
      [10, 0],
      [10, 80],
      [-50, 80],
      [-50, 0],
    ],
  ],
]);
const box: Pt[] = [
  [6, 40],
  [9.999, 40],
  [9.999, 42],
  [6, 42],
  [6, 40],
];

describe('landBorderLines', () => {
  it('keeps the side facing land and drops the coast', () => {
    const lines = landBorderLines([[box]], land);
    const points = lines.flat();
    // The west side (lon 6) is a land border; no point of the kept lines lies only on the coast.
    expect(points.some(([lon]) => lon === 6)).toBe(true);
    const coastOnly = lines.filter((l) => l.every(([lon]) => lon > 9.9));
    expect(coastOnly).toHaveLength(0);
  });

  it('joins a run that wraps past the start of the ring into one line', () => {
    // Start the ring on the west side so the land run spans the end and the start.
    const shifted: Pt[] = [
      [6, 41],
      [6, 40],
      [9.999, 40],
      [9.999, 42],
      [6, 42],
      [6, 41],
    ];
    const lines = landBorderLines([[shifted]], land);
    const west = lines.filter((l) => l.some(([lon]) => lon === 6));
    expect(west).toHaveLength(1);
  });

  it('drops segments lying on the clip box edge', () => {
    const lines = landBorderLines([[box]], () => true, [6, 30, 20, 50]);
    expect(lines.flat().filter(([lon], i, all) => lon === 6 && all[i + 1]?.[0] === 6)).toHaveLength(
      0,
    );
  });
});

describe('inRings', () => {
  it('treats a hole as outside', () => {
    const outer: Pt[] = [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 0],
    ];
    const hole: Pt[] = [
      [1, 1],
      [3, 1],
      [3, 3],
      [1, 3],
      [1, 1],
    ];
    expect(inRings([0.5, 0.5], [[outer, hole]])).toBe(true);
    expect(inRings([2, 2], [[outer, hole]])).toBe(false);
  });
});

describe('landBorderLines across a strait', () => {
  it('drops a shore whose far side belongs to the same polity', () => {
    // Two shores of one polity, 0.1 degree apart (about 8 km): the gap is water, both sides land.
    const westShore: Pt[] = [
      [0, 40],
      [1, 40],
      [1, 41],
      [0, 41],
      [0, 40],
    ];
    const eastShore: Pt[] = [
      [1.1, 40],
      [2, 40],
      [2, 41],
      [1.1, 41],
      [1.1, 40],
    ];
    const everywhereLand = () => true;
    const lines = landBorderLines([[westShore], [eastShore]], everywhereLand);
    const inStrait = lines.filter((l) => l.every(([lon]) => lon === 1 || lon === 1.1));
    expect(inStrait).toHaveLength(0);
  });
});
