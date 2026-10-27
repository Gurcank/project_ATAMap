// ADR-08 / SPEC §6 rule 7: every fullText must equal the text derived from its reference file,
// and the reference file must match the sha256 recorded when it was captured.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { diplomaticToText } from '../../scripts/lib/diplomatic.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

interface DocumentLike {
  id: string;
  originalScript: string;
  fullText?: string;
}

const { documents } = JSON.parse(read('data/documents.json')) as { documents: DocumentLike[] };
const withText = documents.filter((d) => d.fullText !== undefined);

describe.each(withText.map((d) => [d.id, d] as const))('%s', (id, doc) => {
  const refPath = `data/reference/${id}.txt`;
  const metaPath = `data/reference/${id}.meta.json`;

  it('has a reference file and its meta data', () => {
    expect(existsSync(join(ROOT, refPath))).toBe(true);
    expect(existsSync(join(ROOT, metaPath))).toBe(true);
  });

  it('is Latin-script in the original (SPEC §2.1)', () => {
    expect(doc.originalScript).toBe('latin');
  });

  it('reference file is unchanged since capture (sha256)', () => {
    const meta = JSON.parse(read(metaPath)) as { sha256: string };
    // Hash with LF line endings so a CRLF checkout cannot change the result.
    const actual = createHash('sha256')
      .update(read(refPath).replace(/\r\n/g, '\n'), 'utf8')
      .digest('hex');
    expect(actual).toBe(meta.sha256);
  });

  it('fullText equals the text derived from the reference', () => {
    expect(doc.fullText).toBe(diplomaticToText(read(refPath)));
  });
});
