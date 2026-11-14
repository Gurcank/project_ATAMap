// Künye line (SPEC §2.3). The citations below are FICTIONAL (KURGU).
import { describe, expect, it } from 'vitest';
import { citationText } from '../../src/format/citation.ts';

describe('citationText', () => {
  it('adds the page when the citation lacks it', () => {
    expect(citationText({ citation: 'KURGU Dergisi, 1920', page: '12' })).toBe(
      'KURGU Dergisi, 1920, s. 12',
    );
    expect(citationText({ citation: 'KURGU Tutanak', page: 's. 2-7' })).toBe(
      'KURGU Tutanak, s. 2-7',
    );
  });

  it('does not repeat a page the citation already names', () => {
    expect(citationText({ citation: 'KURGU Kitap, 1920, s. 111-112', page: '111-112' })).toBe(
      'KURGU Kitap, 1920, s. 111-112',
    );
    expect(citationText({ citation: 'KURGU Gazete, 30 Ekim 1933, s. 1', page: '1' })).toBe(
      'KURGU Gazete, 30 Ekim 1933, s. 1',
    );
  });

  it('leaves a citation without a page as it is', () => {
    expect(citationText({ citation: 'KURGU Kaynak' })).toBe('KURGU Kaynak');
  });
});
