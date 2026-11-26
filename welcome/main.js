import { Application, Assets, Container, Sprite, Texture } from 'pixi.js';
import { EffectsManager } from '../src/effects.js';
import { WELCOME } from './content.js';

const root = document.documentElement;
const stage = document.getElementById('stage');
const shakeEl = document.getElementById('shake');
const track = document.getElementById('track');
const runner = document.getElementById('runner');
const santa = document.getElementById('santa');
const toast = document.getElementById('toast');

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(pointer: fine)');
const nativeScrollTimeline = CSS.supports(
  '(animation-timeline: scroll()) and (animation-range: 0% 100%)'
);

const LEVEL_HEIGHTS = [0, 72, 144]; // ice ledge heights above ground, in game pixels (src/config.js)
const FX_VIRTUAL_HEIGHT = 360; // same unit as the game, so particle sizes match

/* ======================================================================
   DOM: intro, blocks, flyers, finale (all from content.js)
   ====================================================================== */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

const beats = []; // intro, blocks..., finale (positioned along the track)

const intro = el('section', 'beat intro');
intro.append(
  el('div', 'kicker', WELCOME.intro.kicker),
  el('h1', 'pixel-title', WELCOME.intro.title),
  el('div', 'scroll-hint', WELCOME.intro.hint)
);
beats.push(intro);

WELCOME.blocks.forEach((block, i) => {
  const level = block.level ?? [0, 1, 2][i % 3];
  const beat = el('section', 'beat block-beat');
  beat.style.setProperty('--lift', `${LEVEL_HEIGHTS[level] ?? 0}`);
  if (level > 0) beat.append(el('div', 'ice'));

  const cardId = `card-${i}`;
  const card = el('article', 'card');
  card.id = cardId;
  card.append(el('h2', '', block.title), el('p', '', block.text));
  if (block.footnote) card.append(el('small', '', block.footnote));

  const button = el('button', 'block');
  button.type = 'button';
  button.setAttribute('aria-label', `Smash the ${block.word} block`);
  button.setAttribute('aria-controls', cardId);
  button.setAttribute('aria-expanded', 'false');
  button.append(el('span', 'block-word', block.word));
  button.addEventListener('click', () => smashBlock(beat, button, card));

  beat.append(el('div', 'smash-hint', 'CLICK TO SMASH'), button, card);
  beats.push(beat);
});

const finale = el('section', 'beat finale');
const giftProgress = el('div', 'gift-progress');
giftProgress.setAttribute('role', 'status');
{
  const f = WELCOME.finale;
  const lock = el('div', 'gift-lock');
  lock.append(el('div', 'kicker', f.kicker), el('h2', '', f.lockedTitle), giftProgress);
  const card = el('div', 'card');
  const link = el('a', 'start-btn', f.button);
  link.href = f.href;
  card.append(el('div', 'kicker', f.kicker), el('h2', 'pixel-title', f.title), link);
  finale.append(lock, card);
  beats.push(finale);
}

const tinsel = el('div', 'tinsel');
tinsel.setAttribute('aria-hidden', 'true');
tinsel.append(el('div', 'strand'), el('div', 'strand strand-2'));

const flyers = WELCOME.flyers.map((f, i) => {
  const button = el('button', 'flyer');
  button.type = 'button';
  button.setAttribute('aria-label', `Destroy the ${f.word} meeting invite`);
  button.style.setProperty('--bob-delay', `${(i * -0.37).toFixed(2)}s`);
  button.append(el('span', 'flyer-word', f.word));
  const flyer = { ...f, button, hit: false, gone: false };
  button.addEventListener('click', () => destroyFlyer(flyer));
  return flyer;
});

track.append(...beats, tinsel, ...flyers.map((f) => f.button));

/* ---------- gift lock ---------- */

const totalBlocks = WELCOME.blocks.length;
let smashedBlocks = 0;
let giftUnlocked = false;
let celebrated = false;

function updateGift() {
  giftProgress.textContent = WELCOME.finale.lockedProgress
    .replace('{done}', smashedBlocks)
    .replace('{total}', totalBlocks);
  if (smashedBlocks >= totalBlocks && !giftUnlocked) {
    giftUnlocked = true;
    finale.classList.add('is-open');
  }
}
updateGift();

/* ======================================================================
   Layout & scroll mapping
   ====================================================================== */

const reverse = WELCOME.layout.scrollDirection === 'reverse';
if (reverse) {
  root.classList.add('scroll-reverse');
  history.scrollRestoration = 'manual'; // always start at the beginning of the run
}

let travel = 0;
let laidOut = false;
const maxScroll = () => document.documentElement.scrollHeight - innerHeight;

/** run progress 0..1 (0 = start), independent of the scroll direction */
function progress() {
  const max = maxScroll();
  const r = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  return reverse ? 1 - r : r;
}

