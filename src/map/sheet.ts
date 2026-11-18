// Geometry of the printed sheet (2026-11-17, SPEC A35/A42): the map is printed inside an atlas
// neatline on a sheet of paper that lies on the table. All values are in projected pixels at zoom
// 1, so the sheet moves and scales with the map like a real sheet under a moving camera.
//   frame     the neatline: a lon/lat box, fan-shaped on the conic projection, a little inside the
//             base maps' clip box so the clip edge never shows (it is cut off by the frame)
//   zebra     the alternating degree bar between the outer and inner neatline
//   graticule faint meridians and parallels every 5 degrees, inside the frame
//   labels    degree figures outside the frame
//   sheet     the paper: the frame's bounds plus a blank margin
import { geoGraticule, geoPath, type GeoProjection } from 'd3-geo';
import { REGION } from './region.ts';

/** One degree inside the clip box on every side (west, south, east, north). */
export const FRAME = [REGION[0] + 1, REGION[1] + 1, REGION[2] - 1, REGION[3] - 1] as const;
/** Width of the degree bar, in degrees. */
const BAR = 0.3;
const LABEL_STEP = 5;
/** Meridians crowd together towards the pole on a conic, so their figures go every 10 degrees. */
const LON_LABEL_STEP = 10;

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SheetLabel {
  x: number;
  y: number;
  text: string;
  anchor: 'start' | 'middle' | 'end';
}

export interface Sheet {
  frame: string;
  frameInner: string;
  zebra: string;
  graticule: string;
  labels: SheetLabel[];
  frameBox: Box;
  paper: Box;
  /** Radius of the rolled left and right edges. */
  roll: number;
}

type LonLat = [number, number];

/** A lon/lat box as a closed ring, one point per degree (edges are curves on a conic). */
function ring(w: number, s: number, e: number, n: number): LonLat[] {
  const out: LonLat[] = [];
  for (let x = w; x < e; x++) out.push([x, s]);
  for (let y = s; y < n; y++) out.push([e, y]);
  for (let x = e; x > w; x--) out.push([x, n]);
  for (let y = n; y > s; y--) out.push([w, y]);
  return out;
}

const lonText = (lon: number) => (lon === 0 ? '0°' : `${Math.abs(lon)}° ${lon < 0 ? 'B' : 'D'}`);
const latText = (lat: number) => `${lat}° K`;

export function buildSheet(projection: GeoProjection): Sheet {
  const [w, s, e, n] = FRAME;
  const xy = (p: LonLat) => projection(p) ?? [0, 0];
  const pathOf = (points: LonLat[]) =>
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${xy(p)[0].toFixed(1)} ${xy(p)[1].toFixed(1)}`)
      .join('') + 'Z';

  // Alternate one-degree cells between the outer and the inner line, on all four sides.
  const cells: string[] = [];
  const cell = (a: LonLat, b: LonLat, c: LonLat, d: LonLat) => cells.push(pathOf([a, b, c, d]));
  for (let x = w; x < e; x++) {
    if ((x - w) % 2 !== 0) continue;
    cell([x, n], [x + 1, n], [x + 1, n - BAR], [x, n - BAR]);
    cell([x, s], [x + 1, s], [x + 1, s + BAR], [x, s + BAR]);
  }
  for (let y = s; y < n; y++) {
    if ((y - s) % 2 !== 0) continue;
    cell([w, y], [w, y + 1], [w + BAR, y + 1], [w + BAR, y]);
    cell([e, y], [e, y + 1], [e - BAR, y + 1], [e - BAR, y]);
  }

  const labels: SheetLabel[] = [];
  for (let lon = Math.ceil(w / LON_LABEL_STEP) * LON_LABEL_STEP; lon <= e; lon += LON_LABEL_STEP) {
    const [tx, ty] = xy([lon, n + 0.5]);
    const [bx, by] = xy([lon, s - 1.1]);
    labels.push({ x: tx, y: ty, text: lonText(lon), anchor: 'middle' });
    labels.push({ x: bx, y: by, text: lonText(lon), anchor: 'middle' });
  }
  for (let lat = Math.ceil(s / LABEL_STEP) * LABEL_STEP; lat <= n; lat += LABEL_STEP) {
    const [lx, ly] = xy([w - 0.5, lat]);
    const [rx, ry] = xy([e + 0.5, lat]);
    labels.push({ x: lx, y: ly, text: latText(lat), anchor: 'end' });
    labels.push({ x: rx, y: ry, text: latText(lat), anchor: 'start' });
  }

  const outline = ring(w, s, e, n);
  const pts = outline.map(xy);
  const frameBox = {
    x0: Math.min(...pts.map((p) => p[0])),
    y0: Math.min(...pts.map((p) => p[1])),
    x1: Math.max(...pts.map((p) => p[0])),
    y1: Math.max(...pts.map((p) => p[1])),
  };
  // A blank margin wide enough for the degree figures, as on a printed atlas plate.
  const margin = Math.max(frameBox.x1 - frameBox.x0, frameBox.y1 - frameBox.y0) * 0.06;
  const graticule = geoGraticule()
    .extent([
      [w, s],
      [e, n],
    ])
    .step([LABEL_STEP, LABEL_STEP]);

  return {
    frame: pathOf(outline),
    frameInner: pathOf(ring(w + BAR, s + BAR, e - BAR, n - BAR)),
    zebra: cells.join(''),
    graticule: geoPath(projection)(graticule()) ?? '',
    labels,
    frameBox,
    paper: {
      x0: frameBox.x0 - margin,
      y0: frameBox.y0 - margin,
      x1: frameBox.x1 + margin,
      y1: frameBox.y1 + margin,
    },
    roll: margin * 0.4,
  };
}
