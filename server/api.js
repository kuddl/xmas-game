/**
 * Leaderboard API (ticket 024), platform-independent (Fetch API only).
 * Used by worker/index.js (Cloudflare), api/index.js (Vercel) and the Vite dev middleware.
 *
 *   GET  /api/leaderboard        -> top 20 (nickname + score only)
 *   POST /api/run                -> new run: { runId, seed, key }
 *   POST /api/run/start          -> server starts the clock for that run
 *   POST /api/run/checkpoint     -> distance + SP every ~10 s (final: true at game over)
 *   POST /api/claim              -> e-mail + nickname for a finished top-20 run (once, within 60 s)
 *
 * Anti-cheat: the server measures the run time itself; every report must be plausible for
 * the time elapsed on the SERVER clock (see src/online/protocol.js#limitsFor). Reports are
 * signed with a per-run key derived from a server secret (obfuscation layer on top).
 */
import { GAME_CONFIG } from '../src/config.js';
import {
  hmacHex,
  limitsFor,
  message,
  scoreOf,
  validateEmail,
  validateNickname,
} from '../src/online/protocol.js';

const ON = GAME_CONFIG.ONLINE;
const SIZE = GAME_CONFIG.LEADERBOARD_SIZE;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS runs (
     id TEXT PRIMARY KEY,
     seed INTEGER NOT NULL,
     ip TEXT,
     created_at INTEGER NOT NULL,
     started_at INTEGER,
     last_at INTEGER,
     last_seq INTEGER NOT NULL DEFAULT 0,
     last_distance INTEGER NOT NULL DEFAULT 0,
     last_sp INTEGER NOT NULL DEFAULT 0,
     ended_at INTEGER,
     final_score INTEGER,
     rejected TEXT,
     claimed_at INTEGER
   )`,
  'CREATE INDEX IF NOT EXISTS runs_ip_created ON runs (ip, created_at)',
  `CREATE TABLE IF NOT EXISTS claims (
     email TEXT PRIMARY KEY,
     nickname TEXT NOT NULL,
     score INTEGER NOT NULL,
     distance INTEGER NOT NULL,
     sp INTEGER NOT NULL,
     run_id TEXT NOT NULL,
     claimed_at INTEGER NOT NULL
   )`,
  'CREATE INDEX IF NOT EXISTS claims_rank ON claims (score DESC, claimed_at ASC)',
  `CREATE TABLE IF NOT EXISTS rejections (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     run_id TEXT,
     reason TEXT NOT NULL,
     detail TEXT,
     ip TEXT,
     at INTEGER NOT NULL
   )`,
];

const schemaReady = new WeakMap(); // db client -> Promise

function ensureSchema(db) {
  if (!schemaReady.has(db)) {
    schemaReady.set(db, db.batch(SCHEMA, 'write').catch((err) => {
      schemaReady.delete(db);
      throw err;
    }));
  }
  return schemaReady.get(db);
}

/* ---------- helpers ---------- */

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const fail = (reason, status = 400, extra = {}) => json({ ok: false, reason, ...extra }, status);

function clientIp(request) {
  const h = request.headers;
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    (h.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'local'
  );
}

async function readJson(request) {
  try {
    const text = await request.text();
    if (text.length > 4000) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const runKey = (secret, runId) => hmacHex(secret, `run-key:${runId}`);

async function verify(secret, runId, msg, sig) {
  if (typeof sig !== 'string' || sig.length !== 64) return false;
  const expected = await hmacHex(await runKey(secret, runId), msg);
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

async function logRejection(db, { runId = null, reason, detail = null, ip, now }) {
  await db.execute({
    sql: 'INSERT INTO rejections (run_id, reason, detail, ip, at) VALUES (?, ?, ?, ?, ?)',
    args: [runId, reason, detail ? JSON.stringify(detail).slice(0, 500) : null, ip, now],
  });
}

async function topEntries(db) {
  const rs = await db.execute({
    sql: 'SELECT nickname, score FROM claims ORDER BY score DESC, claimed_at ASC LIMIT ?',
    args: [SIZE],
  });
  return rs.rows.map((r, i) => ({ rank: i + 1, nickname: String(r.nickname), score: Number(r.score) }));
}

/** rank a score would get right now (ties: the earlier claim stays ahead), ignoring `email`'s own entry */
async function rankFor(db, score, email) {
  const rs = await db.execute({
    sql: 'SELECT COUNT(*) AS n FROM claims WHERE score >= ? AND email <> ?',
    args: [score, email],
  });
  return Number(rs.rows[0].n) + 1;
}

const getRun = async (db, id) =>
  (await db.execute({ sql: 'SELECT * FROM runs WHERE id = ?', args: [String(id)] })).rows[0];

/* ---------- routes ---------- */

async function leaderboard(db) {
  return json({ ok: true, size: SIZE, entries: await topEntries(db) });
}

async function createRun(db, secret, ip, now) {
  const recent = await db.execute({
    sql: 'SELECT COUNT(*) AS n FROM runs WHERE ip = ? AND created_at > ?',
    args: [ip, now - 60_000],
  });
  if (Number(recent.rows[0].n) >= ON.RATE_LIMIT_RUNS_PER_MINUTE) return fail('RATE_LIMIT', 429);

  const runId = crypto.randomUUID();
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  await db.execute({
    sql: 'INSERT INTO runs (id, seed, ip, created_at) VALUES (?, ?, ?, ?)',
    args: [runId, seed, ip, now],
  });
  return json({ ok: true, runId, seed, key: await runKey(secret, runId) });
}

async function startRun(db, secret, body, ip, now) {
  const run = body?.runId && (await getRun(db, body.runId));
  if (!run) return fail('UNKNOWN_RUN', 404);
  if (!(await verify(secret, run.id, message.start(run.id), body.sig))) {
    await logRejection(db, { runId: run.id, reason: 'BAD_SIGNATURE', detail: { step: 'start' }, ip, now });
    return fail('REJECTED', 403);
  }
  if (run.started_at == null) {
    await db.execute({ sql: 'UPDATE runs SET started_at = ?, last_at = ? WHERE id = ? AND started_at IS NULL', args: [now, now, run.id] });
  }
  return json({ ok: true });
}

async function checkpoint(db, secret, body, ip, now) {
  const run = body?.runId && (await getRun(db, body.runId));
  if (!run) return fail('UNKNOWN_RUN', 404);
  if (run.rejected) return fail('REJECTED', 403);
  if (run.started_at == null || run.ended_at != null) return fail('RUN_NOT_ACTIVE', 409);

  const seq = Number(body.seq);
  const distance = Math.floor(Number(body.distance));
  const sp = Math.floor(Number(body.sp));
  const final = !!body.final;

  const reject = async (reason, detail) => {
    await db.execute({ sql: 'UPDATE runs SET rejected = ? WHERE id = ?', args: [reason, run.id] });
    await logRejection(db, { runId: run.id, reason, detail, ip, now });
    return fail('REJECTED', 403);
  };

  if (!(await verify(secret, run.id, message.checkpoint(run.id, seq, distance, sp, final), body.sig))) {
    return reject('BAD_SIGNATURE', { step: 'checkpoint', seq });
  }
  if (!Number.isInteger(seq) || seq <= Number(run.last_seq)) return fail('STALE', 409);
  if (!(distance >= 0 && sp >= 0)) return reject('BAD_VALUES', { distance, sp });

  const elapsed = (now - Number(run.started_at)) / 1000;
  if (elapsed > ON.RUN_MAX_MINUTES * 60) return reject('RUN_TOO_LONG', { elapsed });
  if (distance < Number(run.last_distance) || sp < Number(run.last_sp)) {
    return reject('NOT_MONOTONIC', { distance, sp, last: [run.last_distance, run.last_sp] });
  }
  const max = limitsFor(elapsed);
  if (distance > max.distance || sp > max.sp) {
    return reject('IMPLAUSIBLE', { distance, sp, elapsed: Math.round(elapsed), max });
  }

  await db.execute({
    sql: `UPDATE runs SET last_seq = ?, last_at = ?, last_distance = ?, last_sp = ?,
            ended_at = CASE WHEN ? THEN ? ELSE ended_at END,
            final_score = CASE WHEN ? THEN ? ELSE final_score END
          WHERE id = ? AND last_seq < ?`,
    args: [seq, now, distance, sp, final ? 1 : 0, now, final ? 1 : 0, scoreOf(distance, sp), run.id, seq],
  });

  if (!final) return json({ ok: true });
  // game over: tell the game whether this run can be claimed
  const score = scoreOf(distance, sp);
  const rank = await rankFor(db, score, '');
  return json({ ok: true, score, rank, claimable: rank <= SIZE, claimSeconds: ON.CLAIM_WINDOW_SECONDS });
}

async function claim(db, secret, body, ip, now) {
  const recent = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM rejections WHERE ip = ? AND at > ? AND reason LIKE 'CLAIM_%'`,
    args: [ip, now - 60_000],
  });
  if (Number(recent.rows[0].n) >= ON.RATE_LIMIT_CLAIMS_PER_MINUTE) return fail('RATE_LIMIT', 429);

  const run = body?.runId && (await getRun(db, body.runId));
  if (!run) return fail('UNKNOWN_RUN', 404);

  const em = validateEmail(body.email);
  if (!em.ok) return fail(em.reason);
  const nn = validateNickname(body.nickname);
  if (!nn.ok) return fail(nn.reason);

  if (!(await verify(secret, run.id, message.claim(run.id, em.email, nn.nickname), body.sig))) {
    await logRejection(db, { runId: run.id, reason: 'CLAIM_BAD_SIGNATURE', ip, now });
    return fail('REJECTED', 403);
  }
  if (run.rejected || run.ended_at == null) return fail('REJECTED', 403);
  if (run.claimed_at != null) return fail('ALREADY_CLAIMED', 409);
  if (now - Number(run.ended_at) > (ON.CLAIM_WINDOW_SECONDS + 5) * 1000) return fail('CLAIM_EXPIRED', 410);

  const score = Number(run.final_score);
  const distance = Number(run.last_distance);
  const sp = Number(run.last_sp);

  const existing = (await db.execute({ sql: 'SELECT score FROM claims WHERE email = ?', args: [em.email] })).rows[0];
  if (existing && Number(existing.score) >= score) {
    const best = await rankFor(db, Number(existing.score) + 0.5, em.email); // its own position
    return fail('NOT_BETTER', 409, { bestRank: best });
  }
  const rank = await rankFor(db, score, em.email);
  if (rank > SIZE) return fail('NOT_IN_TOP', 409, { rank });

  // single-use run + one entry per e-mail, in one transaction
  const tx = await db.transaction('write');
  try {
    const used = await tx.execute({
      sql: 'UPDATE runs SET claimed_at = ? WHERE id = ? AND claimed_at IS NULL',
      args: [now, run.id],
    });
    if (used.rowsAffected !== 1) {
      await tx.rollback();
      return fail('ALREADY_CLAIMED', 409);
    }
    await tx.execute({
      sql: `INSERT INTO claims (email, nickname, score, distance, sp, run_id, claimed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
              nickname = excluded.nickname, score = excluded.score, distance = excluded.distance,
              sp = excluded.sp, run_id = excluded.run_id, claimed_at = excluded.claimed_at
            WHERE excluded.score > claims.score`,
      args: [em.email, nn.nickname, score, distance, sp, run.id, now],
    });
    await tx.commit();
  } catch (err) {
    try { await tx.rollback(); } catch { /* already closed */ }
    throw err;
  } finally {
    tx.close();
  }

  return json({ ok: true, rank: await rankFor(db, score, em.email), nickname: nn.nickname, entries: await topEntries(db) });
}

/* ---------- entry point ---------- */

/**
 * @param {Request} request
 * @param {{ db: import('@libsql/client').Client | null, secret?: string, now?: () => number, path?: string }} ctx
 */
export async function handleApi(request, { db, secret, now = () => Date.now(), path } = {}) {
  if (!db || !secret) return fail('OFFLINE', 503);
  const route = path ?? new URL(request.url).pathname;
  const ip = clientIp(request);
  try {
    await ensureSchema(db);
    const t = now();
    if (request.method === 'GET' && route === '/api/leaderboard') return leaderboard(db);
    if (request.method !== 'POST') return fail('NOT_FOUND', 404);
    const body = route === '/api/run' ? null : await readJson(request);
    switch (route) {
      case '/api/run': return createRun(db, secret, ip, t);
      case '/api/run/start': return startRun(db, secret, body, ip, t);
      case '/api/run/checkpoint': return checkpoint(db, secret, body, ip, t);
      case '/api/claim': return claim(db, secret, body, ip, t);
      default: return fail('NOT_FOUND', 404);
    }
  } catch (err) {
    console.error('[leaderboard api]', err);
    return fail('SERVER_ERROR', 500);
  }
}
