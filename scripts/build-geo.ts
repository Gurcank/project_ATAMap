// Natural Earth land + lakes -> region-clipped, quantized TopoJSON at three levels of detail
// (ARCHITECTURE ADR-05). Output:
//   src/map/generated/base-110m.json   embedded in the JS bundle as the offline fallback
//   public/geo/base-50m.topojson       first view, fetched after first paint
//   public/geo/base-10m.topojson       close zoom, fetched lazily
// geo-src/ and the outputs are git-ignored; fetch-geo.ts downloads the pinned sources.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import mapshaper from 'mapshaper';
import { topology } from 'topojson-server';
import { REGION } from '../src/map/region.ts';
import { fetchGeo } from './fetch-geo.ts';
import { rewindForD3, type Collection } from './lib/geo.ts';

const ROOT = join(import.meta.dirname, '..');

interface Level {
  name: string;
  res: '110m' | '50m' | '10m';
  out: string;
  /** Gzip ceiling in bytes (ARCHITECTURE §5). */
  budget: number;
}
const KB = 1024;
const LEVELS: Level[] = [
  { name: '110m', res: '110m', out: 'src/map/generated/base-110m.json', budget: 120 * KB },
  { name: '50m', res: '50m', out: 'public/geo/base-50m.topojson', budget: 400 * KB },
  { name: '10m', res: '10m', out: 'public/geo/base-10m.topojson', budget: 400 * KB },
];

// No -simplify: even the unsimplified 10m region is ~185 KB gzip, well under the 400 KB budget (T2).
async function clip(file: string): Promise<unknown> {
  const cmd = `-i in.json -clip bbox=${REGION.join(',')} -o out.json format=geojson precision=0.0001`;
  const out = await mapshaper.applyCommands(cmd, { 'in.json': readFileSync(file, 'utf8') });
  const fc = JSON.parse(String(out['out.json'])) as Collection;
  rewindForD3(fc);
  return fc;
}

// Guard (ADR-04 trigger): every place must lie inside the clip box.
const places = JSON.parse(readFileSync(join(ROOT, 'data', 'places.json'), 'utf8')) as {
  places: { id: string; point: { lon: number; lat: number } }[];
};
const [w, s, e, n] = REGION;
for (const p of places.places) {
  const { lon, lat } = p.point;
  if (lon < w || lon > e || lat < s || lat > n) {
    console.error(
      `HATA: yer "${p.id}" (${lon}, ${lat}) kırpma kutusunun dışında. REGION genişletilmeli.`,
    );
    process.exit(1);
  }
}

await fetchGeo();

const failures: string[] = [];
for (const level of LEVELS) {
  const dir = join(ROOT, 'geo-src', 'naturalearth');
  const land = await clip(join(dir, `ne_${level.res}_land.geojson`));
  const lakes = await clip(join(dir, `ne_${level.res}_lakes.geojson`));
  // 1e5 quantization steps across the clip box: ~0.7 km at the equator.
  const topo = topology({ land: land as never, lakes: lakes as never }, 1e5);
  const text = JSON.stringify(topo);
  const path = join(ROOT, level.out);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, text + '\n');
  const gz = gzipSync(text).length;
  const ok = gz <= level.budget;
  console.log(
    `build-geo ${level.name}: ${(text.length / KB).toFixed(0)} KB ham, ${(gz / KB).toFixed(1)} KB gzip ` +
      `(sınır ${level.budget / KB} KB)${ok ? '' : '  AŞILDI'}`,
  );
  if (!ok) failures.push(`${level.name} altlığı gzip bütçesini aştı`);
}
if (failures.length > 0) {
  failures.forEach((f) => console.error(`HATA: ${f}`));
  process.exit(1);
}
