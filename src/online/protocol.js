/**
 * Online leaderboard protocol (ticket 024), shared by the game (browser) and the server
 * (Vercel Function, local Vite middleware). Pure ESM + WebCrypto only.
 */
import { GAME_CONFIG } from '../config.js';

const ON = GAME_CONFIG.ONLINE;

/* ---------- score & plausibility ---------- */

export function scoreOf(distanceMeters, storyPoints) {
  return Math.floor(distanceMeters) + storyPoints * GAME_CONFIG.SP_SCORE_FACTOR;
}

/** fastest possible run: top scroll speed while holding "→" */
export function maxMetersPerSecond() {
  return (GAME_CONFIG.MAX_SCROLL_SPEED * GAME_CONFIG.MAX_SPEED_MULTIPLIER) / GAME_CONFIG.PIXELS_PER_METER;
}

/** upper bounds for a run that has been going for `seconds` (measured by the server clock) */
export function limitsFor(seconds) {
  const t = Math.max(0, seconds);
  return {
    distance: maxMetersPerSecond() * t * ON.TOLERANCE + 10,
    sp: ON.MAX_SP_PER_SECOND * t * ON.TOLERANCE + 10,
  };
}

/* ---------- claim input ---------- */

const EMAIL_RE = /^[a-z0-9._%+-]+@([a-z0-9-]+\.)*([a-z0-9-]+\.[a-z]{2,})$/;

export function normalizeEmail(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

/** company address only (format check, not verified by mail; that is a deliberate decision) */
export function validateEmail(raw) {
  const email = normalizeEmail(raw);
  const m = EMAIL_RE.exec(email);
  if (!m) return { ok: false, reason: 'EMAIL_FORMAT' };
  const domain = email.slice(email.indexOf('@') + 1);
  if (!ON.EMAIL_DOMAINS.includes(domain)) return { ok: false, reason: 'EMAIL_DOMAIN' };
  return { ok: true, email };
}

export function normalizeNickname(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
}

// Small filter against the obvious (EN + DE); compared without spaces/dots/dashes and leetspeak
const BLOCKED = [
  'FUCK', 'FACK', 'SHIT', 'CUNT', 'BITCH', 'ASSHOLE', 'DICK', 'COCK', 'PUSSY', 'PORN', 'WHORE', 'SLUT',
  'NIGG', 'NAZI', 'HITLER', 'HEIL', 'RAPE', 'FICK', 'FOTZE', 'ARSCH', 'HURE', 'WICHS', 'SCHLAMPE',
  'NUTTE', 'SPAST', 'MISSGEBURT', 'KANAKE', 'SCHWUCHTEL',
];
const LEET = { 0: 'O', 1: 'I', 3: 'E', 4: 'A', 5: 'S', 7: 'T', 8: 'B' };

/** 1-16 characters: letters, digits, space, dot, dash. No emojis, nothing offensive. */
export function validateNickname(raw) {
  const nickname = normalizeNickname(raw);
  if (!nickname) return { ok: false, reason: 'NICKNAME_EMPTY' };
  if (nickname.length > ON.NICKNAME_MAX) return { ok: false, reason: 'NICKNAME_LENGTH' };
  if (!/^[A-Z0-9ÄÖÜ .-]+$/.test(nickname)) return { ok: false, reason: 'NICKNAME_CHARS' };
  const squashed = nickname.replace(/[ .-]/g, '').replace(/[0-9]/g, (d) => LEET[d] ?? d);
  if (BLOCKED.some((w) => squashed.includes(w))) return { ok: false, reason: 'NICKNAME_BLOCKED' };
  return { ok: true, nickname };
}

/* ---------- signing (HMAC-SHA256 via WebCrypto) ---------- */

const enc = new TextEncoder();

export async function hmacHex(key, message) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** canonical strings the game signs with its per-run key (server re-computes them) */
export const message = {
  start: (runId) => `${runId}|start`,
  checkpoint: (runId, seq, distance, sp, final) =>
    `${runId}|cp|${seq}|${Math.floor(distance)}|${sp}|${final ? 1 : 0}`,
  claim: (runId, email, nickname) => `${runId}|claim|${email}|${nickname}`,
};

/** user-facing texts for server reasons (English, like the game) */
export const REASON_TEXT = {
  EMAIL_FORMAT: 'PLEASE ENTER A VALID E-MAIL',
  EMAIL_DOMAIN: `USE YOUR @${ON.EMAIL_DOMAINS.join(' OR @')} ADDRESS`,
  NICKNAME_EMPTY: 'PLEASE ENTER A NICKNAME',
  NICKNAME_LENGTH: `NICKNAME: MAX ${ON.NICKNAME_MAX} CHARACTERS`,
  NICKNAME_CHARS: 'NICKNAME: LETTERS, DIGITS, SPACE, . AND - ONLY',
  NICKNAME_BLOCKED: 'PLEASE CHOOSE ANOTHER NICKNAME',
  NOT_IN_TOP: 'SORRY, NOT ENOUGH FOR THE TOP 20 ANYMORE',
  NOT_BETTER: 'YOUR BEST IS STILL HIGHER',
  CLAIM_EXPIRED: 'TOO LATE: THE CLAIM WINDOW HAS CLOSED',
  ALREADY_CLAIMED: 'THIS RUN WAS ALREADY CLAIMED',
  RATE_LIMIT: 'TOO MANY TRIES, PLEASE WAIT A MINUTE',
  REJECTED: 'CLAIM REJECTED',
  OFFLINE: 'LEADERBOARD IS OFFLINE RIGHT NOW',
};
