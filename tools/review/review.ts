// Side-by-side review of a diplomatic transcription against its scan (SPEC A22, ADR-08).
// Scans come from `node scripts/fetch-scan.ts <docId>` and live in research/ (never committed).
import '../../src/styles/tokens.css';
import '../../src/styles/fonts.css';
import '../../src/styles/global.css';
import './review.css';
import { diplomaticToText } from '../../scripts/lib/diplomatic.ts';

const references = import.meta.glob('/data/reference/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const metas = import.meta.glob('/data/reference/*.meta.json', {
  import: 'default',
  eager: true,
}) as Record<
  string,
  { citation?: string; url: string; uncertain?: string[]; reviewedBy: string | null }
>;

const ids = Object.keys(references).map((p) =>
  p.replace('/data/reference/', '').replace('.txt', ''),
);
const docId = new URLSearchParams(location.search).get('doc') ?? ids[0];
const source = docId ? references[`/data/reference/${docId}.txt`] : undefined;
const meta = docId ? metas[`/data/reference/${docId}.meta.json`] : undefined;

const el = (tag: string, cls?: string, text?: string) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

const docs = document.getElementById('docs')!;
for (const id of ids) {
  const link = el('a', id === docId ? 'is-current' : undefined, id) as HTMLAnchorElement;
  link.href = `?doc=${id}`;
  docs.append(link);
}

if (!source || !meta || !docId) {
  document.getElementById('sections')!.textContent = 'Belge bulunamadı.';
} else {
  document.getElementById('meta')!.textContent =
    `${docId} · ${meta.reviewedBy ? `onaylayan: ${meta.reviewedBy}` : 'onay bekliyor'} · ${meta.url}`;

  const uncertain = document.getElementById('uncertain')!;
  for (const item of meta.uncertain ?? []) uncertain.append(el('li', undefined, item));

  // Split the reference at "## s.<page> <sol|sağ>" markers; keep the original line numbers.
  const sections: { page: number; side: string; split: number; lines: [number, string][] }[] = [];
  source.split(/\r?\n/).forEach((line, i) => {
    const marker = line.match(/^## s\.(\d+) (sol|sağ)(?: ([0-9.]+))?/);
    if (marker)
      sections.push({
        page: Number(marker[1]),
        side: marker[2]!,
        split: marker[3] ? Number(marker[3]) : 0.5,
        lines: [],
      });
    else if (sections.length > 0 && !line.startsWith('#') && line.trim() !== '')
      sections[sections.length - 1]!.lines.push([i + 1, line]);
  });

  const host = document.getElementById('sections')!;
  for (const section of sections) {
    const block = el('section', 'pair');
    block.append(el('h2', 'pair__title', `Sayfa ${section.page}, ${section.side} sütun`));

    const scan = el('div', `pair__scan pair__scan--${section.side === 'sol' ? 'left' : 'right'}`);
    const img = el('img') as HTMLImageElement;
    img.src = `/research/scans/${docId}/p${section.page}.png`;
    img.alt = `Tarama, sayfa ${section.page}`;
    img.loading = 'lazy';
    // Show one printed column: the left box keeps [0, split + margin] of the page width, the right
    // box [split - margin, 1]. The margin keeps letters at the column edge from being cut.
    const margin = 0.03;
    const visible = section.side === 'sol' ? section.split + margin : 1 - (section.split - margin);
    img.style.setProperty('width', `${100 / visible}%`);
    img.style.setProperty(
      'margin-left',
      section.side === 'sol' ? '0' : `${-((section.split - margin) / visible) * 100}%`,
    );
    img.addEventListener('error', () => {
      scan.replaceChildren(
        el('p', 'pair__missing', `Tarama yok. Çalıştırın: node scripts/fetch-scan.ts ${docId}`),
      );
    });
    scan.append(img);

    const list = el('ol', 'pair__lines');
    for (const [number, line] of section.lines) {
      const item = el('li');
      item.dataset.line = String(number);
      const paragraph = line.startsWith('¶');
      if (paragraph) item.classList.add('is-paragraph');
      // Render {…} notes muted; they can span lines, so mark open/close fragments separately.
      const body = paragraph ? line.slice(1) : line;
      for (const part of body.split(/(\{[^}]*\}?|^[^{]*\})/)) {
        if (!part) continue;
        const isNote = part.startsWith('{') || part.endsWith('}');
        item.append(
          isNote
            ? el('span', 'mark-note', part.replace(/[{}]/g, ''))
            : document.createTextNode(part),
        );
      }
      list.append(item);
    }
    block.append(scan, list);
    host.append(block);
  }

  const final = document.getElementById('final')!;
  for (const paragraph of diplomaticToText(source).split('\n\n'))
    final.append(el('p', undefined, paragraph));
}
