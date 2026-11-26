import { Application, Assets, Container, Sprite, Texture } from 'pixi.js';
import { EffectsManager } from '../src/effects.js';
import { WELCOME } from './content.js';

const root = document.documentElement;
const stage = document.getElementById('stage');
const shakeEl = document.getElementById('shake');
const track = document.getElementById('track');
const runner = document.getElementById('runner');

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(pointer: fine)');
const nativeScrollTimeline = CSS.supports(
  '(animation-timeline: scroll()) and (animation-range: 0% 100%)'
);

/* ---------- build the beats from content.js ---------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

const beats = [];

{
  const intro = el('section', 'beat intro');
  intro.append(
    el('div', 'kicker', WELCOME.intro.kicker),
    el('h1', 'pixel-title', WELCOME.intro.title),
    el('div', 'scroll-hint', WELCOME.intro.hint)
  );
  beats.push(intro);
}

WELCOME.blocks.forEach((block, i) => {
  const beat = el('section', 'beat');
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
  button.addEventListener('click', () => smash(beat, button));

  beat.append(card, el('div', 'smash-hint', 'CLICK TO SMASH'), button);
  beats.push(beat);
});

{
  const f = WELCOME.finale;
  const finale = el('section', 'beat finale');
  const card = el('div', 'card');
  const link = el('a', 'start-btn', f.button);
  link.href = f.href;
  card.append(el('div', 'kicker', f.kicker), el('h2', 'pixel-title', f.title), link);
  finale.append(card);
  beats.push(finale);
}

track.append(...beats);

/* ---------- layout: beat positions, track width, scroll distance ---------- */

function layout() {
  const vw = innerWidth;
  const spacing = Math.max(vw * WELCOME.layout.beatSpacing, WELCOME.layout.minBeatSpacingPx);
  const first = vw * 0.5;
  beats.forEach((beat, i) => beat.style.setProperty('--x', `${first + i * spacing}px`));
  const trackW = first + (beats.length - 1) * spacing + vw * 0.5;
  root.style.setProperty('--track-w', `${trackW}px`);
  root.style.setProperty('--travel', `${trackW - vw}px`);
}

layout();
addEventListener('resize', layout);

/* ---------- fallback for browsers without scroll-driven animations ---------- */

if (!nativeScrollTimeline) {
  root.classList.add('no-sda');
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty('--p', max > 0 ? String(Math.min(1, scrollY / max)) : '0');
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

/* ---------- PixiJS overlay: snow + explosions (effects reused from the game) ---------- */

const VIRTUAL_HEIGHT = 360; // same unit as the game, so particle sizes match
let effects = null;
let fxScale = 1;

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

  const sparkle = await Assets.load('/assets/sprites/sparkle.png');
  sparkle.source.scaleMode = 'nearest';

  const world = new Container();
  app.stage.addChild(world);
  const fit = () => {
    fxScale = app.screen.height / VIRTUAL_HEIGHT;
    world.scale.set(fxScale);
  };
  fit();
  app.renderer.on('resize', fit);

  // snow, like the game (skipped for reduced motion)
  const flakes = [];
  if (!reducedMotion.matches) {
    for (let i = 0; i < 70; i++) {
      const s = new Sprite(Texture.WHITE);
      const size = Math.random() < 0.65 ? 2 : 3;
      s.width = size;
      s.height = size;
      s.alpha = 0.6 + Math.random() * 0.35;
      s.position.set(Math.random() * 1400, Math.random() * VIRTUAL_HEIGHT);
      world.addChild(s);
      flakes.push({ s, vx: -18 - Math.random() * 28, vy: 30 + Math.random() * 48 });
    }
  }

  effects = new EffectsManager({ getTexture: () => sparkle }, world);

  app.ticker.add((t) => {
    const dt = Math.min(0.05, t.deltaMS / 1000);
    effects.update(dt);
    const w = app.screen.width / fxScale;
    for (const f of flakes) {
      f.s.x += f.vx * dt;
      f.s.y += f.vy * dt;
      if (f.s.x < -10) f.s.x = w + Math.random() * 40;
      if (f.s.y > VIRTUAL_HEIGHT + 6) {
        f.s.y = -6;
        f.s.x = Math.random() * (w + 60);
      }
    }
  });
}

initFx().catch((err) => console.warn('Effects layer unavailable:', err));

/* ---------- smash a block ---------- */

function smash(beat, button) {
  if (beat.classList.contains('is-open')) return;
  const r = button.getBoundingClientRect();
  const x = (r.left + r.width / 2) / fxScale;
  const y = (r.top + r.height / 2) / fxScale;

  beat.classList.add('is-open');
  button.setAttribute('aria-expanded', 'true');
  button.disabled = true;

  if (reducedMotion.matches || !effects) return;
  effects.debris(x, y);
  effects.burst(x, y, 0xe02f40, 14, 160);
  effects.burst(x, y - 20, 0xf5b82e, 10, 120);
  effects.floatText(x, y - 40, '+5 SP');
  shakeEl.classList.remove('is-shaking');
  void shakeEl.offsetWidth; // restart the CSS animation
  shakeEl.classList.add('is-shaking');
}

/* ---------- runner: follows the pointer (desktop) or runs on the ground (touch) ---------- */

let target = null;
let pos = { x: 0, y: 0 };
let facing = 1;
let jumpTimer = 0;
let pointerInside = false;

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
  if (e.pointerType !== 'mouse') return;
  runner.classList.add('is-jumping');
  clearTimeout(jumpTimer);
  jumpTimer = setTimeout(() => runner.classList.remove('is-jumping'), 260);
});

document.documentElement.addEventListener('mouseleave', () => (pointerInside = false));

function followPointer() {
  requestAnimationFrame(followPointer);
  if (!finePointer.matches) {
    runner.style.opacity = '';
    runner.style.transform = '';
    return;
  }
  runner.style.opacity = pointerInside ? '1' : '0';
  if (!target) return;
  const k = reducedMotion.matches ? 1 : 0.22; // smoothing
  const dx = target.x - pos.x;
  pos.x += dx * k;
  pos.y += (target.y - pos.y) * k;
  if (Math.abs(dx) > 0.5) facing = dx >= 0 ? 1 : -1;
  const size = runner.offsetWidth;
  // pointer sits at the runner's chest, so clicks land where the figure is
  runner.style.transform = `translate3d(${pos.x - size / 2}px, ${pos.y - size * 0.45}px, 0) scaleX(${facing})`;
  runner.classList.toggle('is-running', Math.hypot(dx, target.y - pos.y) > 2);
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
