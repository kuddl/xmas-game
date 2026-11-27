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

/**
 * Local online leaderboard for `npm run dev` (ticket 024): /api/* is answered by server/api.js
 * against a local SQLite file (.data/dev.db, same libSQL client as in the cloud).
 */
function localLeaderboardApi() {
  return {
    name: 'local-leaderboard-api',
    apply: 'serve',
    async configureServer(server) {
      const { mkdirSync } = await import('node:fs');
      const { createClient } = await import('@libsql/client');
      mkdirSync(resolve(import.meta.dirname, '.data'), { recursive: true });
      const db = createClient({ url: `file:${resolve(import.meta.dirname, '.data/dev.db')}` });
      const secret = process.env.LEADERBOARD_SECRET || 'local-dev-secret';

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        try {
          const { handleApi } = await server.ssrLoadModule('/server/api.js');
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: req.headers,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
          });
          const response = await handleApi(request, { db, secret });
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [localLeaderboardApi()],
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
