import {
  autoplay,
  canGoNext,
  canGoPrev,
  currentIndex,
  goNext,
  goPrev,
  mode,
  modeHasSteps,
  setMode,
  steps,
  toggleAutoplay,
} from '../state/app.ts';
import type { StepMode } from '../timeline/steps.ts';
import dock from './Dock.module.css';
import styles from './StepControls.module.css';

const MODES: { value: StepMode; label: string }[] = [
  { value: 'olay', label: 'Olay' },
  { value: 'seyahat', label: 'Seyahat' },
  { value: 'yil', label: 'Yıl' },
];

// Bottom-centre: previous / next, the step unit and autoplay (SPEC §4). Labels are at most three
// words. Arrow keys and Space are bound in App.
export function StepControls() {
  const position =
    currentIndex.value >= 0 ? `${currentIndex.value + 1} / ${steps.value.length}` : '';
  return (
    <div
      class={`cartouche ${dock.controls} ${styles.controls}`}
      role="group"
      aria-label="Adım kontrolleri"
    >
      <button type="button" class={styles.button} disabled={!canGoPrev.value} onClick={goPrev}>
        Önceki
      </button>
      <button type="button" class={styles.button} disabled={!canGoNext.value} onClick={goNext}>
        Sonraki
      </button>
      <label class={styles.mode}>
        <span class="visually-hidden">Adım birimi</span>
        <select
          class={styles.select}
          value={mode.value}
          onChange={(e) => setMode(e.currentTarget.value as StepMode)}
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value} disabled={!modeHasSteps.value[m.value]}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        class={`${styles.button} ${autoplay.value ? styles.on : ''}`}
        aria-pressed={autoplay.value}
        onClick={toggleAutoplay}
      >
        Otomatik
      </button>
      <span class={styles.position} aria-hidden="true">
        {position}
      </span>
    </div>
  );
}
