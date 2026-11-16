// Period borders (SPEC §4 MapCanvas, §5.2 M5). One TopoJSON per BorderChange, fetched when it
// becomes active. When a polity's active change switches, the old line fades out while the new one
// fades in. A border that is approximate, or an occupation, is hatched instead of left empty.
// The stroke follows the file's 'lines' (land borders only, build-borders.ts) when it has them, so
// coasts are drawn once, by the base map; otherwise it follows the polygon outline.
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

interface Shape {
  polity: FeatureCollection<Geometry>;
  lines: FeatureCollection<Geometry> | null;
}

const cache = new Map<string, Promise<Shape>>();

function loadBorder(id: string): Promise<Shape> {
  let hit = cache.get(id);
  if (!hit) {
    hit = fetch(`/geo/borders/${id}.topojson`).then(async (res) => {
      if (!res.ok) throw new Error(`border ${id}: HTTP ${res.status}`);
      const topology = (await res.json()) as Topology;
      const read = (name: string) =>
        topology.objects[name]
          ? (feature(
              topology,
              topology.objects[name] as never,
            ) as unknown as FeatureCollection<Geometry>)
          : null;
      return {
        polity: read('polity') ?? { type: 'FeatureCollection', features: [] },
        lines: read('lines'),
      };
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
  const [shapes, setShapes] = useState<Map<string, Shape>>(new Map());
  const [shown, setShown] = useState<Shown[]>([]);

  // Fetch what became active; a file that cannot be loaded simply stays undrawn.
  useEffect(() => {
    let cancelled = false;
    for (const b of borders) {
      loadBorder(b.id).then(
        (shape) =>
          !cancelled &&
          setShapes((prev) => (prev.has(b.id) ? prev : new Map(prev).set(b.id, shape))),
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
        const shape = shapes.get(border.id);
        if (!shape) return null;
        const hatched = border.geometryApproximate || border.kind === 'isgal';
        const draw = (fc: FeatureCollection<Geometry>) =>
          fc.features.map((f) => path(f) ?? '').join('');
        return (
          <g
            key={border.id}
            class={`${styles.border} ${hatched ? styles.hatched : ''} ${leaving ? styles.leaving : ''}`}
            data-border-id={border.id}
            onAnimationEnd={leaving ? () => drop(border.id) : undefined}
          >
            {hatched && <path class={styles.fill} d={draw(shape.polity)} />}
            <path class={styles.line} d={draw(shape.lines ?? shape.polity)} />
          </g>
        );
      })}
    </g>
  );
}
