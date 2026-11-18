// Glossary matching (2026-11-17): finds the old words of the glossary in a text so they can be
// explained on hover. Pure, no DOM; covered by tests/unit/glossary.test.ts.
//   - A term matches at the start of a word, in Turkish lower case ("Redif" = "redif").
//   - The rest of the word is taken with it, so inflected forms match: "redifi", "Rüştiyesi",
//     "Harbiye'ye" (a suffix after an apostrophe counts as part of the word).
//   - Longer terms are tried first: "Meclis-i Mebusan" before "mebus".
//   - Text that starts with one of the entry's `exclude` phrases is not that term.
//   - Each entry is marked once per `seen` set: a panel passes one set for all its texts.

export interface GlossaryTerm {
  id: string;
  terms: string[];
  exclude?: string[];
  meaning: string;
  today?: string;
  sources: string[];
}

export type Segment = string | { text: string; entryId: string };

interface Form {
  form: string;
  entryId: string;
  exclude: string[];
}

export type Matcher = Form[];

const lower = (s: string) => s.toLocaleLowerCase('tr');
const LETTER = /\p{L}/u;
const APOSTROPHE = /['’]/;

export function buildMatcher(entries: readonly GlossaryTerm[]): Matcher {
  return entries
    .flatMap((e) =>
      e.terms.map((t) => ({
        form: lower(t),
        entryId: e.id,
        exclude: (e.exclude ?? []).map(lower),
      })),
    )
    .sort((a, b) => b.form.length - a.form.length);
}

/** End of the word that starts at `from`, suffixes after an apostrophe included. */
function wordEnd(text: string, from: number): number {
  let i = from;
  for (;;) {
    while (i < text.length && LETTER.test(text[i]!)) i++;
    if (i + 1 < text.length && APOSTROPHE.test(text[i]!) && LETTER.test(text[i + 1]!)) {
      i++;
      continue;
    }
    return i;
  }
}

export function segment(text: string, matcher: Matcher, seen: Set<string>): Segment[] {
  const low = lower(text);
  // Turkish lower case keeps the length of Turkish text; if a rare letter changed it, positions in
  // the two strings would drift, so the text is left unmarked.
  if (matcher.length === 0 || low.length !== text.length) return [text];
  const out: Segment[] = [];
  let plain = 0;
  let i = 0;
  while (i < text.length) {
    const atWordStart = LETTER.test(text[i]!) && (i === 0 || !LETTER.test(text[i - 1]!));
    const hit = atWordStart
      ? matcher.find((f) => {
          if (!low.startsWith(f.form, i)) return false;
          return !f.exclude.some((x) => low.startsWith(x, i));
        })
      : undefined;
    if (!hit) {
      i++;
      continue;
    }
    const end = wordEnd(text, i + hit.form.length);
    if (!seen.has(hit.entryId)) {
      seen.add(hit.entryId);
      if (i > plain) out.push(text.slice(plain, i));
      out.push({ text: text.slice(i, end), entryId: hit.entryId });
      plain = end;
    }
    i = end;
  }
  if (plain < text.length) out.push(text.slice(plain));
  return out;
}
