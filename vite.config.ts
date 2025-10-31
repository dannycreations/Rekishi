import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import manifest from './manifest.config.js';

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some((r) => r.endsWith('.css'))) {
            return 'assets/styles.css';
          }
          return 'assets/[name].[hash].[ext]';
        },
      },
    },
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
