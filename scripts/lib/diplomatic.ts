/**
 * Turns a line-by-line ("diplomatic") transcription of a scanned page into the reading text
 * shown on the A4 sheet. SPEC A20/A21, ARCHITECTURE ADR-08.
 *
 * Reference file format (data/reference/<docId>.txt):
 *   # ...            comment line (ignored)
 *   ## s.3 sol       page / column marker (ignored, used by the review page)
 *   ¶text            first line of a new paragraph (indented in print)
 *   text             continuation line, exactly as printed
 *   {( Alkışlar )}   stenographer's note, may span lines; removed (A20)
 *
 * Transform, in this order and nothing else:
 *   1. line-end hyphenation is joined: "ede-" / "ceklerdir" → "edeceklerdir"; a space before the
 *      hyphen ("ideali -") is a typesetting artefact and is dropped too (A21);
 *   2. other line breaks inside a paragraph become one space;
 *   3. {…} notes are removed (A20);
 *   4. whitespace is collapsed, and spaces before , . ; : ) and after ( are removed (typesetting).
 * Spelling, wording, case and punctuation marks are never changed.
 */
export function diplomaticToText(source: string): string {
  const paragraphs: string[][] = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line.trim() === '' || line.startsWith('#')) continue;
    if (line.startsWith('¶')) paragraphs.push([line.slice(1).trim()]);
    else if (paragraphs.length === 0) paragraphs.push([line.trim()]);
    else paragraphs[paragraphs.length - 1]!.push(line.trim());
  }

  return paragraphs
    .map((lines) => {
      let text = '';
      for (const line of lines) {
        if (text === '') text = line;
        else if (/\s?-$/.test(text)) text = text.replace(/\s?-$/, '') + line;
        else text += ' ' + line;
      }
      return text
        .replace(/\{[^}]*\}/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.;:)])/g, '$1')
        .replace(/\(\s+/g, '(')
        .trim();
    })
    .filter((p) => p !== '')
    .join('\n\n');
}
