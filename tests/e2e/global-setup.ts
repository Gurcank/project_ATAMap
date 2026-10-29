// Builds the fictional dataset (tests/fixtures/e2e) into tests/fixtures/.generated with the real
// build scripts, so the fixture specs exercise the same schema, rules and output shape as the site.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

export default function globalSetup() {
  const root = join(import.meta.dirname, '..', '..');
  const args = ['--data', 'tests/fixtures/e2e', '--out', 'tests/fixtures/.generated'];
  for (const script of ['build-data.ts', 'build-borders.ts']) {
    execFileSync(process.execPath, [join('scripts', script), ...args], {
      cwd: root,
      stdio: 'inherit',
    });
  }
}
