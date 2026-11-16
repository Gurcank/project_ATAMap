// Width of a map label in px, for label placement (labels.ts). Measured on a canvas with the same
// font the SVG uses (--font-display at a size token), so the boxes match what is drawn. Cached per
// text; the cache is cleared once the web fonts have loaded, since the fallback font is narrower.

export type SizeToken = '--text-14' | '--text-16';

let context: CanvasRenderingContext2D | null | undefined;
const cache = new Map<string, number>();

function canvas(): CanvasRenderingContext2D | null {
  if (context === undefined) {
    context =
      typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  }
  return context;
}

/** A size token in px; tokens are written in rem in tokens.css. */
export function tokenPx(token: SizeToken): number {
  const root = getComputedStyle(document.documentElement);
  const value = root.getPropertyValue(token).trim();
  const rem = parseFloat(root.fontSize) || 16;
  const n = parseFloat(value);
  if (Number.isNaN(n)) return rem;
  return value.endsWith('rem') ? n * rem : n;
}

export function textWidth(text: string, token: SizeToken, italic = false): number {
  const key = `${token}|${italic ? 'i' : 'n'}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const ctx = canvas();
  const size = tokenPx(token);
  let width = text.length * size * 0.55; // no canvas: a serif average, close enough for spacing
  if (ctx) {
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-display');
    ctx.font = `${italic ? 'italic ' : ''}${size}px ${family.trim() || 'serif'}`;
    width = ctx.measureText(text).width;
  }
  cache.set(key, width);
  return width;
}

export function clearTextCache(): void {
  cache.clear();
}
