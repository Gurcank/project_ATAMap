// Border geometries -> <out>/geo/borders/<id>.topojson, one file per BorderChange (ADR-06).
// Runs after build-data: it converts only the borders that build-data kept (verified, sourced).
//   geometryOrigin 'elle-cizim'  data/borders/manual/<id>.geojson, drawn from a sourced description (A14)
//   geometryOrigin 'cshapes'     data/borders/cshapes/<id>.geojson, cut by scripts/prepare-cshapes.ts
// Each file holds the polity polygon ('polity', for hatching) and, for CShapes, the parts of its
// outline that border land ('lines', for the stroke): CShapes coasts do not match the base map's.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { topology } from 'topojson-server';
import type { BorderChange } from '../src/schema/index.ts';
import { REGION } from '../src/map/region.ts';
import { landBorderLines, landTest, type Pt } from './lib/borderLines.ts';
import { paths } from './lib/cli.ts';
import { asCollection, polygonProblems, polygonsOf, rewindForD3 } from './lib/geo.ts';

const KB = 1024;
/** ARCHITECTURE §5: one border file per date, gzip. */
const BUDGET = 150 * KB;

const stepsPath = join(paths.out, 'data', 'steps.json');
if (!existsSync(stepsPath)) {
  console.error('HATA: public/data/steps.json yok. Önce build-data çalışmalı.');
  process.exit(1);
}
const { borders } = JSON.parse(readFileSync(stepsPath, 'utf8')) as { borders: BorderChange[] };

const outDir = join(paths.out, 'geo', 'borders');
mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(outDir)) {
  if (name.endsWith('.topojson')) rmSync(join(outDir, name));
}

/** Natural Earth 50m land, the same source as the base map; loaded once, when a CShapes border needs it. */
let isLand: ((pt: Pt) => boolean) | undefined;
function land(): (pt: Pt) => boolean {
  if (isLand) return isLand;
  const file = join(paths.root, 'geo-src', 'naturalearth', 'ne_50m_land.geojson');
  if (!existsSync(file)) {
    console.error('HATA: geo-src/naturalearth/ne_50m_land.geojson yok. Önce npm run fetch:geo.');
    process.exit(1);
  }
  isLand = landTest(polygonsOf(asCollection(JSON.parse(readFileSync(file, 'utf8')))));
  return isLand;
}

const problems: string[] = [];
for (const border of borders) {
  const fail = (message: string) => problems.push(`border:${border.id}: ${message}`);
  const source = join(paths.data, border.geometry);
  if (!existsSync(source)) {
    fail(`geometri dosyası yok: ${border.geometry}`);
    continue;
  }
  let collection;
  try {
    collection = asCollection(JSON.parse(readFileSync(source, 'utf8')));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
    continue;
  }
  // An empty collection is allowed on purpose: it hides the polity's line for a period whose
  // border cannot be drawn from a source (e.g. the Midye-Enez line of May-September 1913).
  const bad = collection.features.length === 0 ? [] : polygonProblems(collection);
  if (bad.length > 0) {
    bad.forEach(fail);
    continue;
  }
  const lines =
    border.geometryOrigin === 'cshapes' && collection.features.length > 0
      ? landBorderLines(polygonsOf(collection), land(), REGION)
      : null;
  rewindForD3(collection);
  const objects = lines
    ? {
        polity: collection,
        lines: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'MultiLineString', coordinates: lines },
            },
          ],
        },
      }
    : { polity: collection };
  const text = JSON.stringify(topology(objects as never, 1e5));
  const gz = gzipSync(text).length;
  if (gz > BUDGET) {
    fail(`gzip ${(gz / KB).toFixed(1)} KB, sınır ${BUDGET / KB} KB`);
    continue;
  }
  writeFileSync(join(outDir, `${border.id}.topojson`), text + '\n');
}

if (problems.length > 0) {
  problems.forEach((p) => console.error(`HATA ${p}`));
  process.exit(1);
}
console.log(`build-borders: ${borders.length} sınır geometrisi yazıldı.`);
