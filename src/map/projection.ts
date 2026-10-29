// Lambert conformal conic (ADR-04). T1 (final parameters) is tuned against screenshots in Faz 4.
import { geoConicConformal, type GeoProjection } from 'd3-geo';

/** Standard parallels and central meridian from ADR-04. */
const PARALLELS: [number, number] = [33, 48];
const CENTRAL_MERIDIAN = 25;

/**
 * The region the first view fits to: Balkans, Anatolia, the Levant, Tripolitania, central Europe
 * (ADR-04). West, south, east, north. Points on the box edges keep the fit honest on a conic.
 */
const FOCUS = { west: 3, south: 27, east: 47, north: 52 };

const FOCUS_POINTS: [number, number][] = [
  [FOCUS.west, FOCUS.south],
  [FOCUS.east, FOCUS.south],
  [FOCUS.east, FOCUS.north],
  [FOCUS.west, FOCUS.north],
  [CENTRAL_MERIDIAN, FOCUS.south],
  [CENTRAL_MERIDIAN, FOCUS.north],
  [FOCUS.west, (FOCUS.south + FOCUS.north) / 2],
  [FOCUS.east, (FOCUS.south + FOCUS.north) / 2],
];

export function createProjection(width: number, height: number): GeoProjection {
  const pad = Math.min(width, height) * 0.04;
  return geoConicConformal()
    .parallels(PARALLELS)
    .rotate([-CENTRAL_MERIDIAN, 0])
    .fitExtent(
      [
        [pad, pad],
        [width - pad, height - pad],
      ],
      { type: 'MultiPoint', coordinates: FOCUS_POINTS },
    );
}
