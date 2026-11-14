import { useEffect, useRef, useState } from 'preact/hooks';
import { currentStatus, openDocumentId } from '../state/app.ts';
import { isStatusEmpty, type Age } from '../timeline/status.ts';
import styles from './StatusCartouche.module.css';

const PANEL_ID = 'durum-paneli';

const ageText = (age: Age) => (age.min === age.max ? `${age.max}` : `${age.min}-${age.max}`);

/** "yaklaşık" is a badge, not part of the number (SPEC §2.3). */
function AgeValue({ age }: { age: Age }) {
  return (
    <>
      <span class={styles.age}>{ageText(age)}</span>
      {age.min !== age.max && <span class={styles.badge}>yaklaşık</span>}
    </>
  );
}

// Top right: age, rank, duties and place on the step's date (SPEC §3.5, §4, A24-A26).
// Below 48rem only a toggle showing the age stays on the map; the four fields open over the map.
// No aria-live: EventCartouche already announces each step, a second live region would repeat it.
export function StatusCartouche() {
  const status = currentStatus.value;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) toggle.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      // An open document sheet owns Escape.
      if (e.key === 'Escape' && openDocumentId.value === null) close(true);
    };
    const onPointer = (e: PointerEvent) => {
      if (e.target instanceof Node && !root.current?.contains(e.target)) close(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  if (status === null || isStatusEmpty(status)) return null;

  return (
    <section class={styles.status} aria-label="Durum" ref={root}>
      <button
        type="button"
        class={styles.toggle}
        ref={toggle}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen(!open)}
      >
        {status.age ? (
          <>
            <span class="visually-hidden">Durum: </span>
            <AgeValue age={status.age} /> yaşında
          </>
        ) : (
          'Durum'
        )}
        <span class={styles.chevron} aria-hidden="true" />
      </button>
      <dl id={PANEL_ID} class={`cartouche ${styles.panel}`} hidden={!open}>
        {status.age && (
          <>
            <dt>Yaş</dt>
            <dd>
              <AgeValue age={status.age} />
            </dd>
          </>
        )}
        {status.rank !== null && (
          <>
            <dt>Rütbe</dt>
            <dd>{status.rank}</dd>
          </>
        )}
        {status.duties.length > 0 && (
          <>
            <dt>Görev</dt>
            {status.duties.map((duty) => (
              <dd key={duty}>{duty}</dd>
            ))}
          </>
        )}
        {status.place !== null && (
          <>
            <dt>Yer</dt>
            <dd>{status.place}</dd>
          </>
        )}
      </dl>
    </section>
  );
}
