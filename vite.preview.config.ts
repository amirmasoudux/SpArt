// Builds the whole app into ONE html file, for sharing a live preview.
// Normal deploys use vite.config.ts.
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { outDir: 'dist-preview' },
  define: { 'import.meta.env.VITE_ROUTER': JSON.stringify('memory') },
});
