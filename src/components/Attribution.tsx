import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { openDocumentId } from '../state/app.ts';
import styles from './Attribution.module.css';

const PANEL_ID = 'kaynakca';

// Bottom-right credit line, as on a web map: the site name and a "Kaynakça" disclosure that opens
// the full credits upwards (2026-11-17). Licences and sources that ask for credit (SOURCES §3, §5,
// §2.6), plus the main official sources as a courtesy. Natural Earth is public domain and asks for
// nothing. CShapes (CC BY-NC-SA 4.0) draws the period borders and asks for credit, the licence link
// and the non-commercial terms (public/geo/borders/LICENSE.txt). Vikipedi (CC BY-SA 4.0) asks for
// credit and a licence link even though only facts are taken. MSB and Atatürk Araştırma Merkezi are
// official sources used for facts only (K5). Wikidata (CC0) asks for nothing; OpenStreetMap (ODbL)
// asks for credit. The paper and wood photos are CC0 (SOURCES §5.1) and are named as a courtesy.
// Public-domain books cited on single steps stay in those steps' citations only.
export function Attribution() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || openDocumentId.value !== null) return;
      setOpen(false);
      toggle.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (e.target instanceof Node && !root.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div class={styles.strip} ref={root}>
      <p id={PANEL_ID} class={`cartouche ${styles.panel}`} hidden={!open}>
        Altlık: Natural Earth. Sınırlar: CShapes 2.0, ETH Zürich (
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.tr" rel="license noopener">
          CC BY-NC-SA 4.0
        </a>
        ). Olaylar: T.C. Millî Savunma Bakanlığı Atatürk Sitesi, Atatürk Araştırma Merkezi; Vikipedi
        (
        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.tr" rel="license noopener">
          CC BY-SA 4.0
        </a>
        ). Konumlar: Wikidata (CC0),{' '}
        <a href="https://www.openstreetmap.org/copyright" rel="license noopener">
          © OpenStreetMap katkıcıları
        </a>{' '}
        (ODbL). Metinler: T.B.M.M. Zabıt Cerideleri. Telgraf ve mektup künyeleri: Nutuk, 1929
        İngilizce baskı. Kâğıt ve ahşap dokuları: ambientCG, Poly Haven (CC0).
      </p>
      <span class={styles.name}>ATAMap</span>
      <button
        type="button"
        class={styles.toggle}
        ref={toggle}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen(!open)}
      >
        Kaynakça
      </button>
    </div>
  );
}
