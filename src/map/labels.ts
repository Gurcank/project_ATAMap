// Label placement in screen space (SPEC §3.2): place names around their dots, then the route label,
// so no text sits on another. Greedy, in priority order; pure so it can be unit tested.

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type Anchor = 'start' | 'middle' | 'end';

/** A text to draw: where the SVG <text> goes, how it is anchored and the box it covers. */
export interface Spot {
  x: number;
  y: number;
  anchor: Anchor;
  box: Box;
}

export interface LabelRequest {
  id: string;
  /** The dot the name belongs to. */
  x: number;
  y: number;
  width: number;
  /** Font size in px; the box spans the cap height and descenders. */
  size: number;
}

// Share of the font size above and below the baseline (display serif, Turkish diacritics).
const ASCENT = 0.8;
const DESCENT = 0.25;
/** Distance from the dot centre to the text: dot radius (4) plus a gap. */
const OFFSET = 10;
const DIAGONAL = 7;
const DOT_HALF = 5;

export function textBox(x: number, y: number, anchor: Anchor, width: number, size: number): Box {
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
  return { x0, y0: y - size * ASCENT, x1: x0 + width, y1: y + size * DESCENT };
}

const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) *
  Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

const area = (b: Box) => (b.x1 - b.x0) * (b.y1 - b.y0);

/** How much of a box is covered by obstacles or falls outside the visible area. */
function cost(box: Box, obstacles: Box[], bounds?: Box): number {
  let c = 0;
  for (const o of obstacles) c += overlap(box, o);
  if (bounds) c += area(box) - overlap(box, bounds);
  return c;
}

/** Picks the first spot that touches nothing; failing that, the one that covers least. */
function choose(spots: Spot[], obstacles: Box[], bounds?: Box): Spot | undefined {
  let best: Spot | undefined;
  let bestCost = Infinity;
  for (const spot of spots) {
    const c = cost(spot.box, obstacles, bounds);
    if (c === 0) return spot;
    if (c < bestCost) {
      best = spot;
      bestCost = c;
    }
  }
  return best;
}

/** The eight positions around a dot, in order of preference: right first, as on printed maps. */
export function aroundDot(x: number, y: number, width: number, size: number): Spot[] {
  const below = OFFSET + size * ASCENT;
  const candidates: [number, number, Anchor][] = [
    [OFFSET, size * 0.3, 'start'],
    [-OFFSET, size * 0.3, 'end'],
    [DIAGONAL, -DIAGONAL, 'start'],
    [DIAGONAL, DIAGONAL + size * ASCENT, 'start'],
    [-DIAGONAL, -DIAGONAL, 'end'],
    [-DIAGONAL, DIAGONAL + size * ASCENT, 'end'],
    [0, -OFFSET - size * DESCENT, 'middle'],
    [0, below, 'middle'],
  ];
  return candidates.map(([dx, dy, anchor]) => ({
    x: x + dx,
    y: y + dy,
    anchor,
    box: textBox(x + dx, y + dy, anchor, width, size),
  }));
}

export const dotBox = (x: number, y: number): Box => ({
  x0: x - DOT_HALF,
  y0: y - DOT_HALF,
  x1: x + DOT_HALF,
  y1: y + DOT_HALF,
});

/**
 * Places names in the given order (most important first). Every dot is an obstacle for every
 * name, and each placed name becomes one for the next. A name is never dropped: when no spot is
 * free it takes the least covered one.
 */
export function placeLabels(
  requests: LabelRequest[],
  obstacles: Box[] = [],
  bounds?: Box,
): Map<string, Spot> {
  const taken = [...obstacles, ...requests.map((r) => dotBox(r.x, r.y))];
  const placed = new Map<string, Spot>();
  for (const r of requests) {
    const spot = choose(aroundDot(r.x, r.y, r.width, r.size), taken, bounds);
    if (!spot) continue;
    placed.set(r.id, spot);
    taken.push(spot.box);
  }
  return placed;
}

/** A centred label above or below one of the given points (e.g. along a route). */
export function placeAlong(
  points: [number, number][],
  width: number,
  size: number,
  obstacles: Box[],
  bounds?: Box,
): Spot | undefined {
  const spots: Spot[] = [];
  for (const [x, y] of points) {
    for (const dy of [-18, 18 + size * ASCENT]) {
      spots.push({
        x,
        y: y + dy,
        anchor: 'middle',
        box: textBox(x, y + dy, 'middle', width, size),
      });
    }
  }
  return choose(spots, obstacles, bounds);
}
