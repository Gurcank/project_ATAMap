import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      // Lets fonts.css point straight at the woff2 files we ship (ADR-12).
      '@fontsource-files': fileURLToPath(new URL('./node_modules/@fontsource', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // check-size.ts reads the manifest to find the initial chunks (ADR-14).
    manifest: true,
    assetsInlineLimit: 0,
  },
});
