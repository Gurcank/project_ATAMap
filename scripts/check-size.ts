// Size budget gate over dist/ (ARCHITECTURE §5, ADR-14). Run after `vite build`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = join(import.meta.dirname, '..', 'dist');
const KB = 1024;

const BUDGET = {
  initialJsTarget: 120 * KB,
  initialJsCeiling: 300 * KB,
  // SPEC §7 (2026-10-27): faces needed on first load vs. faces fetched on the first A4 opening.
  initialFonts: 250 * KB,
  documentFonts: 200 * KB,
  // ARCHITECTURE §5: base maps and per-year document files, gzip.
  fallbackBase: 120 * KB,
  baseMap: 400 * KB,
  documentsTotal: 500 * KB,
};

// Which budget each shipped family counts against (ADR-12). A family missing here fails the check.
const INITIAL_FONT_PREFIXES = ['old-standard-tt', 'alegreya-sans'];
const DOCUMENT_FONT_PREFIXES = ['eb-garamond', 'courier-prime'];

interface ManifestChunk {
  file: string;
  isEntry?: boolean;
  imports?: string[];
  css?: string[];
}

const manifestPath = join(DIST, '.vite', 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error('dist/.vite/manifest.json yok. Önce `npm run build` çalıştırın.');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, ManifestChunk>;

const gz = (file: string) => gzipSync(readFileSync(join(DIST, file))).length;
const fmt = (bytes: number) => `${(bytes / KB).toFixed(1)} KB`;

// Initial JS = every entry plus its static imports, transitively.
const initial = new Set<string>();
const visit = (key: string) => {
  const chunk = manifest[key];
  if (!chunk || initial.has(chunk.file)) return;
  initial.add(chunk.file);
  chunk.imports?.forEach(visit);
};
Object.entries(manifest)
  .filter(([, chunk]) => chunk.isEntry)
  .forEach(([key]) => visit(key));

const initialJs = [...initial].filter((f) => f.endsWith('.js')).reduce((sum, f) => sum + gz(f), 0);

const assets = readdirSync(join(DIST, 'assets'));
const woff2 = assets.filter((f) => f.endsWith('.woff2'));
const fontSize = (f: string) => readFileSync(join(DIST, 'assets', f)).length;
const sumFonts = (prefixes: string[]) =>
  woff2
    .filter((f) => prefixes.some((p) => f.startsWith(p)))
    .reduce((sum, f) => sum + fontSize(f), 0);
const initialFonts = sumFonts(INITIAL_FONT_PREFIXES);
const documentFonts = sumFonts(DOCUMENT_FONT_PREFIXES);
const unbudgetedFonts = woff2.filter(
  (f) => ![...INITIAL_FONT_PREFIXES, ...DOCUMENT_FONT_PREFIXES].some((p) => f.startsWith(p)),
);

const failures: string[] = [];
console.log(
  `İlk yükleme JS (gzip): ${fmt(initialJs)}  hedef ${fmt(BUDGET.initialJsTarget)}, tavan ${fmt(BUDGET.initialJsCeiling)}`,
);
if (initialJs > BUDGET.initialJsCeiling) failures.push('İlk yükleme JS tavanı aşıldı');
else if (initialJs > BUDGET.initialJsTarget) console.warn('  uyarı: hedef aşıldı (tavan altında)');

console.log(`Açılış fontları: ${fmt(initialFonts)}  sınır ${fmt(BUDGET.initialFonts)}`);
if (initialFonts > BUDGET.initialFonts) failures.push('Açılış font bütçesi aşıldı');
console.log(
  `Belge fontları (ilk A4'te): ${fmt(documentFonts)}  sınır ${fmt(BUDGET.documentFonts)}`,
);
if (documentFonts > BUDGET.documentFonts) failures.push('Belge font bütçesi aşıldı');
if (unbudgetedFonts.length > 0) {
  failures.push(`Bütçesi tanımlanmamış font dosyası: ${unbudgetedFonts.join(', ')}`);
}

// Generated data: `npm run build` runs build-data and build-geo before vite build, which copies
// public/ into dist/. The 110m fallback is not in dist/ yet (it is bundled into JS later), so it is
// measured at its source.
const ROOT = join(import.meta.dirname, '..');
const gzFile = (path: string) => {
  if (!existsSync(path)) {
    failures.push(`Yok: ${path}. Önce \`npm run build\` çalıştırın.`);
    return 0;
  }
  return gzipSync(readFileSync(path)).length;
};
const check = (label: string, size: number, limit: number) => {
  console.log(`${label}: ${fmt(size)}  sınır ${fmt(limit)}`);
  if (size > limit) failures.push(`${label} bütçesi aşıldı`);
};
check(
  'Gömülü yedek altlık, 110m (gzip)',
  gzFile(join(ROOT, 'src', 'map', 'generated', 'base-110m.json')),
  BUDGET.fallbackBase,
);
check(
  'İlk görünüm altlığı, 50m (gzip)',
  gzFile(join(DIST, 'geo', 'base-50m.topojson')),
  BUDGET.baseMap,
);
check(
  'Yakın zoom altlığı, 10m (gzip)',
  gzFile(join(DIST, 'geo', 'base-10m.topojson')),
  BUDGET.baseMap,
);
const docDir = join(DIST, 'data', 'documents');
const docFiles = existsSync(docDir) ? readdirSync(docDir) : [];
if (docFiles.length === 0) failures.push('dist/data/documents/ boş veya yok');
check(
  'Belge metinleri, toplam (gzip)',
  docFiles.reduce((sum, f) => sum + gzFile(join(docDir, f)), 0),
  BUDGET.documentsTotal,
);

if (failures.length > 0) {
  failures.forEach((f) => console.error(`HATA: ${f}`));
  process.exit(1);
}
console.log('check-size: bütçe içinde.');
