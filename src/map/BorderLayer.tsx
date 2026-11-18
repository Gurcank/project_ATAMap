// Period borders (SPEC §4 MapCanvas, §5.2 M5). One TopoJSON per BorderChange, fetched when it
// becomes active. When a polity's active change switches, the old one fades out while the new one
// fades in. A border that is approximate, or an occupation, is hatched instead of left empty.
//
// Drawn like a hand-coloured atlas (2026-11-17): the territory gets a pale wash and a stronger brush
// stroke just inside its edge, on land borders and coasts alike. Both are clipped to the polity and
// to the base map's land, so along the sea they follow the base coastline exactly (CShapes coasts do
// not match it; stroking them doubled the coast, 2026-11-16). The thin ink line stays on the file's
// 'lines' (land borders only, build-borders.ts) when it has them, else on the polygon outline.
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
        const polity = draw(shape.polity);
        const lines = shape.lines ? draw(shape.lines) : polity;
        const clipId = `polity-${border.id}`;
        return (
          <g
            key={border.id}
            class={`${styles.border} ${hatched ? styles.hatched : ''} ${leaving ? styles.leaving : ''}`}
            data-border-id={border.id}
            onAnimationEnd={leaving ? () => drop(border.id) : undefined}
          >
            <clipPath id={clipId}>
              <path d={polity} />
            </clipPath>
            <g clip-path={`url(#${clipId})`}>
              <g clip-path="url(#land-clip)">
                <use href="#land-shape" class={styles.wash} />
                <use href="#land-shape" class={styles.band} />
              </g>
              <path class={styles.band} d={lines} />
            </g>
            {hatched && <path class={styles.fill} d={polity} />}
            <path class={styles.line} d={lines} />
          </g>
        );
      })}
    </g>
  );
}
