import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import { resolve } from 'node:path';
import pkg from './package.json' with { type: 'json' };

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __GIT_COMMIT__: JSON.stringify(getGitCommit())
  },
  build: {
    rollupOptions: {
      // multi-page: the landing page on / and the game on /game/
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        game: resolve(import.meta.dirname, 'game/index.html'),
      },
    },
  }
});
