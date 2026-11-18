// The sheet on the table (2026-11-17, SPEC A35/A42), drawn in map space inside the base layer, so
// table, paper, grain, lamp light and the rolled edges all move with the map: the camera moves over
// a still table, the print never slides over its paper.
//   SheetUnder  wood table, the sheet's shadow on it, the blank paper
//   SheetOver   graticule, atlas neatline with its degree bar and figures, paper grain (multiplied
//               over the print), lamp light, the two rolled edges
// Textures repeat in map space but are drawn at a constant screen size (scale 1/k), so the grain
// stays sharp when the camera comes close and still travels with the paper.
import paperUrl from '../assets/textures/paper.webp';
import woodUrl from '../assets/textures/wood.webp';
import type { Sheet } from './sheet.ts';
import styles from './SheetLayer.module.css';

interface Props {
  sheet: Sheet;
  /** Zoom of the drawn (committed) frame. */
  k: number;
}

/** How far the table runs past the sheet, as a share of the sheet's size. */
const TABLE_REACH = 3;
const WOOD_TILE = 384;
const PAPER_TILE = 1024;
/** Spread of each shadow layer, in roll radii: wider layers are fainter (opacity in CSS). */
const SHADOW_STEPS = [1.6, 1, 0.5];

export function SheetDefs({ sheet, k }: Props) {
  return (
    <>
      <pattern
        id="wood"
        patternUnits="userSpaceOnUse"
        width={WOOD_TILE}
        height={WOOD_TILE}
        patternTransform={`scale(${1 / k})`}
      >
        <image href={woodUrl} width={WOOD_TILE} height={WOOD_TILE} />
      </pattern>
      <pattern
        id="paper-grain"
        patternUnits="userSpaceOnUse"
        width={PAPER_TILE}
        height={PAPER_TILE}
        patternTransform={`scale(${1 / k})`}
      >
        <image href={paperUrl} width={PAPER_TILE} height={PAPER_TILE} />
      </pattern>
      {/* The frame clips the print: the clip box's straight cuts stay outside it. */}
      <clipPath id="frame-clip">
        <path d={sheet.frame} />
      </clipPath>
      <radialGradient id="lamp" cx="50%" cy="22%" r="65%">
        <stop offset="0" class={styles.lampCore} />
        <stop offset="1" class={styles.lampEdge} />
      </radialGradient>
      {/* A cylinder seen from above: shadow underneath, the lit crest, then the paper flattening
          into the sheet. Mirrored for the right edge. */}
      <linearGradient id="roll-left" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" class={styles.rollUnder} />
        <stop offset="0.18" class={styles.rollDark} />
        <stop offset="0.42" class={styles.rollCrest} />
        <stop offset="0.7" class={styles.rollPaper} />
        <stop offset="1" class={styles.rollFold} />
      </linearGradient>
      <linearGradient id="roll-right" x1="1" x2="0" y1="0" y2="0">
        <stop offset="0" class={styles.rollUnder} />
        <stop offset="0.18" class={styles.rollDark} />
        <stop offset="0.42" class={styles.rollCrest} />
        <stop offset="0.7" class={styles.rollPaper} />
        <stop offset="1" class={styles.rollFold} />
      </linearGradient>
      {/* Where the flat sheet starts to lift towards the roll. */}
      <linearGradient id="lift-left" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" class={styles.liftDark} />
        <stop offset="1" class={styles.liftClear} />
      </linearGradient>
      <linearGradient id="lift-right" x1="1" x2="0" y1="0" y2="0">
        <stop offset="0" class={styles.liftDark} />
        <stop offset="1" class={styles.liftClear} />
      </linearGradient>
    </>
  );
}

