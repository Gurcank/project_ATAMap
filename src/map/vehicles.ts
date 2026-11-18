// Vehicle silhouettes (SPEC §5.2 M2): plain, engraved-looking shapes about 26 units wide, centred
// on the origin and facing right (+x is the direction of travel). Each body is a single path, far
// under the 4 KB-per-glyph budget; evenodd fill leaves windows open.
import type { Vehicle } from '../schema/index.ts';

/** A circle as two arcs, so a wheel can live inside a single path. */
const wheel = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const VEHICLE_PATH: Record<Vehicle, string> = {
  // Horse in profile with a rider: tail, hind leg, belly, fore leg, neck and head; the rider's body
  // and head above the saddle.
  at: `M-8 -3 Q-12 -4 -12 3 Q-10 -1 -8 0 L-7 6 H-5 L-4 1 Q0 3 3 1 L4 6 H6 L6.5 -1 Q9 -3 9 -8 L12.5 -5.5 L12.5 -3.5 L10 -3.5 Q8 -2 7 -3 Q4 -6 -1 -5 Q-5 -5 -8 -3 Z M-3 -5 L-2 -11 H1.5 L2.5 -5 Z ${wheel(-0.2, -13, 1.6)}`,
  // Locomotive running right: cab with a window at the back, boiler with a dome, funnel at the
  // front, cowcatcher, three driving wheels.
  tren: `M-12 -9 H-4 V4 H-12 Z M-10 -7 H-6 V-3 H-10 Z M-4 -4 H9 V4 H-4 Z M1 -4 Q2.5 -7.5 4 -4 Z M6 -4 V-9 H9 V-4 Z M9 4 L12 6 H9 Z ${wheel(-8, 5, 2.2)} ${wheel(-1, 5, 2.2)} ${wheel(5, 5, 2.2)}`,
  // Steamship: hull with a raised bow, deckhouse, funnel, two masts.
  gemi: 'M-12 1 H10 L13 -1 L10 7 H-9 Z M-6 1 V-3 H5 V1 Z M-1.5 -3 V-9 H2 V-3 Z M8 1 V-7 M-9 1 V-5',
  // Open touring car of the 1920s: long bonnet, windscreen, seats, two spoked wheels.
  otomobil: `M-12 3 V-1 L-9 -2 H-4 L-2 -6 H0 L1 -2 H7 L12 -1 V3 Z ${wheel(-7, 3.5, 2.8)} ${wheel(7, 3.5, 2.8)}`,
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

/**
 * What a moving vehicle leaves behind (2026-11-17), in the glyph's own coordinates so it turns and
 * mirrors with it: puffs of smoke or dust that drift back and fade, and a ship's wake. They show
 * the direction of travel; they stop when the vehicle arrives and never run under reduced motion.
 */
export const VEHICLE_TRAIL: Record<Vehicle, { puffs: [number, number][]; wake?: string }> = {
  at: {
    puffs: [
      [-6, 6.5],
      [4, 6.5],
    ],
  },
  tren: {
    puffs: [
      [7.5, -10],
      [7.5, -10],
      [7.5, -10],
    ],
  },
  gemi: { puffs: [[0.2, -10]], wake: 'M-10 6 Q-15 4 -20 4.5 M-10 7.5 Q-15 9 -20 9' },
  otomobil: { puffs: [[-13, 2]] },
  ucak: { puffs: [] },
};
