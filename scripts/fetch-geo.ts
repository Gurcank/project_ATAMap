// Downloads the Natural Earth layers build-geo.ts needs into geo-src/ (git-ignored; ADR-05).
// The URLs are pinned to one commit of nvkelso/natural-earth-vector and every file is checked
// against the sha256 in scripts/geo-sources.json, so a rebuild cannot silently change the map.
// First run for a new file: no hash is recorded yet, so it is written to the lock file.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DIR = join(ROOT, 'geo-src', 'naturalearth');
const LOCK = join(import.meta.dirname, 'geo-sources.json');

export const NE_COMMIT = '117488dc884bad03366ff727eca013e434615127';
export const NE_LAYERS = [
  'ne_110m_land',
  'ne_110m_lakes',
  'ne_50m_land',
  'ne_50m_lakes',
  'ne_10m_land',
  'ne_10m_lakes',
] as const;

const urlOf = (layer: string) =>
  `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NE_COMMIT}/geojson/${layer}.geojson`;
const sha256 = (buf: Uint8Array) => createHash('sha256').update(buf).digest('hex');

export async function fetchGeo(): Promise<void> {
  mkdirSync(DIR, { recursive: true });
  const lock: { commit: string; files: Record<string, string> } = existsSync(LOCK)
    ? (JSON.parse(readFileSync(LOCK, 'utf8')) as typeof lock)
    : { commit: NE_COMMIT, files: {} };
  if (lock.commit !== NE_COMMIT) throw new Error('geo-sources.json başka bir commit için yazılmış');

  let changed = false;
  for (const layer of NE_LAYERS) {
    const path = join(DIR, `${layer}.geojson`);
    let bytes: Uint8Array;
    if (existsSync(path)) {
      bytes = readFileSync(path);
    } else {
      console.log(`indiriliyor: ${layer}`);
      const res = await fetch(urlOf(layer));
      if (!res.ok) throw new Error(`${layer}: HTTP ${res.status}`);
      bytes = new Uint8Array(await res.arrayBuffer());
      writeFileSync(path, bytes);
    }
    const hash = sha256(bytes);
    const known = lock.files[layer];
    if (known === undefined) {
      lock.files[layer] = hash;
      changed = true;
      console.log(`${layer}: sha256 kilit dosyasına yazıldı`);
    } else if (known !== hash) {
      throw new Error(
        `${layer}: sha256 uyuşmuyor (beklenen ${known}, bulunan ${hash}). geo-src/ dosyasını silip yeniden indirin.`,
      );
    }
  }
  if (changed) writeFileSync(LOCK, JSON.stringify(lock, null, 2) + '\n');
}

if (import.meta.main) {
  await fetchGeo();
  console.log('fetch-geo: tamam.');
}
