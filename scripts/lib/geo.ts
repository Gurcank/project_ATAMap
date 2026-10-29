// Geometry helpers shared by build-geo.ts and build-borders.ts.
type Ring = number[][];
type Geometry = { type: string; coordinates: unknown };
export type FeatureLike = { geometry: Geometry | null };
export type Collection = { type?: 'FeatureCollection'; features: FeatureLike[] };

// Signed area of a lon/lat ring (shoelace). Negative = clockwise.
const ringArea = (r: Ring) =>
  r.reduce(
    (sum, p, i) => sum + p[0]! * r[(i + 1) % r.length]![1]! - r[(i + 1) % r.length]![0]! * p[1]!,
    0,
  ) / 2;

/**
 * d3-geo wants exterior rings clockwise and holes counter-clockwise; GeoJSON (RFC 7946) and
 * mapshaper write the opposite, which makes d3 fill the complement of every polygon. The clip box
 * keeps every ring away from the poles and the antimeridian, so a planar test is enough.
 */
export function rewindForD3(fc: Collection): void {
  const fix = (poly: Ring[]) =>
    poly.forEach((ring, i) => {
      const clockwise = ringArea(ring) < 0;
      if (clockwise !== (i === 0)) ring.reverse();
    });
  for (const f of fc.features) {
    if (f.geometry?.type === 'Polygon') fix(f.geometry.coordinates as Ring[]);
    else if (f.geometry?.type === 'MultiPolygon') (f.geometry.coordinates as Ring[][]).forEach(fix);
  }
}

/** Accepts a Feature, FeatureCollection or bare Polygon/MultiPolygon; returns a collection. */
export function asCollection(value: unknown): Collection {
  const v = value as { type?: string; features?: FeatureLike[]; geometry?: Geometry };
  if (v.type === 'FeatureCollection' && Array.isArray(v.features)) {
    return { type: 'FeatureCollection', features: v.features };
  }
  if (v.type === 'Feature') {
    return { type: 'FeatureCollection', features: [{ geometry: v.geometry ?? null }] };
  }
  if (v.type === 'Polygon' || v.type === 'MultiPolygon') {
    return { type: 'FeatureCollection', features: [{ geometry: v as unknown as Geometry }] };
  }
  throw new Error('GeoJSON Feature, FeatureCollection, Polygon ya da MultiPolygon bekleniyor');
}

/** Rule of SPEC §6 BorderChange.geometry: only Polygon / MultiPolygon, every ring closed. */
export function polygonProblems(fc: Collection): string[] {
  const problems: string[] = [];
  if (fc.features.length === 0) problems.push('geometri boş');
  for (const f of fc.features) {
    const type = f.geometry?.type;
    if (type !== 'Polygon' && type !== 'MultiPolygon') {
      problems.push(`geometri türü ${type ?? 'yok'}; yalnız Polygon/MultiPolygon kabul edilir`);
      continue;
    }
    const polys = (
      type === 'Polygon' ? [f.geometry!.coordinates] : f.geometry!.coordinates
    ) as Ring[][];
    for (const poly of polys) {
      for (const ring of poly) {
        const a = ring[0];
        const b = ring.at(-1);
        if (ring.length < 4 || !a || !b || a[0] !== b[0] || a[1] !== b[1]) {
          problems.push('halka kapalı değil ya da 4 noktadan az');
        }
      }
    }
  }
  return problems;
}
