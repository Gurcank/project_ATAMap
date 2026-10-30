import { useEffect, useState } from 'preact/hooks';
import { formatDate } from '../format/date.ts';
import {
  baseLoadFailed,
  currentEvent,
  documentsState,
  retryDocuments,
  sources,
} from '../state/app.ts';
import dock from './Dock.module.css';
import styles from './EventCartouche.module.css';

/** Below this length the whole text fits the 5-line mobile allowance, so no "Devamı" is offered. */
const LONG_TEXT = 140;

// Bottom-right: title, date, text and where it comes from (SPEC §3.5, §4). aria-live announces the
// new step to screen readers.
export function EventCartouche() {
  const event = currentEvent.value;
  const [expanded, setExpanded] = useState(false);
  // A new step starts collapsed again.
  useEffect(() => setExpanded(false), [event?.id]);
  if (!event) return <section class={`cartouche ${dock.event}`} />;

  const cited = event.sources
    .map((id) => sources.value[id])
    .filter((s): s is NonNullable<typeof s> => s !== undefined);
  const docs = documentsState.value;

  return (
    <section class={`cartouche ${dock.event} ${styles.event}`} aria-live="polite">
      <h2 class={`${dock.eventTitle} ${styles.title}`}>{event.title}</h2>
      <div class={dock.eventBody}>
        <p class={styles.date}>
          {formatDate(event.date)}
          {event.date.approximate && <span class={styles.badge}>yaklaşık</span>}
        </p>
        <p class={`${styles.text} ${expanded ? styles.expanded : ''}`}>{event.text}</p>
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
          <ul class={styles.sources}>
            {cited.map((s) => (
              <li key={s.citation} title={s.citation}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.citation}
                  </a>
                ) : (
                  s.citation
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