function scrollToProgress(p, smooth = false) {
  const clamped = Math.min(1, Math.max(0, p));
  const r = reverse ? 1 - clamped : clamped;
  scrollTo({ top: r * maxScroll(), behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant' });
}

function layout() {
  const keep = laidOut ? progress() : 0;
  const vw = innerWidth;
  const vh = innerHeight;
  const px = vh / FX_VIRTUAL_HEIGHT;
  const spacing = Math.max(vw * WELCOME.layout.beatSpacing, WELCOME.layout.minBeatSpacingPx);

  const first = vw * 0.5;
  let x = first;
  intro.style.setProperty('--x', `${x}px`);
  x += Math.max(spacing, vw * 0.45); // room for the intro title
  const blockBeats = beats.slice(1, -1);
  const blockXs = blockBeats.map((beat, i) => {
    const bx = x + i * spacing;
    beat.style.setProperty('--x', `${bx}px`);
    return bx;
  });
  const lastBlock = blockXs.at(-1) ?? x;
  const finaleX = lastBlock + Math.max(spacing * 1.5, vw * 0.75);
  finale.style.setProperty('--x', `${finaleX}px`);
  tinsel.style.setProperty('--x', `${finaleX}px`);

  // flyers: in the middle of the gaps between blocks (never on top of one), alternating heights
  const firstBlock = blockXs[0] ?? x;
  const anchors = [firstBlock - spacing, ...blockXs, finaleX - vw * 0.42];
  const slots = [];
  for (let i = 0; i < anchors.length - 1; i++) slots.push((anchors[i] + anchors[i + 1]) / 2);
  // more flyers than gaps: split the widest gap (the run-up to the finale) into two
  while (slots.length < flyers.length) {
    const a = anchors.at(-2);
    const b = anchors.at(-1);
    const n = flyers.length - slots.length + 1;
    slots.pop();
    for (let k = 1; k <= n; k++) slots.push(a + ((b - a) * k) / (n + 1));
  }
  flyers.forEach((f, i) => {
    f.button.style.setProperty('--x', `${slots[i]}px`);
    f.button.style.setProperty('--y', `${[46, 104, 70, 118, 54, 92][i % 6] * px}px`);
  });

  const trackW = finaleX + vw * 0.5;
  travel = trackW - vw;
  root.style.setProperty('--track-w', `${trackW}px`);
  root.style.setProperty('--travel', `${travel}px`);
  laidOut = true;
  scrollToProgress(keep);
}

layout();
addEventListener('resize', layout);

/* JS fallback for browsers without scroll-driven animations */
if (!nativeScrollTimeline) {
  root.classList.add('no-sda');
  let queued = false;
  const update = () => {
    queued = false;
    root.style.setProperty('--p', String(progress()));
  };
  addEventListener(
    'scroll',
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

/* Keyboard: bring the focused block / flyer / button into view */
track.addEventListener('focusin', (e) => {
  if (!travel) return;
  const r = e.target.getBoundingClientRect();
  const trackLeft = track.getBoundingClientRect().left;
  const centerInTrack = r.left + r.width / 2 - trackLeft;
  const visible = r.left > innerWidth * 0.1 && r.right < innerWidth * 0.9;
  if (!visible) scrollToProgress((centerInTrack - innerWidth / 2) / travel, true);
});

/* ======================================================================
   PixiJS overlay: snow, explosions, glitter, fireworks, santa's trail
   ====================================================================== */

let effects = null;
let sparkleTex = null;
let fxScale = 1;
let fxWidth = 1;

async function initFx() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: false,
    autoDensity: true,
    resolution: Math.min(devicePixelRatio || 1, 2),
  });
  app.canvas.classList.add('fx');
  app.canvas.setAttribute('aria-hidden', 'true');
  stage.append(app.canvas);

  sparkleTex = await Assets.load('/assets/sprites/sparkle.png');
  sparkleTex.source.scaleMode = 'nearest';

  const world = new Container();
  app.stage.addChild(world);
  const fit = () => {
    fxScale = app.screen.height / FX_VIRTUAL_HEIGHT;
    fxWidth = app.screen.width / fxScale;
    world.scale.set(fxScale);
  };
  fit();
  app.renderer.on('resize', fit);

  const flakes = [];
  if (!reducedMotion.matches) {
    for (let i = 0; i < 70; i++) {
      const s = new Sprite(Texture.WHITE);
      const size = Math.random() < 0.65 ? 2 : 3;
      s.width = size;
      s.height = size;
      s.alpha = 0.6 + Math.random() * 0.35;
      s.position.set(Math.random() * 1400, Math.random() * FX_VIRTUAL_HEIGHT);
      world.addChild(s);
      flakes.push({ s, vx: -18 - Math.random() * 28, vy: 30 + Math.random() * 48 });
    }
  }

  effects = new EffectsManager({ getTexture: () => sparkleTex }, world);

  let glitterAcc = 0;
  let trailAcc = 0;
  app.ticker.add((t) => {
    const dt = Math.min(0.05, t.deltaMS / 1000);
    effects.update(dt);

    for (const f of flakes) {
      f.s.x += f.vx * dt;
      f.s.y += f.vy * dt;
      if (f.s.x < -10) f.s.x = fxWidth + Math.random() * 40;
      if (f.s.y > FX_VIRTUAL_HEIGHT + 6) {
        f.s.y = -6;
        f.s.x = Math.random() * (fxWidth + 60);
      }
    }
    if (reducedMotion.matches) return;

    // finale: glitter around the gift, fireworks once it is unlocked and visible
    const fr = rectInFx(finale.querySelector(giftUnlocked ? '.card' : '.gift-lock'));
    if (fr && fr.right > 0 && fr.left < fxWidth) {
      glitterAcc += dt * (giftUnlocked ? 38 : 12);
      while (glitterAcc >= 1) {
        glitterAcc -= 1;
        glitterAround(fr);
      }
      if (giftUnlocked && !celebrated && fr.left > 0 && fr.right < fxWidth) {
        celebrated = true;
        fireworks(fr);
      }
    }

    // santa's sparkle trail (he flies to the left, so the trail is on his right)
    const sr = rectInFx(santa);
    if (sr && sr.right > 0 && sr.left < fxWidth) {
      trailAcc += dt * 26;
      while (trailAcc >= 1) {
        trailAcc -= 1;
        effects.spawn(sparkleTex, {
          x: sr.right - 4 + Math.random() * 6,
          y: sr.top + sr.height * (0.45 + Math.random() * 0.4),
          vx: 20 + Math.random() * 30,
          vy: 8 + Math.random() * 16,
          life: 0.7 + Math.random() * 0.5,
          size: 3 + Math.random() * 2,
          color: Math.random() < 0.5 ? 0xf5b82e : 0xffffff,
        });
      }
    }
  });
}

/** element rect in game pixels (fx coordinates) */
function rectInFx(node) {
  if (!node) return null;
  const r = node.getBoundingClientRect();
  if (!r.width) return null;
  return { left: r.left / fxScale, right: r.right / fxScale, top: r.top / fxScale, bottom: r.bottom / fxScale, width: r.width / fxScale, height: r.height / fxScale };
}

const GLITTER = [0xf5b82e, 0xffffff, 0xe02f40, 0x6cb8f0, 0xffe27a];

function glitterAround(r) {
  // random point on the card's border, drifting outward
  const side = Math.random() * 4;
  let x = r.left + Math.random() * r.width;
  let y = r.top + Math.random() * r.height;
  if (side < 1) y = r.top;
  else if (side < 2) y = r.bottom;
  else if (side < 3) x = r.left;
  else x = r.right;
  const cx = (r.left + r.right) / 2;
  const cy = (r.top + r.bottom) / 2;
  const len = Math.hypot(x - cx, y - cy) || 1;
  effects.spawn(sparkleTex, {
    x,
    y,
    vx: ((x - cx) / len) * (14 + Math.random() * 20),
    vy: ((y - cy) / len) * (14 + Math.random() * 20) - 6,
    life: 0.6 + Math.random() * 0.7,
    size: 3 + Math.random() * 3,
    color: GLITTER[(Math.random() * GLITTER.length) | 0],
    spin: (Math.random() - 0.5) * 6,
  });
}

function fireworks(r) {
  const shots = 7;
  for (let i = 0; i < shots; i++) {
    setTimeout(() => {
      const x = r.left + Math.random() * r.width;
      const y = r.top - 20 - Math.random() * Math.max(30, r.top * 0.6);
      const color = GLITTER[i % GLITTER.length];
      effects.burst(x, y, color, 22, 170);
      effects.burst(x, y, 0xffffff, 8, 90);
    }, i * 240);
  }
}

initFx().catch((err) => console.warn('Effects layer unavailable:', err));

/* ======================================================================
   Smash blocks & destroy flyers
   ====================================================================== */

function explodeAt(node, colorA = 0xe02f40) {
  if (reducedMotion.matches || !effects) return;
  const r = rectInFx(node);
  if (!r) return;
  const x = (r.left + r.right) / 2;
  const y = (r.top + r.bottom) / 2;
  effects.debris(x, y);
  effects.burst(x, y, colorA, 14, 160);
  effects.burst(x, y - 20, 0xf5b82e, 10, 120);
  effects.floatText(x, y - 40, '+5 SP');
  replay(shakeEl, 'is-shaking');
}

function replay(node, className) {
  node.classList.remove(className);
  void node.offsetWidth; // restart the CSS animation
  node.classList.add(className);
}

function smashBlock(beat, button, card) {
  if (beat.classList.contains('is-open')) return;
  explodeAt(button);

  // open the card where there is room: above the block, or below it on high ledges
  const blockTop = button.getBoundingClientRect().top;
  beat.classList.toggle('card-below', card.offsetHeight + 24 > blockTop);

  beat.classList.add('is-open');
  button.setAttribute('aria-expanded', 'true');
  smashedBlocks += 1;
  updateGift();
  // keep keyboard focus on the opened card instead of the vanished block
  card.tabIndex = -1;
  card.focus({ preventScroll: true });
  button.disabled = true;
}

function destroyFlyer(flyer) {
  if (flyer.gone) return;
  explodeAt(flyer.button, 0x6cb8f0);
  flyer.gone = true;
  flyer.button.classList.add('is-gone');
  flyer.button.disabled = true;
}

/* ======================================================================
   Toast
   ====================================================================== */

let toastTimer = 0;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

/* ======================================================================
   Runner: cursor on desktop (freezes when hitting a flyer), ground runner on touch
   ====================================================================== */

const stars = el('span', 'stars');
stars.append(el('span', 'star'), el('span', 'star'), el('span', 'star'));
runner.append(stars);

let target = null;
let pos = { x: 0, y: 0 };
let facing = 1;
let jumpTimer = 0;
let pointerInside = false;
let frozenUntil = 0;
let immuneUntil = 0;

const isFrozen = () => performance.now() < frozenUntil;

addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!target) pos = { x: e.clientX, y: e.clientY };
    target = { x: e.clientX, y: e.clientY };
    pointerInside = true;
  },
  { passive: true }
);

addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || isFrozen()) return;
  runner.classList.add('is-jumping');
  clearTimeout(jumpTimer);
  jumpTimer = setTimeout(() => runner.classList.remove('is-jumping'), 260);
});

// While frozen, the (invisible) system cursor must not click anything
document.addEventListener(
  'click',
  (e) => {
    if (isFrozen() && e.pointerType !== 'touch') {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },
  true
);

document.documentElement.addEventListener('mouseleave', () => (pointerInside = false));

function freeze(flyer) {
  const now = performance.now();
  frozenUntil = now + WELCOME.effects.freezeSeconds * 1000;
  immuneUntil = frozenUntil + 400;
  flyer.hit = true;
  flyer.button.classList.add('is-hit');
  showToast(flyer.message);
  runner.classList.add('is-dizzy');
  runner.classList.remove('is-running', 'is-jumping');
  if (!reducedMotion.matches) replay(shakeEl, 'is-wobbling');
  setTimeout(() => runner.classList.remove('is-dizzy'), WELCOME.effects.freezeSeconds * 1000);
}

function checkFlyerHit(cx, cy, size) {
  if (performance.now() < immuneUntil) return;
  const reach = size * 0.32;
  for (const f of flyers) {
    if (f.gone || f.hit) continue;
    const r = f.button.getBoundingClientRect();
    if (cx + reach > r.left && cx - reach < r.right && cy + reach > r.top && cy - reach < r.bottom) {
      freeze(f);
      return;
    }
  }
}

function followPointer() {
  requestAnimationFrame(followPointer);
  if (!finePointer.matches) {
    runner.style.opacity = '';
    runner.style.transform = '';
    return;
  }
  runner.style.opacity = pointerInside ? '1' : '0';
  if (!target) return;

  const size = runner.offsetWidth;
  if (!isFrozen()) {
    const k = reducedMotion.matches ? 1 : 0.22; // smoothing
    const dx = target.x - pos.x;
    pos.x += dx * k;
    pos.y += (target.y - pos.y) * k;
    if (Math.abs(dx) > 0.5) facing = dx >= 0 ? 1 : -1;
    runner.classList.toggle('is-running', Math.hypot(dx, target.y - pos.y) > 2);
    checkFlyerHit(pos.x, pos.y, size);
  }
  // pointer sits at the runner's chest, so clicks land where the figure is
  runner.style.transform = `translate3d(${pos.x - size / 2}px, ${pos.y - size * 0.45}px, 0) scaleX(${facing})`;
}
requestAnimationFrame(followPointer);

// Touch: run while the page scrolls
let scrollIdle = 0;
addEventListener(
  'scroll',
  () => {
    if (finePointer.matches) return;
    runner.classList.add('is-running');
    clearTimeout(scrollIdle);
    scrollIdle = setTimeout(() => runner.classList.remove('is-running'), 140);
  },
  { passive: true }
);

/* ======================================================================
   Santa's sleigh: crosses the sky every few seconds (CSS animation, JS only sets timing)
   ====================================================================== */

santa.style.setProperty('--santa-period', `${WELCOME.effects.santaEverySeconds}s`);
