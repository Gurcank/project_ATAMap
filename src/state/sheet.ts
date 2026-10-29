// Opening and closing of the document sheet (SPEC §4.1).
//   Mouse hover: opens after the hover intent delay, closes shortly after the pointer has left both
//     the marker and the sheet. Focus is not taken.
//   Click, touch, Enter: opens for good; focus moves into the sheet. Esc or the close button ends it
//     and focus returns to the marker.
import { signal } from '@preact/signals';
import { openDocumentId } from './app.ts';

export interface Anchor {
  x: number;
  y: number;
}

export const sheetAnchor = signal<Anchor | null>(null);
export const openedByHover = signal(false);

// Same values as --hover-intent and --hover-close in tokens.css (kept in sync by hand: CSS custom
// properties are not readable here without a layout pass).
const HOVER_INTENT_MS = 150;
const HOVER_CLOSE_MS = 300;

let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

const clearTimers = () => {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
};

export function hoverOpen(id: string, anchor: Anchor): void {
  clearTimeout(closeTimer);
  // Another sheet that was opened for good is not replaced by a passing pointer.
  if (openDocumentId.value !== null && !openedByHover.value) return;
  clearTimeout(openTimer);
  openTimer = setTimeout(() => {
    openedByHover.value = true;
    sheetAnchor.value = anchor;
    openDocumentId.value = id;
  }, HOVER_INTENT_MS);
}

export function pointerLeft(): void {
  clearTimeout(openTimer);
  if (!openedByHover.value) return;
  clearTimeout(closeTimer);
  closeTimer = setTimeout(closeSheet, HOVER_CLOSE_MS);
}

export function pointerEnteredSheet(): void {
  clearTimeout(closeTimer);
}

export function openFor(id: string, anchor: Anchor): void {
  clearTimers();
  openedByHover.value = false;
  sheetAnchor.value = anchor;
  openDocumentId.value = id;
}

export function closeSheet(): void {
  clearTimers();
  openDocumentId.value = null;
  openedByHover.value = false;
}
