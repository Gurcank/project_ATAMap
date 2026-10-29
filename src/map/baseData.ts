// Base map levels (ADR-05): the 110m drawing ships inside the bundle as the offline fallback,
// 50m loads after first paint, 10m only once the user zooms in far enough to see the difference.
import type { FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import fallbackTopology from './generated/base-110m.json';

export type BaseLevel = '110m' | '50m' | '10m';

export interface Base {
  level: BaseLevel;
  land: FeatureCollection<Geometry>;
  lakes: FeatureCollection<Geometry>;
}

function toBase(level: BaseLevel, topology: Topology): Base {
  const collection = (name: string) =>
    feature(topology, topology.objects[name] as never) as unknown as FeatureCollection<Geometry>;
  return { level, land: collection('land'), lakes: collection('lakes') };
}

export const fallbackBase: Base = toBase('110m', fallbackTopology as unknown as Topology);

export async function fetchBase(level: '50m' | '10m'): Promise<Base> {
  const res = await fetch(`/geo/base-${level}.topojson`);
  if (!res.ok) throw new Error(`base-${level}: HTTP ${res.status}`);
  return toBase(level, (await res.json()) as Topology);
}

/** Zoom factor from which the 10m drawing replaces the 50m one. */
export const DETAIL_ZOOM = 4;
