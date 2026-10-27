// Pins tokens.css to the SPEC §3.2 palette and re-checks its contrast claims (WCAG 2.x).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(import.meta.dirname, '..', '..', 'src', 'styles', 'tokens.css'),
  'utf8',
);

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`--${name} not found`);
  return match[1].toUpperCase();
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const SPEC_PALETTE: Record<string, string> = {
  paper: '#F3E7CF',
  panel: '#EADBB9',
  land: '#E4CFA3',
  sea: '#D6C29A',
  ink: '#2B1D0E',
  'ink-muted': '#5C4327',
  'border-line': '#8B3A1A',
  route: '#B4561A',
  'accent-text': '#9A3F14',
  telegram: '#7A2E12',
  letter: '#8B6A2E',
};

describe('palette (SPEC §3.2)', () => {
  it.each(Object.entries(SPEC_PALETTE))('--%s matches SPEC', (name, hex) => {
    expect(token(name)).toBe(hex);
  });
});

// [foreground, background, minimum ratio]. 4.5 = text (AA), 3 = graphics (WCAG 1.4.11).
const PAIRS: [string, string, number][] = [
  ['ink', 'paper', 4.5],
  ['ink', 'land', 4.5],
  ['ink', 'panel', 4.5],
  ['ink-muted', 'paper', 4.5],
  ['ink-muted', 'land', 4.5],
  ['ink-muted', 'panel', 4.5],
  ['accent-text', 'paper', 4.5],
  ['telegram', 'paper', 4.5],
  ['border-line', 'land', 3],
  ['route', 'land', 3],
  ['letter', 'paper', 3],
];

describe('contrast (SPEC §3.2)', () => {
  it.each(PAIRS)('--%s on --%s ≥ %d:1', (fg, bg, min) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
  });
});
