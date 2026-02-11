import { crx, defineManifest } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import checker from 'vite-plugin-checker';

import pkg from './package.json';

const manifest = defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  background: {
    service_worker: 'src/app/background.ts',
    type: 'module',
  },
  chrome_url_overrides: {
    history: 'src/index.html',
  },
  offline_enabled: true,
  permissions: ['favicon', 'tabs', 'storage', 'contextMenus', 'history', 'sessions', 'unlimitedStorage', 'alarms', 'activeTab'],
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      checker({
        typescript: true,
        enableBuild: true,
      }),
      crx({ manifest }),
    ],
    build: {
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
    define: {
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
    },
    server: {
      cors: {
        origin: [/chrome-extension:\/\//],
      },
    },
  };
});
