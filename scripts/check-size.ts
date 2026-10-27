// Size budget gate over dist/ (ARCHITECTURE §5, ADR-14). Run after `vite build`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = join(import.meta.dirname, '..', 'dist');
const KB = 1024;

const BUDGET = {
  initialJsTarget: 120 * KB,
  initialJsCeiling: 300 * KB,
  // Faces needed before any document opens: Old Standard TT + Alegreya Sans (ADR-12).
  initialFonts: 250 * KB,
};

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
const initialFonts = woff2
  .filter((f) => f.startsWith('old-standard-tt') || f.startsWith('alegreya-sans'))
  .reduce((sum, f) => sum + fontSize(f), 0);
const allFonts = woff2.reduce((sum, f) => sum + fontSize(f), 0);

const failures: string[] = [];
console.log(
  `İlk yükleme JS (gzip): ${fmt(initialJs)}  hedef ${fmt(BUDGET.initialJsTarget)}, tavan ${fmt(BUDGET.initialJsCeiling)}`,
);
if (initialJs > BUDGET.initialJsCeiling) failures.push('İlk yükleme JS tavanı aşıldı');
else if (initialJs > BUDGET.initialJsTarget) console.warn('  uyarı: hedef aşıldı (tavan altında)');

console.log(`İlk yükleme fontları: ${fmt(initialFonts)}  sınır ${fmt(BUDGET.initialFonts)}`);
if (initialFonts > BUDGET.initialFonts) failures.push('İlk yükleme font bütçesi aşıldı');
console.log(`Tüm fontlar (belge fontları tembel): ${fmt(allFonts)}  (${woff2.length} dosya)`);

if (failures.length > 0) {
  failures.forEach((f) => console.error(`HATA: ${f}`));
  process.exit(1);
}
console.log('check-size: bütçe içinde.');
