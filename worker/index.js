/**
 * Cloudflare Worker (GitHub deployment): /api/* goes to the leaderboard API,
 * everything else is served from the static assets (dist/).
 * Secrets: wrangler secret put TURSO_DATABASE_URL / TURSO_AUTH_TOKEN / LEADERBOARD_SECRET
 */
import { createClient } from '@libsql/client/web';
import { handleApi } from '../server/api.js';

let db = null;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (!db && env.TURSO_DATABASE_URL) {
        db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
      }
      return handleApi(request, { db, secret: env.LEADERBOARD_SECRET });
    }
    return env.ASSETS.fetch(request);
  },
};
