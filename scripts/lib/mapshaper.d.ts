// mapshaper ships no types. Only the command API build-geo.ts uses is declared.
declare module 'mapshaper' {
  const mapshaper: {
    applyCommands(
      commands: string,
      input: Record<string, string | Uint8Array>,
    ): Promise<Record<string, string | Uint8Array>>;
  };
  export default mapshaper;
}
