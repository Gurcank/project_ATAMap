// Border geometries -> <out>/geo/borders/<id>.topojson, one file per BorderChange (ADR-06).
// Runs after build-data: it converts only the borders that build-data kept (verified, sourced).
//   geometryOrigin 'elle-cizim'  data/borders/manual/<id>.geojson, drawn from a sourced description (A14)
//   geometryOrigin 'cshapes'     not wired yet: no CShapes-backed record exists (SOURCES §3.4)
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { topology } from 'topojson-server';
import type { BorderChange } from '../src/schema/index.ts';
import { paths } from './lib/cli.ts';
import { asCollection, polygonProblems, rewindForD3 } from './lib/geo.ts';

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

const problems: string[] = [];
for (const border of borders) {
  const fail = (message: string) => problems.push(`border:${border.id}: ${message}`);
  if (border.geometryOrigin === 'cshapes') {
    fail('CShapes geometrisi henüz bağlı değil (build-borders yalnız elle çizimi okur)');
    continue;
  }
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
  const bad = polygonProblems(collection);
  if (bad.length > 0) {
    bad.forEach(fail);
    continue;
  }
  rewindForD3(collection);
  const text = JSON.stringify(topology({ polity: collection as never }, 1e5));
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
