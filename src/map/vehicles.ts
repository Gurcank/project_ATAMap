// Vehicle silhouettes (SPEC §5.2 M2): plain, engraved-looking shapes about 24 units wide, centred
// on the origin and facing right. Each is a single path, far under the 4 KB-per-glyph budget.
import type { Vehicle } from '../schema/index.ts';

export const VEHICLE_PATH: Record<Vehicle, string> = {
  // Horse in profile.
  at: 'M-10 2 Q-8 -5 0 -5 L6 -5 L9 -9 L11 -7 L9 -3 L9 3 L7 3 L7 8 L5 8 L5 3 L-5 3 L-5 8 L-7 8 L-7 3 Z',
  // Locomotive with funnel and three wheels.
  tren: 'M-11 -5 H3 V-9 H7 V-5 H11 V4 H-11 Z M-8 4 V7 M0 4 V7 M8 4 V7',
  // Hull, cabin and funnel.
  gemi: 'M-11 2 H11 L7 8 H-7 Z M-5 2 V-3 H5 V2 M-1 -3 V-8 H2 V-3',
  // Saloon car with two wheels.
  otomobil: 'M-11 3 V-1 L-7 -1 L-4 -5 H4 L7 -1 H11 V3 Z M-6 3 V6 M6 3 V6',
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
