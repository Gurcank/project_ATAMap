// Shared `--data <dir>` / `--out <dir>` handling for the build scripts, so a test can build a
// fictional dataset (tests/fixtures/e2e) without touching data/ or public/.
import { join, resolve } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

export const paths = {
  root: ROOT,
  /** Where data/*.json, data/reference and data/borders live. */
  data: resolve(flag('data') ?? join(ROOT, 'data')),
  /** Parent of data/ and geo/ in the output: public/ by default. */
  out: resolve(flag('out') ?? join(ROOT, 'public')),
};
