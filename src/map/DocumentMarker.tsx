// Document marker (SPEC §4): letter = sealed envelope, telegram = telegram form, speech = lectern.
// The three differ by shape as well as colour. Drawn as small objects lying on the map
// (2026-11-17): a soft shadow under each, and the object lifts off the paper under the pointer or
// focus. A document without full text is drawn hollow.
import { formatDate } from '../format/date.ts';
import { KIND_LABEL } from '../format/labels.ts';
import type { DocumentRecord } from '../schema/index.ts';
import { hoverOpen, openFor, pointerLeft } from '../state/sheet.ts';
import styles from './DocumentMarker.module.css';

interface Props {
  doc: DocumentRecord;
  x: number;
  y: number;
  active: boolean;
}

/** The object's body, filled with paper. */
const SHAPE: Record<DocumentRecord['kind'], string> = {
  // Lectern: slanted desk with a lip, on a turned stem and a base.
  konusma: 'M-10 -10 H10 L8 -3 H2.5 V7 H8 V10 H-8 V7 H-2.5 V-3 H-8 Z',
  // Telegram form: a slip with a printed band along the top.
  telgraf: 'M-10 -8 H10 V8 H-10 Z',
  // Letter: envelope.
  mektup: 'M-10 -7 H10 V7 H-10 Z',
};

/** Ink drawn on the body: the envelope flap, the form's typed lines, the sheet on the lectern. */
const DETAIL: Record<DocumentRecord['kind'], string> = {
  konusma: 'M-6 -8.5 L6 -8.5 M-5 -6 L5 -6',
  telgraf: 'M-6 -1 H6 M-6 2 H4 M-6 5 H2',
  mektup: 'M-10 -7 L0 1 L10 -7 M-10 7 L-3 0 M10 7 L3 0',
};

/** Wax seal: a blob with an uneven rim, over the flap's point. */
const SEAL =
  'M0 -2.6 L1.6 -2.1 L2.6 -0.6 L2.4 1.3 L1.2 2.6 L-0.8 2.7 L-2.3 1.6 L-2.7 -0.3 L-1.8 -2 Z';

export function DocumentMarker({ doc, x, y, active }: Props) {
  const hollow = doc.fullText === undefined;
  const label = `${KIND_LABEL[doc.kind]}: ${doc.sender}, ${formatDate(doc.date)}${
    hollow ? ' (tam metin gösterilmiyor)' : ''
  }`;
  return (
    <g
      class={`${styles.marker} ${styles[doc.kind]} ${hollow ? styles.hollow : ''} ${
        active ? styles.active : ''
      }`}
      transform={`translate(${x} ${y})`}
      role="button"
      tabindex={0}
      aria-label={label}
      aria-haspopup="dialog"
      data-marker-id={doc.id}
      onClick={() => openFor(doc.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openFor(doc.id);
        }
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') hoverOpen(doc.id);
      }}
      onPointerLeave={() => pointerLeft()}
    >
      <rect class={styles.hit} x="-22" y="-22" width="44" height="44" />
      <ellipse class={styles.shadow} cx="0" cy="12" rx="10" ry="2.5" />
      <g class={styles.object}>
        <path class={styles.glyph} d={SHAPE[doc.kind]} />
        {doc.kind === 'telgraf' && (
          <rect class={styles.band} x="-10" y="-8" width="20" height="4" />
        )}
        <path class={styles.detail} d={DETAIL[doc.kind]} />
        {doc.kind === 'mektup' && <path class={styles.seal} d={SEAL} transform="translate(0 1)" />}
      </g>
    </g>
  );
}
