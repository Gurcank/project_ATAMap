// Document marker (SPEC §4): letter = seal, telegram = telegram form, speech = lectern. The three
// differ by shape as well as colour. A document without full text is drawn hollow.
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

const SHAPE: Record<DocumentRecord['kind'], string> = {
  // Lectern: slanted desk on a stem and base.
  konusma: 'M-9 -10 H9 L7 -2 H3 V8 H9 V11 H-9 V8 H-3 V-2 H-7 Z',
  // Telegram form: a slip with a notched edge and two rules.
  telgraf: 'M-10 -8 H10 V8 H-10 Z M-6 -3 H6 M-6 2 H3',
  // Letter: envelope outline with the flap; the seal is drawn separately.
  mektup: 'M-10 -7 H10 V7 H-10 Z M-10 -7 L0 1 L10 -7',
};

export function DocumentMarker({ doc, x, y, active }: Props) {
  const hollow = doc.fullText === undefined;
  const label = `${KIND_LABEL[doc.kind]}: ${doc.sender}, ${formatDate(doc.date)}${
    hollow ? ' (tam metin gösterilmiyor)' : ''
  }`;
  const anchor = { x, y };
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
      onClick={() => openFor(doc.id, anchor)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openFor(doc.id, anchor);
        }
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') hoverOpen(doc.id, anchor);
      }}
      onPointerLeave={() => pointerLeft()}
    >
      <rect class={styles.hit} x="-22" y="-22" width="44" height="44" />
      <path class={styles.glyph} d={SHAPE[doc.kind]} />
      {doc.kind === 'mektup' && <circle class={styles.seal} cx="0" cy="1" r="3" />}
    </g>
  );
}
