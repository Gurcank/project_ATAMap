// The A4 sheet (full text) and the citation card (no full text), SPEC §3.6, §4, §4.1.
// One dialog component: both share opening, closing, focus and position rules.
import { useEffect, useRef } from 'preact/hooks';
import { formatDate } from '../format/date.ts';
import { KIND_LABEL } from '../format/labels.ts';
import type { PublicSource } from '../state/data.ts';
import { documentsState, openDocument } from '../state/app.ts';
import {
  closeSheet,
  openedByHover,
  pointerEnteredSheet,
  pointerLeft,
  sheetAnchor,
} from '../state/sheet.ts';
import styles from './DocumentSheet.module.css';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DocumentSheet() {
  const doc = openDocument.value;
  const root = useRef<HTMLDivElement>(null);
  const hover = openedByHover.value;
  const anchor = sheetAnchor.value;
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

  useEffect(() => {
    if (anchor) root.current?.style.setProperty('--anchor-x', `${anchor.x}px`);
  }, [anchor, docId]);

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

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeSheet();
      return;
    }
    // A deliberately opened sheet keeps Tab inside it.
    if (e.key !== 'Tab' || hover || !root.current) return;
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
      {!hover && <div class={styles.backdrop} onClick={closeSheet} aria-hidden="true" />}
      <div
        ref={root}
        class={`${styles.sheet} ${hasText ? styles.a4 : styles.card} ${
          doc.kind === 'telgraf' ? styles.telegram : ''
        }`}
        role="dialog"
        aria-modal={!hover}
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onPointerEnter={pointerEnteredSheet}
        onPointerLeave={() => pointerLeft()}
      >
        <button type="button" class={styles.close} onClick={closeSheet}>
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
          {doc.sender}
          {doc.recipient && <span> → {doc.recipient}</span>}
        </p>

        {hasText ? (
          <div class={styles.body} tabIndex={0}>
            {doc.fullText?.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p class={styles.note}>Aslı Arap harfli; tam metin gösterilmiyor.</p>
        )}

        <footer class={styles.kunye}>
          {cited.map((s) => (
            <p key={s.citation}>
              {s.citation}
              {s.page && `, ${s.page}`}
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
