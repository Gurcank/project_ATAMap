// Vehicle silhouettes (SPEC §5.2 M2): plain, engraved-looking shapes about 24 units wide, centred
// on the origin and facing right. Each is a single path, far under the 4 KB-per-glyph budget.
import type { Vehicle } from '../schema/index.ts';

/** A circle as two arcs, so a wheel can live inside a single path. */
const wheel = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const VEHICLE_PATH: Record<Vehicle, string> = {
  // Horse in profile: tail, hind leg, belly, fore leg, neck, head with muzzle.
  at: 'M-8 -3 Q-12 -4 -12 3 Q-10 -1 -8 0 L-7 6 H-5 L-4 1 Q0 3 3 1 L4 6 H6 L6.5 -1 Q9 -3 9 -8 L12.5 -5.5 L12.5 -3.5 L10 -3.5 Q8 -2 7 -3 Q4 -6 -1 -5 Q-5 -5 -8 -3 Z',
  // Locomotive: boiler, cab, funnel and three wheels.
  tren: `M-11 -5 H3 V-9 H7 V-5 H11 V4 H-11 Z M-9 -5 V-8 H-6 V-5 ${wheel(-6, 5, 2)} ${wheel(0, 5, 2)} ${wheel(6, 5, 2)}`,
  // Hull, cabin and funnel.
  gemi: 'M-11 2 H11 L7 8 H-7 Z M-5 2 V-3 H5 V2 M-1 -3 V-8 H2 V-3',
  // Saloon car with two wheels.
  otomobil: `M-11 3 V-1 L-7 -1 L-4 -5 H4 L7 -1 H11 V3 Z ${wheel(-6, 3.5, 2.5)} ${wheel(6, 3.5, 2.5)}`,
  // Aeroplane seen from above.
  ucak: 'M12 0 L-4 -3 L-8 -9 H-10 L-8 -1 L-12 -1 L-13 -4 H-14 V4 H-13 L-12 1 L-8 1 L-10 9 H-8 L-4 3 Z',
};

export const VEHICLE_LABEL: Record<Vehicle, string> = {
  at: 'At',
  tren: 'Tren',
  gemi: 'Gemi',
  otomobil: 'Otomobil',
  ucak: 'Uçak',
};