export function SheetUnder({ sheet }: Props) {
  const { paper, roll } = sheet;
  const w = paper.x1 - paper.x0;
  const h = paper.y1 - paper.y0;
  const reach = Math.max(w, h) * TABLE_REACH;
  return (
    <g class={styles.under}>
      <rect
        class={styles.table}
        x={paper.x0 - reach}
        y={paper.y0 - reach}
        width={w + 2 * reach}
        height={h + 2 * reach}
      />
      {/* Soft shadow of the sheet on the wood, as a few faint stacked rounded rects. A blur filter
          looked the same but cost a third of a second per redraw at close zoom (2026-11-18). */}
      {SHADOW_STEPS.map((f) => (
        <rect
          key={f}
          class={styles.shadow}
          x={paper.x0 - roll * f}
          y={paper.y0 + roll * (0.6 - f * 0.4)}
          width={w + 2 * roll * f}
          height={h + roll * (0.6 + f * 0.8)}
          rx={roll * f}
        />
      ))}
      <rect class={styles.paper} x={paper.x0} y={paper.y0} width={w} height={h} />
    </g>
  );
}

/** The end of a roll seen from above: an ellipse, with the wound layers drawn as nested arcs. */
function RollEnd({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const ry = r * 0.32;
  const ellipse = (f: number) =>
    `M${cx - r * f} ${cy}a${r * f} ${ry * f} 0 1 0 ${2 * r * f} 0a${r * f} ${ry * f} 0 1 0 ${-2 * r * f} 0`;
  return (
    <>
      <path class={styles.rollEnd} d={ellipse(1)} />
      <path class={styles.rollSpiral} d={`${ellipse(0.66)}${ellipse(0.36)}`} />
    </>
  );
}

export function SheetOver({ sheet, k }: Props) {
  const { paper, roll } = sheet;
  const w = paper.x1 - paper.x0;
  const h = paper.y1 - paper.y0;
  const labelSize = 12 / k;
  const lift = roll * 2.5;
  return (
    <g class={styles.over}>
      <g clip-path="url(#frame-clip)">
        <path class={styles.graticule} d={sheet.graticule} />
      </g>
      <path class={styles.zebra} d={sheet.zebra} />
      <path class={styles.neatline} d={sheet.frame} />
      <path class={styles.neatlineInner} d={sheet.frameInner} />
      <g class={styles.figures} font-size={labelSize}>
        {sheet.labels.map((l) => (
          <text key={`${l.x}-${l.y}`} x={l.x} y={l.y} text-anchor={l.anchor} dy="0.35em">
            {l.text}
          </text>
        ))}
      </g>
      {/* Not inside a clipped group: a clip isolates its group, and the blend would then mix with
          nothing instead of the print underneath. The rects are the paper's own size anyway. */}
      <>
        <rect class={styles.grain} x={paper.x0} y={paper.y0} width={w} height={h} />
        <rect class={styles.lamp} x={paper.x0} y={paper.y0} width={w} height={h} />
        <rect
          class={styles.lift}
          x={paper.x0}
          y={paper.y0}
          width={lift}
          height={h}
          fill="url(#lift-left)"
        />
        <rect
          class={styles.lift}
          x={paper.x1 - lift}
          y={paper.y0}
          width={lift}
          height={h}
          fill="url(#lift-right)"
        />
      </>
      {/* The rolls: a little taller than the sheet, as a curl stands proud of it, with the wound
          ends drawn at the top and bottom. */}
      <rect
        class={styles.roll}
        x={paper.x0 - roll}
        y={paper.y0 - roll * 0.3}
        width={roll * 2}
        height={h + roll * 0.6}
        rx={roll * 0.9}
        fill="url(#roll-left)"
      />
      <rect
        class={styles.roll}
        x={paper.x1 - roll}
        y={paper.y0 - roll * 0.3}
        width={roll * 2}
        height={h + roll * 0.6}
        rx={roll * 0.9}
        fill="url(#roll-right)"
      />
      <RollEnd cx={paper.x0} cy={paper.y0 - roll * 0.3} r={roll} />
      <RollEnd cx={paper.x0} cy={paper.y1 + roll * 0.3} r={roll} />
      <RollEnd cx={paper.x1} cy={paper.y0 - roll * 0.3} r={roll} />
      <RollEnd cx={paper.x1} cy={paper.y1 + roll * 0.3} r={roll} />
    </g>
  );
}
