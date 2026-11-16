import { describe, expect, it } from 'vitest';
import { placeAlong, placeLabels, textBox, type Box } from '../../src/map/labels.ts';

const intersects = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

describe('placeLabels', () => {
  it('puts a lone name to the right of its dot', () => {
    const spot = placeLabels([{ id: 'a', x: 100, y: 100, width: 60, size: 16 }]).get('a');
    expect(spot?.anchor).toBe('start');
    expect(spot!.box.x0).toBeGreaterThan(100);
  });

  it('moves the second name when two dots are close side by side', () => {
    // The Malatya / Ergani case: two dots 70 px apart on one line, names 70 px wide.
    const placed = placeLabels([
      { id: 'malatya', x: 100, y: 100, width: 70, size: 16 },
      { id: 'ergani', x: 170, y: 95, width: 60, size: 16 },
    ]);
    const a = placed.get('malatya')!.box;
    const b = placed.get('ergani')!.box;
    expect(intersects(a, b)).toBe(false);
  });

  it('keeps names off other dots', () => {
    const placed = placeLabels([
      { id: 'a', x: 100, y: 100, width: 80, size: 16 },
      { id: 'b', x: 140, y: 100, width: 40, size: 16 },
    ]);
    const a = placed.get('a')!.box;
    const dotB: Box = { x0: 135, y0: 95, x1: 145, y1: 105 };
    expect(intersects(a, dotB)).toBe(false);
  });

  it('never drops a name, even when every spot is covered', () => {
    const wall: Box = { x0: -1000, y0: -1000, x1: 1000, y1: 1000 };
    const placed = placeLabels([{ id: 'a', x: 0, y: 0, width: 50, size: 16 }], [wall]);
    expect(placed.has('a')).toBe(true);
  });

  it('prefers a spot inside the visible area', () => {
    const bounds: Box = { x0: 0, y0: 0, x1: 200, y1: 200 };
    const spot = placeLabels([{ id: 'edge', x: 190, y: 100, width: 60, size: 16 }], [], bounds).get(
      'edge',
    )!;
    expect(spot.box.x1).toBeLessThanOrEqual(200);
  });
});

describe('placeAlong', () => {
  it('skips a point whose label would cover a place name', () => {
    const name = textBox(110, 105, 'start', 80, 16);
    const spot = placeAlong(
      [
        [130, 120],
        [300, 200],
      ],
      90,
      14,
      [name],
    )!;
    expect(intersects(spot.box, name)).toBe(false);
  });
});
