// The server's own test settings, so vitest does not use the frontend's vite.config.ts in the parent folder.
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { root: '.', environment: 'node' } });
