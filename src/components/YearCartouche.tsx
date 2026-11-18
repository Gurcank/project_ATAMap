import { yearOf } from '../format/date.ts';
import { currentEvent } from '../state/app.ts';
import dock from './Dock.module.css';
import styles from './YearCartouche.module.css';

// Bottom-left year, printed on the map without a frame (2026-11-17). When the year changes the
// digits slide in (M6); the key remounts the element so the CSS animation restarts.
export function YearCartouche() {
  const event = currentEvent.value;
  const year = event ? yearOf(event.date) : null;
  return (
    <div class={`${dock.year} ${styles.year}`}>
      {year !== null && (
        <span class={styles.digits} key={year}>
          {year}
        </span>
      )}
      {event?.date.approximate && <span class={styles.badge}>yaklaşık</span>}
    </div>
  );
}
