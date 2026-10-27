// Fails when a raw colour value appears in src/ outside src/styles/tokens.css (SPEC §3.2, ADR-11).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const ALLOWED = join('src', 'styles', 'tokens.css');
const EXTENSIONS = ['.css', '.ts', '.tsx', '.svg'];

const PATTERNS: [string, RegExp][] = [
  ['hex', /(?<![\w&/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g],
  ['rgb/hsl', /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g],
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return EXTENSIONS.some((ext) => name.endsWith(ext)) ? [path] : [];
  });
}

const violations: string[] = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (rel === ALLOWED) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const [label, re] of PATTERNS) {
        for (const match of line.matchAll(re)) {
          violations.push(`${rel.split(sep).join('/')}:${i + 1}  ${label}  ${match[0]}`);
        }
      }
    });
}

if (violations.length > 0) {
  console.error(`Ham renk değeri bulundu (yalnız ${ALLOWED} içinde olabilir):`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log('check-tokens: ham renk değeri yok.');
