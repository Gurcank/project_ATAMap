// The clip box of the base maps: west, south, east, north in degrees. scripts/build-geo.ts cuts the
// Natural Earth layers to it and the map uses it to limit panning, so both read this one constant.
// Wider than the first view so the conic projection never shows the clip edge (ADR-04).
export const REGION = [-10, 20, 55, 60] as const;

/** The box outline as a densified ring: a straight lon/lat edge is a curve on a conic projection. */
export function regionOutline(step = 5): [number, number][] {
  const [w, s, e, n] = REGION;
  const ring: [number, number][] = [];
  for (let x = w; x < e; x += step) ring.push([x, s]);
  for (let y = s; y < n; y += step) ring.push([e, y]);
  for (let x = e; x > w; x -= step) ring.push([x, n]);
  for (let y = n; y > s; y -= step) ring.push([w, y]);
  return ring;
}
