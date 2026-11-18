import { useEffect, useState } from 'preact/hooks';
import { citationText } from '../format/citation.ts';
import { formatDate } from '../format/date.ts';
import {
  baseLoadFailed,
  currentEvent,
  documentsState,
  retryDocuments,
  sources,
} from '../state/app.ts';
import dock from './Dock.module.css';
import { GlossaryText } from './GlossaryText.tsx';
import styles from './EventCartouche.module.css';

/** Below this length the whole text fits the 5-line mobile allowance, so no "Devamı" is offered. */
const LONG_TEXT = 140;
const SOURCES_ID = 'olay-kaynakca';

// Bottom-right: title, date, text and where it comes from (SPEC §3.5, §4). aria-live announces the
// new step to screen readers. The sources sit behind a "Kaynakça" disclosure (2026-11-17); their
// links open in a new tab.
export function EventCartouche() {
  const event = currentEvent.value;
  const [expanded, setExpanded] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  // A new step starts collapsed again.
  useEffect(() => {
    setExpanded(false);
    setSourcesOpen(false);
  }, [event?.id]);
  if (!event) return <section class={`cartouche ${dock.event}`} />;

  const cited = event.sources
    .map((id) => sources.value[id])
    .filter((s): s is NonNullable<typeof s> => s !== undefined);
  const docs = documentsState.value;
  const seen = new Set<string>(); // one marked word per entry in this card

  return (
    <section class={`cartouche drawing-pin ${dock.event} ${styles.event}`} aria-live="polite">
      <h2 class={`${dock.eventTitle} ${styles.title}`}>
        <GlossaryText text={event.title} seen={seen} />
      </h2>
      <div class={dock.eventBody}>
        <p class={`typed ${styles.date}`}>
          {formatDate(event.date)}
          {event.date.approximate && <span class={styles.badge}>yaklaşık</span>}
        </p>
        <p class={`${styles.text} ${expanded ? styles.expanded : ''}`}>
          <GlossaryText text={event.text} seen={seen} />
        </p>
        {event.text.length > LONG_TEXT && (
          <button
            type="button"
            class={styles.more}
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Daralt' : 'Devamı'}
          </button>
        )}
        {cited.length > 0 && (
          <button
            type="button"
            class={`typed ${styles.sourcesToggle}`}
            aria-expanded={sourcesOpen}
            aria-controls={SOURCES_ID}
            onClick={() => setSourcesOpen(!sourcesOpen)}
          >
            Kaynakça ({cited.length})
            <span class={styles.chevron} aria-hidden="true" />
          </button>
        )}
        {cited.length > 0 && (
          <ul id={SOURCES_ID} class={styles.sources} hidden={!sourcesOpen}>
            {cited.map((s) => (
              <li key={s.citation} title={citationText(s)}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {citationText(s)}
                  </a>
                ) : (
                  citationText(s)
                )}
              </li>
            ))}
          </ul>
        )}
        {docs.status === 'error' && (
          <p class={styles.note} role="alert">
            Kayıtlar yüklenemedi.{' '}
            <button type="button" class={styles.more} onClick={() => retryDocuments.value++}>
              Yeniden dene
            </button>
          </p>
        )}
        {baseLoadFailed.value && <p class={styles.note}>Harita altlığı yüklenemedi.</p>}
      </div>
    </section>
  );
}
