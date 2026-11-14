// The künye line of a source: citation plus page (SPEC §2.3: "kurum, yayın, cilt/sayfa").
// Some citations already carry their page ("…, s. 111-112"); the page is added only when missing.
import type { PublicSource } from '../state/data.ts';

export function citationText(s: Pick<PublicSource, 'citation' | 'page'>): string {
  if (!s.page) return s.citation;
  const page = /^\d/.test(s.page) ? `s. ${s.page}` : s.page;
  return s.citation.includes(page) ? s.citation : `${s.citation}, ${page}`;
}
