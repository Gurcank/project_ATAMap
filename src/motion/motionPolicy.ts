// The one place that reads `prefers-reduced-motion` for JavaScript animation (ADR-10, SPEC §5.3).
// CSS transitions use the --dur-* tokens, which tokens.css already zeroes or shortens under the
// same media query; this module covers what CSS cannot: the camera and the autoplay timing.
import { signal } from '@preact/signals';

const query =
  typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export const reducedMotion = signal(query?.matches ?? false);
query?.addEventListener('change', (e) => {
  reducedMotion.value = e.matches;
});

/** M8 camera move: 0.8-1.5 s, longer for longer hops (SPEC §5.2). Instant when motion is reduced. */
export function cameraDuration(distanceInViewportWidths: number): number {
  if (reducedMotion.value) return 0;
  return Math.round(Math.min(1500, 800 + distanceInViewportWidths * 700));
}

/** Time the step's own animation takes, as input to the autoplay clock (A2). */
export function stepAnimationMs(): number {
  return reducedMotion.value ? 0 : 800;
}
