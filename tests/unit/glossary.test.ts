import { describe, expect, it } from 'vitest';
import { buildMatcher, segment, type GlossaryTerm } from '../../src/format/glossary.ts';

// Fictional entries: only the matching is under test, the meanings are placeholders.
const entry = (id: string, terms: string[], exclude?: string[]): GlossaryTerm => ({
  id,
  terms,
  ...(exclude ? { exclude } : {}),
  meaning: 'kurgu',
  sources: [],
});
const matcher = buildMatcher([
  entry('redif', ['redif']),
  entry('mebus', ['mebus'], ['mebusan']),
  entry('meclis-i-mebusan', ['Meclis-i Mebusan']),
  entry('harbiye', ['Harbiye']),
]);
const run = (text: string) => segment(text, matcher, new Set());

describe('segment', () => {
  it('matches at a word start, in Turkish lower case, with suffixes', () => {
    expect(run('Redif taburu')).toEqual([{ text: 'Redif', entryId: 'redif' }, ' taburu']);
    expect(run('tümen redifi')).toEqual(['tümen ', { text: 'redifi', entryId: 'redif' }]);
  });
  it('takes a suffix after an apostrophe with the word', () => {
    expect(run("Harbiye'ye girdi")).toEqual([{ text: "Harbiye'ye", entryId: 'harbiye' }, ' girdi']);
  });
  it('does not match inside a word', () => {
    expect(run('kredif')).toEqual(['kredif']);
  });
  it('tries the longest term first', () => {
    expect(run("Meclis-i Mebusan'a girdi")).toEqual([
      { text: "Meclis-i Mebusan'a", entryId: 'meclis-i-mebusan' },
      ' girdi',
    ]);
  });
  it('skips a word the entry excludes', () => {
    expect(run('Mebusan Meclisi; Ankara mebusu')).toEqual([
      'Mebusan Meclisi; Ankara ',
      { text: 'mebusu', entryId: 'mebus' },
    ]);
  });
  it('marks each entry once per seen set', () => {
    const seen = new Set<string>();
    expect(segment('redif ve redif', matcher, seen)).toEqual([
      { text: 'redif', entryId: 'redif' },
      ' ve redif',
    ]);
    expect(segment('yine redif', matcher, seen)).toEqual(['yine redif']);
  });
  it('leaves text without terms whole', () => {
    expect(run('Selanik')).toEqual(['Selanik']);
    expect(segment('redif', [], new Set())).toEqual(['redif']);
  });
});
