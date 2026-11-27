/**
 * Online leaderboard client (ticket 024). Every call is best-effort: if the API is not
 * reachable or not configured, the game keeps working with its local leaderboard.
 */
import { GAME_CONFIG } from '../config.js';
import { hmacHex, message, normalizeEmail, normalizeNickname } from './protocol.js';

const ON = GAME_CONFIG.ONLINE;

async function api(path, body) {
  const res = await fetch(`${ON.API_BASE}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!data || typeof data !== 'object') return { ok: false, reason: res.ok ? 'BAD_RESPONSE' : 'OFFLINE' };
  return data;
}

export class OnlineLeaderboard {
  constructor() {
    this.available = false; // set once the API answered
    this.entries = [];
    this.prepared = null; // { runId, seed, key } fetched ahead of the next run
    this.preparing = null;
    this.run = null; // the run currently being played
    this.seq = 0;
    this.result = null; // final checkpoint answer of the last run
  }

  async refresh() {
    try {
      const data = await api('/leaderboard');
      if (data.ok) {
        this.available = true;
        this.entries = data.entries;
      }
      return data;
    } catch {
      return { ok: false, reason: 'OFFLINE' };
    }
  }

  /** fetch a run token (and its seed) in the background, ready for the next start */
  prepare() {
    if (this.prepared || this.preparing) return this.preparing;
    this.preparing = api('/run', {})
      .then((data) => {
        if (data.ok) this.prepared = { runId: data.runId, seed: data.seed, key: data.key };
      })
      .catch(() => {})
      .finally(() => {
        this.preparing = null;
      });
    return this.preparing;
  }

  /**
   * Start of a run. Returns the seed for the gameplay RNG, or null when playing offline.
   * The server clock for this run starts with this call.
   */
  begin() {
    this.run = this.prepared;
    this.prepared = null;
    this.seq = 0;
    this.result = null;
    if (!this.run) return null;
    const run = this.run;
    run.started = hmacHex(run.key, message.start(run.runId))
      .then((sig) => api('/run/start', { runId: run.runId, sig }))
      .catch(() => ({ ok: false }));
    return run.seed;
  }

  /** distance + SP every CHECKPOINT_SECONDS; `final` at game over (resolves with claim info) */
  async checkpoint(distance, sp, final = false) {
    const run = this.run;
    if (!run || run.dead) return null;
    await run.started;
    this.seq += 1;
    const seq = this.seq;
    const d = Math.floor(distance);
    const s = Math.floor(sp);
    try {
      const sig = await hmacHex(run.key, message.checkpoint(run.runId, seq, d, s, final));
      const data = await api('/run/checkpoint', { runId: run.runId, seq, distance: d, sp: s, final, sig });
      if (!data.ok && data.reason === 'REJECTED') run.dead = true;
      if (final) this.result = data;
      return data;
    } catch {
      return null;
    }
  }

  async claim(email, nickname) {
    const run = this.run;
    if (!run) return { ok: false, reason: 'OFFLINE' };
    const e = normalizeEmail(email);
    const n = normalizeNickname(nickname);
    try {
      const sig = await hmacHex(run.key, message.claim(run.runId, e, n));
      const data = await api('/claim', { runId: run.runId, email: e, nickname: n, sig });
      if (data.ok && data.entries) this.entries = data.entries;
      return data;
    } catch {
      return { ok: false, reason: 'OFFLINE' };
    }
  }
}
