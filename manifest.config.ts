import { defineManifest } from '@crxjs/vite-plugin';

import pkg from './package.json';

export default defineManifest({
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
