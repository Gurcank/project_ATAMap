import {
  autoplay,
  canGoNext,
  canGoPrev,
  currentIndex,
  goNext,
  goPrev,
  speed,
  steps,
  toggleAutoplay,
  toggleSpeed,
} from '../state/app.ts';
import dock from './Dock.module.css';
import styles from './StepControls.module.css';
import { Timeline } from './Timeline.tsx';

/** What each speed means, for the tooltip. */
const SPEED_TITLE = { 1: 'Normal hız', 2: 'İki kat hızlı', 4: 'Dört kat hızlı' } as const;

/** Icons drawn on a 20-unit grid, in ink; one path each. */
const ICON = {
  prev: 'M5 4h2v12H5zM16 4v12L8 10z',
  next: 'M13 4h2v12h-2zM4 4v12l8-6z',
  play: 'M6 3.5v13L16.5 10z',
  pause: 'M5 4h3.5v12H5zM11.5 4H15v12h-3.5z',
};

function Icon({ d }: { d: string }) {
  return (
    <svg class={styles.icon} viewBox="0 0 20 20" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// Bottom-centre (2026-11-17): cardboard buttons for previous / play-pause / next and the speed,
// then the chronology line. The buttons keep their Turkish names for assistive technology; the
// play button is a toggle (aria-pressed). Arrow keys and Space are bound in App.
export function StepControls() {
  const playing = autoplay.value;
  const position =
    currentIndex.value >= 0 ? `${currentIndex.value + 1} / ${steps.value.length}` : '';
  return (
    <div
      class={`cartouche ${dock.controls} ${styles.controls}`}
      role="group"
      aria-label="Adım kontrolleri"
      data-reading-floor
    >
      <div class={styles.buttons}>
        <button
          type="button"
          class={`board-button ${styles.button}`}
          aria-label="Önceki"
          title="Önceki adım"
          disabled={!canGoPrev.value}
          onClick={goPrev}
        >
          <Icon d={ICON.prev} />
        </button>
        <button
          type="button"
          class={`board-button ${styles.button} ${styles.play}`}
          aria-label="Otomatik"
          aria-pressed={playing}
          title={playing ? 'Duraklat' : 'Otomatik oynat'}
          onClick={toggleAutoplay}
        >
          <Icon d={playing ? ICON.pause : ICON.play} />
        </button>
        <button
          type="button"
          class={`board-button ${styles.button}`}
          aria-label="Sonraki"
          title="Sonraki adım"
          disabled={!canGoNext.value}
          onClick={goNext}
        >
          <Icon d={ICON.next} />
        </button>
        <button
          type="button"
          class={`board-button ${styles.button} ${styles.speed}`}
          aria-label={`Hız: ${speed.value}×`}
          title={SPEED_TITLE[speed.value]}
          data-fast={speed.value > 1 || undefined}
          onClick={toggleSpeed}
        >
          {speed.value}×
        </button>
      </div>
      <Timeline />
      <span class={styles.position} aria-hidden="true">
        {position}
      </span>
    </div>
  );
}
