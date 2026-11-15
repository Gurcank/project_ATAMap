// CShapes 2.0 polygons -> data/borders/cshapes/<id>.geojson (ADR-06). A development step, not part
// of the build: the inputs are large (26 MB and 40 MB) and sha256-locked, the derived files are
// small and committed, so every build reads the same geometry without downloading anything.
//   select   gwcode + start day from scripts/cshapes-cuts.json (numeric gws* fields; gwsdate is UTC-shifted)
//   clip     to the base-map region, so a 1886 Ottoman polygon does not carry Arabia's far south
//   erase    'hatay': the Natural Earth province, for the years Hatay was outside Turkey (1921-1939)
//   simplify to the level of the 50m base map
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import mapshaper from 'mapshaper';
import { REGION } from '../src/map/region.ts';
import { BORDER_INPUTS, fetchBorderInputs } from './fetch-geo.ts';

interface Cut {
  id: string;
  gwcode: number;
  start: string;
  erase?: 'hatay';
}

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'data', 'borders', 'cshapes');
const { cuts } = JSON.parse(
  readFileSync(join(import.meta.dirname, 'cshapes-cuts.json'), 'utf8'),
) as {
  cuts: Cut[];
};

await fetchBorderInputs();
const cshapes = readFileSync(BORDER_INPUTS.cshapes_2_0.path, 'utf8');

// The one province needed, cut out of the 40 MB file once.
const provinces = JSON.parse(
  readFileSync(BORDER_INPUTS.ne_10m_admin_1_states_provinces.path, 'utf8'),
) as {
  features: { properties: { adm0_a3?: string; name?: string } }[];
};
const hatay = provinces.features.filter(
  (f) => f.properties.adm0_a3 === 'TUR' && f.properties.name === 'Hatay',
);
if (hatay.length !== 1)
  throw new Error(`Natural Earth'te Hatay ili ${hatay.length} kez bulundu (1 bekleniyor)`);
const hatayText = JSON.stringify({ type: 'FeatureCollection', features: hatay });

mkdirSync(OUT, { recursive: true });
for (const cut of cuts) {
  const [y, m, d] = cut.start.split('-').map(Number);
  const commands = [
    '-i cshapes.geojson',
    `-filter 'gwcode == ${cut.gwcode} && gwsyear == ${y} && gwsmonth == ${m} && gwsday == ${d}'`,
    `-clip bbox=${REGION.join(',')}`,
    ...(cut.erase === 'hatay' ? ['-erase hatay.geojson'] : []),
    '-simplify 30% keep-shapes',
    '-filter-fields',
    '-o out.geojson precision=0.0001 geojson-type=FeatureCollection',
  ].join(' ');
  const output = (await mapshaper.applyCommands(commands, {
    'cshapes.geojson': cshapes,
    'hatay.geojson': hatayText,
  })) as Record<string, string | Uint8Array>;
  const text = String(output['out.geojson']);
  const features = (JSON.parse(text) as { features: unknown[] }).features.length;
  if (features !== 1) throw new Error(`${cut.id}: ${features} poligon seçildi (1 bekleniyor)`);
  writeFileSync(join(OUT, `${cut.id}.geojson`), text + '\n');
  console.log(`${cut.id}: ${(text.length / 1024).toFixed(0)} KB`);
}
console.log(`prepare-cshapes: ${cuts.length} geometri yazıldı.`);
