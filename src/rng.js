/**
 * Seeded random numbers for everything that shapes a run (obstacles, coins, platforms,
 * power-ups, mushrooms). The online leaderboard hands out a seed per run (ticket 024);
 * without one, a random seed is used. Purely visual effects keep Math.random().
 */
let state = (Math.random() * 2 ** 32) >>> 0;

/** mulberry32: small, fast, good enough for gameplay */
export function rng() {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function seedRng(seed) {
  state = (Number(seed) >>> 0) || (Math.random() * 2 ** 32) >>> 0;
}
