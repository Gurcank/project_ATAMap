// Moving a glyph along an SVG path, and sampling great-circle routes (SPEC §5.2 M1-M4).
import { geoInterpolate } from 'd3-geo';
import type { Vehicle } from '../schema/index.ts';

/** Glyphs are drawn about 24 units wide; this makes them readable on the map. */
const GLYPH_SCALE = 1.3;

export type LonLat = [number, number];
export type XY = [number, number];

/** Points along the great circle a -> b (d3's own interpolation), `steps + 1` of them. */
export function geodesic(a: LonLat, b: LonLat, steps = 48): LonLat[] {
  const interpolate = geoInterpolate(a, b);
  return Array.from({ length: steps + 1 }, (_, i) => interpolate(i / steps) as LonLat);
}

/** A sourced route: the documented points joined by short great-circle pieces. */
export function densify(points: LonLat[], stepsPerSegment = 12): LonLat[] {
  const out: LonLat[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a && b) out.push(...geodesic(a, b, stepsPerSegment).slice(i === 0 ? 0 : 1));
  }
  return out;
}

export const toPathData = (points: XY[]) =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

/**
 * Puts `glyph` on `path` at fraction `p` (0..1) and turns it to the heading of the route.
 * Ground and sea vehicles never turn upside down: heading left mirrors them instead. The
 * aeroplane turns freely.
 */
export function placeAlong(
  path: SVGPathElement,
  glyph: SVGGElement,
  p: number,
  vehicle: Vehicle,
): void {
  const length = path.getTotalLength();
  if (length === 0) return;
  const at = Math.min(length, Math.max(0, p * length));
  const a = path.getPointAtLength(at);
  const b = path.getPointAtLength(Math.min(length, at + 2));
  const behind = path.getPointAtLength(Math.max(0, at - 2));
  const dx = b.x - behind.x;
  const dy = b.y - behind.y;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let mirror = false;
  if (vehicle !== 'ucak') {
    if (Math.abs(angle) > 90) {
      mirror = true;
      angle += angle > 0 ? -180 : 180;
    }
    angle = Math.max(-35, Math.min(35, angle));
  }
  glyph.setAttribute(
    'transform',
    `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${mirror ? -GLYPH_SCALE : GLYPH_SCALE} ${GLYPH_SCALE})`,
  );
}
