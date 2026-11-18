import { useId, useLayoutEffect, useRef } from 'preact/hooks';
import { citationText } from '../format/citation.ts';
import { segment } from '../format/glossary.ts';
import { glossaryById, glossaryMatcher, openGlossaryKey, sources } from '../state/app.ts';
import styles from './GlossaryText.module.css';

/** Same hover timing as the document markers (SPEC §4.1). */
const OPEN_DELAY = 150;
const CLOSE_DELAY = 300;
/** Gap between the word and its card, and the card's distance from the screen edge. */
const GAP = 6;
const EDGE = 8;

/** The entry's first form with a Turkish capital: "redif" -> "Redif", "idadi" -> "İdadi". */
const headword = (term: string) => term.charAt(0).toLocaleUpperCase('tr') + term.slice(1);

interface TextProps {
  text: string;
  /** Shared by all texts of one panel, so a word is marked only where it first appears. */
  seen: Set<string>;
}

// Text with its old words marked (2026-11-17). The text itself is never changed: each word is
// wrapped as it is, and its explanation lives in a card outside the text (SPEC §2.1 exception).
export function GlossaryText({ text, seen }: TextProps) {
  const parts = segment(text, glossaryMatcher.value, seen);
  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <GlossaryTerm key={i} word={part.text} entryId={part.entryId} />
        ),
      )}
    </>
  );
}

// One marked word and its card, like a link preview: hovering opens it after a short pause and
// the pointer may move into it; a tap or Enter toggles it; Esc or a tap outside closes it and
// focus returns to the word. The card follows the word in the DOM, so Tab reaches its links.
function GlossaryTerm({ word, entryId }: { word: string; entryId: string }) {
  const key = useId();
  const cardId = `sozluk-${key}`;
  const button = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const open = openGlossaryKey.value === key;
  const entry = glossaryById.value.get(entryId);

  const later = (fn: () => void, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  const show = () => {
    openGlossaryKey.value = key;
  };
  const hide = () => {
    if (openGlossaryKey.peek() === key) openGlossaryKey.value = null;
  };

  // Place the card under the word (above it when there is no room), inside the screen.
  useLayoutEffect(() => {
    const el = card.current;
    const anchor = button.current;
    if (!open || !el || !anchor) return;
    const word = anchor.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const x = Math.min(Math.max(EDGE, word.left), window.innerWidth - box.width - EDGE);
    const below = word.bottom + GAP;
    const y = below + box.height <= window.innerHeight - EDGE ? below : word.top - GAP - box.height;
    el.style.setProperty('--x', `${Math.round(x)}px`);
    el.style.setProperty('--y', `${Math.round(Math.max(EDGE, y))}px`);
  }, [open]);

  // Esc closes the card before anything else gets it (capture phase), so an open reading panel
  // or status card stays open.
  useLayoutEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      hide();
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!button.current?.contains(target) && !card.current?.contains(target)) hide();
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  useLayoutEffect(() => () => clearTimeout(timer.current), []);

  if (!entry) return <>{word}</>;
  const cited = entry.sources.flatMap((id) => {
    const s = sources.value[id];
    return s ? [s] : [];
  });

  const mouse = (e: PointerEvent) => e.pointerType === 'mouse';
  return (
    <>
      <button
        type="button"
        ref={button}
        class={styles.term}
        aria-expanded={open}
        aria-controls={cardId}
        onClick={() => (open ? hide() : show())}
        onPointerEnter={(e) => mouse(e) && later(show, OPEN_DELAY)}
        onPointerLeave={(e) => mouse(e) && later(hide, CLOSE_DELAY)}
      >
        {word}
      </button>
      {open && (
        <span
          id={cardId}
          ref={card}
          class={styles.card}
          role="note"
          onPointerEnter={() => clearTimeout(timer.current)}
          onPointerLeave={(e) => mouse(e) && later(hide, CLOSE_DELAY)}
        >
          <span class={styles.head}>{headword(entry.terms[0] ?? word)}</span>
          <span class={styles.meaning}>{entry.meaning}</span>
          {entry.today && (
            <span class={styles.today}>
              <span class={styles.todayLabel}>Bugün: </span>
              {entry.today}
            </span>
          )}
          {cited.length > 0 && (
            <span class={styles.sources}>
              {cited.map((s) => (
                <span key={s.citation} class={styles.source}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {citationText(s)}
                    </a>
                  ) : (
                    citationText(s)
                  )}
                </span>
              ))}
            </span>
          )}
        </span>
      )}
    </>
  );
}
