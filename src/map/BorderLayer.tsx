// Period borders (SPEC §4 MapCanvas, §5.2 M5). One TopoJSON per BorderChange, fetched when it
// becomes active. When a polity's active change switches, the old line fades out while the new one
// fades in. A border that is approximate, or an occupation, is hatched instead of left empty.
import type { FeatureCollection, Geometry } from 'geojson';
import { geoPath, type GeoProjection } from 'd3-geo';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { BorderChange } from '../schema/index.ts';
import styles from './BorderLayer.module.css';

interface Props {
  borders: BorderChange[];
  projection: GeoProjection;
}

const cache = new Map<string, Promise<FeatureCollection<Geometry>>>();

function loadBorder(id: string): Promise<FeatureCollection<Geometry>> {
  let hit = cache.get(id);
  if (!hit) {
    hit = fetch(`/geo/borders/${id}.topojson`).then(async (res) => {
      if (!res.ok) throw new Error(`border ${id}: HTTP ${res.status}`);
      const topology = (await res.json()) as Topology;
      return feature(
        topology,
        topology.objects.polity as never,
      ) as unknown as FeatureCollection<Geometry>;
    });
    hit.catch(() => cache.delete(id)); // retried on the next activation
    cache.set(id, hit);
  }
  return hit;
}

interface Shown {
  border: BorderChange;
  leaving: boolean;
}

export function BorderLayer({ borders, projection }: Props) {
  const [shapes, setShapes] = useState<Map<string, FeatureCollection<Geometry>>>(new Map());
  const [shown, setShown] = useState<Shown[]>([]);

  // Fetch what became active; a file that cannot be loaded simply stays undrawn.
  useEffect(() => {
    let cancelled = false;
    for (const b of borders) {
      loadBorder(b.id).then(
        (fc) =>
          !cancelled && setShapes((prev) => (prev.has(b.id) ? prev : new Map(prev).set(b.id, fc))),
        () => undefined,
      );
    }
    return () => {
      cancelled = true;
    };
  }, [borders]);

  // Keep what left on screen just long enough to fade out (M5).
  useEffect(() => {
    setShown((prev) => {
      const activeIds = new Set(borders.map((b) => b.id));
      const leaving = prev
        .filter((s) => !activeIds.has(s.border.id))
        .map((s) => ({ ...s, leaving: true }));
      return [...borders.map((border) => ({ border, leaving: false })), ...leaving];
    });
  }, [borders]);

  const path = useMemo(() => geoPath(projection), [projection]);
  const drop = (id: string) => setShown((prev) => prev.filter((s) => s.border.id !== id));

  return (
    <g class={styles.layer}>
      {shown.map(({ border, leaving }) => {
        const fc = shapes.get(border.id);
        if (!fc) return null;
        const hatched = border.geometryApproximate || border.kind === 'isgal';
        return (
          <path
            key={border.id}
            class={`${styles.border} ${hatched ? styles.hatched : ''} ${leaving ? styles.leaving : ''}`}
            d={fc.features.map((f) => path(f) ?? '').join('')}
            data-border-id={border.id}
            onAnimationEnd={leaving ? () => drop(border.id) : undefined}
          />
        );
      })}
    </g>
  );
}
