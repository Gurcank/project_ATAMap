// Land-only border lines for a CShapes polity (2026-11-16). CShapes draws a state's whole outline,
// coasts included, and its simplified coast does not match the Natural Earth coast of the base map:
// drawn as is, every coast gets a second, slightly offset line. Here each segment of the outline is
// kept only when the ground just outside it is land, i.e. the segment is a border with a neighbour.

export type Pt = [number, number];
export type Ring = Pt[];
export type PolygonRings = Ring[];

/** Distances outside the outline that must all be land, km. One near point alone is fooled by a
 *  CShapes coast lying a little inland of the Natural Earth coast; the far ones settle it. */
const PROBES_KM = [5, 10, 20];
const KM_PER_DEG = 111.32;
const EDGE_EPS = 1e-6;

/** Even-odd ray test over all rings of all polygons (holes and islands included). */
export function inRings(pt: Pt, polygons: PolygonRings[]): boolean {
  const [x, y] = pt;
  let inside = false;
  for (const rings of polygons) {
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i]!;
        const [xj, yj] = ring[j]!;
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
    }
  }
  return inside;
}

/** A point `km` away from `m` along the unit normal (nx, ny), given in km space. */
function offset(m: Pt, nx: number, ny: number, km: number): Pt {
  const cos = Math.cos((m[1] * Math.PI) / 180) || 1e-9;
  return [m[0] + (nx * km) / (KM_PER_DEG * cos), m[1] + (ny * km) / KM_PER_DEG];
}

const onEdge = (a: Pt, b: Pt, box: readonly [number, number, number, number]) => {
  const [w, s, e, n] = box;
  const same = (u: number, v: number, k: number) =>
    Math.abs(u - k) < EDGE_EPS && Math.abs(v - k) < EDGE_EPS;
  return same(a[0], b[0], w) || same(a[0], b[0], e) || same(a[1], b[1], s) || same(a[1], b[1], n);
};

/**
 * The parts of the polity outline that border land. `edge` is the clip box the polygons were cut
 * to: segments lying on it are artefacts of the cut, not borders, and are dropped.
 */
export function landBorderLines(
  polity: PolygonRings[],
  isLand: (pt: Pt) => boolean,
  edge?: readonly [number, number, number, number],
): Pt[][] {
  const lines: Pt[][] = [];
  for (const rings of polity) {
    for (const ring of rings) {
      const n = ring.length - 1; // closed ring: last point repeats the first
      if (n < 2) continue;
      const keep: boolean[] = [];
      for (let i = 0; i < n; i++) {
        const a = ring[i]!;
        const b = ring[i + 1]!;
        if (edge && onEdge(a, b, edge)) {
          keep.push(false);
          continue;
        }
        const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const cos = Math.cos((m[1] * Math.PI) / 180);
        const dx = (b[0] - a[0]) * cos;
        const dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        let nx = -dy / len;
        let ny = dx / len;
        // Point the normal outward: one kilometre that way must be outside the polity.
        if (inRings(offset(m, nx, ny, 1), polity)) {
          nx = -nx;
          ny = -ny;
        }
        // A neighbour lies outside the polity: across a strait (the Bosphorus, the Dardanelles) the
        // far shore is land too, but the same state's.
        keep.push(
          PROBES_KM.every((km) => {
            const probe = offset(m, nx, ny, km);
            return isLand(probe) && !inRings(probe, polity);
          }),
        );
      }
      // Runs of kept segments become lines; a run that wraps past the ring's start is joined.
      let run: Pt[] = [];
      const runs: Pt[][] = [];
      for (let i = 0; i < n; i++) {
        if (keep[i]) {
          if (run.length === 0) run.push(ring[i]!);
          run.push(ring[i + 1]!);
        } else if (run.length > 0) {
          runs.push(run);
          run = [];
        }
      }
      if (run.length > 0) {
        if (keep[0] && runs.length > 0 && runs[0]![0] === ring[0]) {
          runs[0] = [...run, ...runs[0]!.slice(1)];
        } else runs.push(run);
      }
      lines.push(...runs);
    }
  }
  return lines;
}

/** A land test over a set of polygons, with a bounding box check first for speed. */
export function landTest(polygons: PolygonRings[]): (pt: Pt) => boolean {
  const boxed = polygons.map((rings) => {
    let w = Infinity;
    let s = Infinity;
    let e = -Infinity;
    let n = -Infinity;
    for (const [x, y] of rings[0] ?? []) {
      w = Math.min(w, x);
      e = Math.max(e, x);
      s = Math.min(s, y);
      n = Math.max(n, y);
    }
    return { rings, w, s, e, n };
  });
  return (pt) => {
    const [x, y] = pt;
    let inside = false;
    for (const p of boxed) {
      if (x < p.w || x > p.e || y < p.s || y > p.n) continue;
      if (inRings(pt, [p.rings])) inside = !inside;
    }
    return inside;
  };
}
