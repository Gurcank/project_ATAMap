// The A4 sheet (full text) and the citation card (no full text), SPEC §3.6, §4, §4.1, A29.
// One dialog component: both share opening, closing, focus and position rules.
//   < 48rem   modal: full screen (A4) or a bottom card, over a backdrop; Tab stays inside.
//   >= 48rem  a reading panel on the right edge, not modal: the map stays visible and usable beside
//             it so the transmission line can be read with the document. Esc or Kapat closes it.
import { useEffect, useRef, useState } from 'preact/hooks';
import { citationText } from '../format/citation.ts';
import { formatDate } from '../format/date.ts';
import { KIND_LABEL } from '../format/labels.ts';
import type { PublicSource } from '../state/data.ts';
import { documentsState, openDocument } from '../state/app.ts';
import { closeSheet, openedByHover, pointerEnteredSheet, pointerLeft } from '../state/sheet.ts';
import styles from './DocumentSheet.module.css';
import { GlossaryText } from './GlossaryText.tsx';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Same breakpoint as the CSS module (48rem): the panel is modal only below it.
const WIDE = '(min-width: 48rem)';

function useWide(): boolean {
  const [wide, setWide] = useState(() => matchMedia(WIDE).matches);
  useEffect(() => {
    const query = matchMedia(WIDE);
    const onChange = () => setWide(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return wide;
}

export function DocumentSheet() {
  const doc = openDocument.value;
  const root = useRef<HTMLDivElement>(null);
  const hover = openedByHover.value;
  const wide = useWide();
  const modal = !hover && !wide;
  const docId = doc?.id;

  // Focus moves in for a deliberate opening (click, touch, Enter) and returns to the marker on
  // close. A hover opening never takes focus.
  useEffect(() => {
    if (!docId || hover) return;
    root.current?.focus();
    return () => {
      document.querySelector<SVGElement>(`[data-marker-id="${docId}"]`)?.focus();
    };
  }, [docId, hover]);

  // 768 and up: the panel ends above the step controls so they stay whole and usable beside it.
  // The controls move when the dock changes height (event text) or the window resizes.
  useEffect(() => {
    const node = root.current;
    const floor = document.querySelector('[data-reading-floor]');
    const dockEl = document.querySelector('[data-map-edge="bottom"]');
    if (!docId || !wide || !node || !floor) return;
    const place = () =>
      node.style.setProperty(
        '--panel-floor',
        `${Math.max(0, window.innerHeight - floor.getBoundingClientRect().top)}px`,
      );
    place();
    const observer = new ResizeObserver(place);
    if (dockEl) observer.observe(dockEl);
    window.addEventListener('resize', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [docId, wide]);

  if (!doc || documentsState.value.status !== 'ready') return null;
  const { sources } = documentsState.value;
  const cited = doc.sources
    .map((id) => sources[id])
    .filter((s): s is PublicSource => s !== undefined);
  const hasText = doc.fullText !== undefined;
  // The printed date is worth showing when it is not already the Gregorian year (a Rumi date).
  const showOriginal =
    doc.date.original !== undefined && !doc.date.original.includes(doc.date.iso.slice(0, 4));
  const titleId = `sheet-title-${doc.id}`;
  // One marked word per entry in the whole sheet. The full text is shown character for character;
  // only the rendering wraps words (SPEC §2.1 exception, 2026-11-17).
  const seen = new Set<string>();

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeSheet();
      return;
    }
    // A modal sheet keeps Tab inside it.
    if (e.key !== 'Tab' || !modal || !root.current) return;
    const items = [...root.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      {modal && <div class={styles.backdrop} onClick={closeSheet} aria-hidden="true" />}
      <div
        ref={root}
        class={`paper-clip ${styles.sheet} ${hasText ? styles.a4 : styles.card} ${
          doc.kind === 'telgraf' ? styles.telegram : ''
        }`}
        role="dialog"
        aria-modal={modal}
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onPointerEnter={pointerEnteredSheet}
        onPointerLeave={() => pointerLeft()}
      >
        <button type="button" class={`board-button ${styles.close}`} onClick={closeSheet}>
          Kapat
        </button>
        {doc.attributionDisputed && <p class={styles.badge}>Atfı tartışmalı</p>}
        <h2 class={styles.title} id={titleId}>
          {KIND_LABEL[doc.kind]}
        </h2>
        <p class={styles.meta}>
          {formatDate(doc.date)}
          {showOriginal && <span> (belgede: {doc.date.original})</span>}
          <br />
          <GlossaryText text={doc.sender} seen={seen} />
          {doc.recipient && (
            <span>
              {' → '}
              <GlossaryText text={doc.recipient} seen={seen} />
            </span>
          )}
        </p>

        {hasText ? (
          <div class={styles.body} tabIndex={0}>
            {doc.fullText?.split('\n\n').map((paragraph, i) => (
              <p key={i}>
                <GlossaryText text={paragraph} seen={seen} />
              </p>
            ))}
          </div>
        ) : (
          <p class={styles.note}>Aslı Arap harfli; tam metin gösterilmiyor.</p>
        )}

        <footer class={styles.kunye}>
          {cited.map((s) => (
            <p key={s.citation}>
              {citationText(s)}
              {s.url && (
                <>
                  {' '}
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    Kaynak
                  </a>
                </>
              )}
            </p>
          ))}
          {hasText && doc.kind === 'konusma' && <p>Stenograf notları çıkarıldı.</p>}
        </footer>
      </div>
    </>
  );
}
