// T5 (ARCHITECTURE §8): renders the Turkish sample in every shipped face and reports which
// font files the browser actually loaded. Results are exposed on window.__fontReport.
import '../../src/styles/tokens.css';
import '../../src/styles/fonts.css';
import '../../src/styles/global.css';
import './fonts.css';

const SAMPLE = 'ğĞıİşŞçÇöÖüÜ — Selanik, Dersaadet, Manastır; Ağustos 1919';

const FACES = [
  { family: 'Old Standard TT', style: 'normal', weight: 400 },
  { family: 'Old Standard TT', style: 'italic', weight: 400 },
  { family: 'Alegreya Sans', style: 'normal', weight: 400 },
  { family: 'Alegreya Sans', style: 'normal', weight: 700 },
  { family: 'EB Garamond', style: 'normal', weight: 400 },
  { family: 'EB Garamond', style: 'italic', weight: 400 },
  { family: 'Courier Prime', style: 'normal', weight: 400 },
] as const;

const rows = document.getElementById('rows')!;
for (const face of FACES) {
  const row = document.createElement('section');
  row.className = 'specimen__row';
  const label = document.createElement('p');
  label.className = 'specimen__label';
  label.textContent = `${face.family} ${face.weight}${face.style === 'italic' ? ' italik' : ''}`;
  const text = document.createElement('p');
  text.className = 'specimen__text';
  text.textContent = SAMPLE;
  text.style.setProperty('font-family', `'${face.family}', monospace`);
  text.style.setProperty('font-style', face.style);
  text.style.setProperty('font-weight', String(face.weight));
  row.append(label, text);
  rows.append(row);
}

async function report() {
  await document.fonts.ready;
  const checks = await Promise.all(
    FACES.map(async (face) => {
      const spec = `${face.style} ${face.weight} 20px '${face.family}'`;
      const loaded = await document.fonts.load(spec, SAMPLE);
      return {
        face: `${face.family} ${face.weight} ${face.style}`,
        // check() is true only when every glyph in SAMPLE is covered by loaded faces of this family.
        allGlyphsCovered: document.fonts.check(spec, SAMPLE),
        faces: loaded.length,
      };
    }),
  );
  const files = performance
    .getEntriesByType('resource')
    .map((e) => e.name.split('/').pop() ?? '')
    .filter((n) => n.includes('.woff2'));
  (window as unknown as { __fontReport: unknown }).__fontReport = { checks, files };
}

void report();
