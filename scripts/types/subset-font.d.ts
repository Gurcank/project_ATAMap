// subset-font ships without types; only the call scripts/subset-fonts.ts makes is declared.
declare module 'subset-font' {
  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: { targetFormat?: 'woff2' | 'woff' | 'truetype' | 'sfnt' },
  ): Promise<Buffer>;
}
