/**
 * Self-test for the online leaderboard API (ticket 024): `npm run test:leaderboard`
 * Runs server/api.js against a temporary SQLite file with a simulated clock.
 */
import { createClient } from '@libsql/client';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleApi } from '../server/api.js';
import { hmacHex, message } from '../src/online/protocol.js';

const dir = mkdtempSync(join(tmpdir(), 'lb-test-'));
const db = createClient({ url: `file:${join(dir, 'test.db')}` });
const secret = 'test-secret';
let clock = 1_700_000_000_000;
let ip = '10.0.0.1';

async function call(method, path, body) {
  const req = new Request(`http://test${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-real-ip': ip },
    body: body ? JSON.stringify(body) : undefined,
  });
  const res = await handleApi(req, { db, secret, now: () => clock });
  return { status: res.status, ...(await res.json()) };
}

let failures = 0;
function check(name, cond, info) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `  ${JSON.stringify(info)}`}`);
  if (!cond) failures++;
}

/** plays a legit run: `seconds` long at 12 m/s and 1 SP/s, then game over */
async function playRun(seconds, { speed = 12, spRate = 1 } = {}) {
  const r = await call('POST', '/api/run');
  await call('POST', '/api/run/start', { runId: r.runId, sig: await hmacHex(r.key, message.start(r.runId)) });
  let seq = 0;
  let last;
  for (let t = 10; t <= seconds; t += 10) {
    clock += 10_000;
    seq++;
    const final = t + 10 > seconds;
    const d = speed * t;
    const sp = Math.floor(spRate * t);
    last = await call('POST', '/api/run/checkpoint', {
      runId: r.runId, seq, distance: d, sp, final,
      sig: await hmacHex(r.key, message.checkpoint(r.runId, seq, d, sp, final)),
    });
  }
  return { ...r, final: last };
}

const claim = async (r, email, nickname) =>
  call('POST', '/api/claim', { runId: r.runId, email, nickname, sig: await hmacHex(r.key, message.claim(r.runId, email.toLowerCase(), nickname.toUpperCase())) });

try {
  // 1. legit run + claim
  const a = await playRun(60);
  check('legit run is claimable', a.final.ok && a.final.claimable && a.final.rank === 1, a.final);
  const c1 = await claim(a, 'Tobias.Sailer@merkle.com', 'Rudolf Red Nose');
  check('claim succeeds, rank 1', c1.ok && c1.rank === 1, c1);
  check('leaderboard shows nickname, never e-mail', JSON.stringify(c1.entries).includes('RUDOLF') && !JSON.stringify(c1.entries).includes('@'), c1.entries);

  // 2. same run cannot be claimed twice
  const c2 = await claim(a, 'armin@merkle.com', 'Armin');
  check('run is single-use', !c2.ok && c2.reason === 'ALREADY_CLAIMED', c2);

  // 3. worse run with the same e-mail keeps the old entry
  const b = await playRun(30);
  const c3 = await claim(b, 'tobias.sailer@merkle.com', 'Rudolf');
  check('worse run does not replace best', !c3.ok && c3.reason === 'NOT_BETTER', c3);

  // 4. better run with the same e-mail replaces it (still one entry)
  const c = await playRun(90);
  const c4 = await claim(c, 'tobias.sailer@merkle.com', 'Rudolf 2');
  const board = await call('GET', '/api/leaderboard');
  check('better run replaces, one entry per e-mail', c4.ok && board.entries.length === 1 && board.entries[0].nickname === 'RUDOLF 2', board);

  // 5. domain + nickname rules
  const d = await playRun(40);
  check('foreign domain rejected', (await claim(d, 'me@gmail.com', 'Me')).reason === 'EMAIL_DOMAIN');
  check('emoji nickname rejected', (await claim(d, 'me@dentsu.com', 'Me 🎅')).reason === 'NICKNAME_CHARS');
  for (const bad of ['FU CK', 'Sh1t', 'F4ck.Off', 'nazi-elf']) {
    check(`offensive nickname "${bad}" rejected`, (await claim(d, 'me@dentsu.com', bad)).reason === 'NICKNAME_BLOCKED');
  }
  check('dentsu address accepted', (await claim(d, 'me@dentsu.com', 'Elf')).ok);

  // 6. claim window closes after 60 s
  const e = await playRun(50);
  clock += 70_000;
  check('claim after 60 s rejected', (await claim(e, 'late@merkle.com', 'Late')).reason === 'CLAIM_EXPIRED');

  // 7. cheating: too far for the time on the server clock
  const f = await call('POST', '/api/run');
  await call('POST', '/api/run/start', { runId: f.runId, sig: await hmacHex(f.key, message.start(f.runId)) });
  clock += 10_000;
  const cheat = await call('POST', '/api/run/checkpoint', {
    runId: f.runId, seq: 1, distance: 6000, sp: 0, final: true,
    sig: await hmacHex(f.key, message.checkpoint(f.runId, 1, 6000, 0, true)),
  });
  check('6000 m after 10 s rejected', !cheat.ok && cheat.reason === 'REJECTED', cheat);
  check('cheat run cannot be claimed', !(await claim(f, 'cheat@merkle.com', 'Cheat')).ok);

  // 8. cheating: forged signature (plain JSON without the run key)
  const g = await call('POST', '/api/run');
  await call('POST', '/api/run/start', { runId: g.runId, sig: await hmacHex(g.key, message.start(g.runId)) });
  clock += 10_000;
  const forged = await call('POST', '/api/run/checkpoint', { runId: g.runId, seq: 1, distance: 100, sp: 5, final: true, sig: 'a'.repeat(64) });
  check('forged signature rejected', !forged.ok && forged.reason === 'REJECTED', forged);

  // 9. top 20: a weak run is not claimable once the board is full of better ones
  for (let i = 0; i < 20; i++) {
    ip = `10.1.0.${i}`;
    const r = await playRun(70 + i);
    await claim(r, `p${i}@merkle.com`, `Player ${i}`);
  }
  ip = '10.2.0.1';
  const weak = await playRun(20);
  check('weak run not claimable when top 20 is full', weak.final.claimable === false && weak.final.rank > 20, weak.final);
  check('weak run claim rejected server-side', (await claim(weak, 'weak@merkle.com', 'Weak')).reason === 'NOT_IN_TOP');
  const top = await call('GET', '/api/leaderboard');
  check('leaderboard returns exactly 20', top.entries.length === 20, top.entries.length);

  // 10. rejections are logged for the team
  const log = await db.execute('SELECT reason FROM rejections');
  check('rejections are logged', log.rows.some((r) => r.reason === 'IMPLAUSIBLE') && log.rows.some((r) => r.reason === 'BAD_SIGNATURE'), log.rows);

  // 11. offline without db / secret
  const off = await handleApi(new Request('http://test/api/leaderboard'), { db: null, secret });
  check('no database -> 503 OFFLINE', off.status === 503);
} finally {
  db.close();
  rmSync(dir, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
