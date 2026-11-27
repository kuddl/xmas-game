/**
 * Vercel Function (GitLab deployment). vercel.json rewrites /api/<path> to /api?path=<path>.
 * Env (Vercel project settings): TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, LEADERBOARD_SECRET
 */
import { createClient } from '@libsql/client/web';
import { handleApi } from '../server/api.js';

let db = null;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const sub = url.searchParams.get('path');
    const path = sub != null ? `/api/${sub.replace(/^\/+/, '')}` : url.pathname;
    if (!db && process.env.TURSO_DATABASE_URL) {
      db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
    }
    return handleApi(request, { db, secret: process.env.LEADERBOARD_SECRET, path });
  },
};
