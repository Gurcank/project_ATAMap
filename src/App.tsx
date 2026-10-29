import { useEffect } from 'preact/hooks';
import { Attribution } from './components/Attribution.tsx';
import { DocumentSheet } from './components/DocumentSheet.tsx';
import dock from './components/Dock.module.css';
import { EventCartouche } from './components/EventCartouche.tsx';
import { LoadingShell } from './components/LoadingShell.tsx';
import { StepControls } from './components/StepControls.tsx';
import { YearCartouche } from './components/YearCartouche.tsx';
import { MapCanvas } from './map/MapCanvas.tsx';
import { goNext, goPrev, openDocumentId, toggleAutoplay } from './state/app.ts';
import { dataState, loadData } from './state/data.ts';
import styles from './App.module.css';

/** Keys that act on the focused control must not also step the timeline. */
const OWN_KEYS = 'a, button, input, select, textarea, summary, [role="button"], [role="dialog"]';

function onKeyDown(e: KeyboardEvent) {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  if (openDocumentId.value !== null) return;
  const target = e.target instanceof Element ? e.target : null;
  if (e.key === 'ArrowRight') {
    if (target?.closest('select')) return;
    goNext();
  } else if (e.key === 'ArrowLeft') {
    if (target?.closest('select')) return;
    goPrev();
  } else if (e.key === ' ') {
    if (target?.closest(OWN_KEYS)) return;
    e.preventDefault();
    toggleAutoplay();
  }
}

export function App() {
  useEffect(() => {
    void loadData();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const state = dataState.value;
  if (state.status === 'loading') return <LoadingShell />;

  return (
    <main>
      <p class="site-kunye">ATAMap</p>
      <Attribution />
      {state.status === 'error' ? (
        // SPEC §4.2 "Hata: veri JSON": the map stays an empty sheet of paper.
        <div class={styles.error}>
          <div class="cartouche" role="alert">
            <p class={styles.errorText}>Kayıtlar yüklenemedi</p>
            <button type="button" class={styles.retry} onClick={() => void loadData()}>
              Yeniden dene
            </button>
          </div>
        </div>
      ) : (
        <>
          <MapCanvas />
          <div class={`cartouche ${dock.dock}`}>
            <YearCartouche />
            <EventCartouche />
            <StepControls />
          </div>
          <DocumentSheet />
        </>
      )}
    </main>
  );
}
