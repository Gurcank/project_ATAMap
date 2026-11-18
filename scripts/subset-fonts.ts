// Cuts IM Fell English down to the ten digits the year indicator uses (2026-11-17, SPEC A36): the
// full latin file is ~60 KB, the digits alone a few KB, which keeps the opening fonts in budget now
// that Courier Prime loads at once for the field-file panels. Output is committed; rerun after a
// font package update: `npm run build:fonts`.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import subsetFont from 'subset-font';

const ROOT = join(import.meta.dirname, '..');
const SOURCE = join(
  ROOT,
  'node_modules/@fontsource/im-fell-english/files/im-fell-english-latin-400-normal.woff2',
);
const OUT = join(ROOT, 'src/assets/fonts/im-fell-english-digits.woff2');

const subset = await subsetFont(readFileSync(SOURCE), '0123456789', { targetFormat: 'woff2' });
writeFileSync(OUT, subset);
console.log(`subset-fonts: ${OUT} (${(subset.length / 1024).toFixed(1)} KB)`);
