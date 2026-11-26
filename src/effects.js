import { Container, Sprite, Text, Texture } from 'pixi.js';

const FLOAT_TEXT_LIFE = 0.9; // seconds a "+5 SP" label is visible
const FLOAT_TEXT_RISE = 30; // px it rises over its lifetime
const FLOAT_TEXT_STYLE = {
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontSize: 9,
  fill: 0xf5b82e,
  stroke: { color: 0x12223a, width: 3 },
  padding: 4,
};

/**
 * Lightweight pooled particle system for sparkles (power-up aura,
 * pickup bursts) and debris (smashed obstacles).
 */
export class EffectsManager {
  constructor(assetLoader, parentContainer) {
    this.sparkleTexture = assetLoader.getTexture('sparkle') || Texture.WHITE;
    this.container = new Container();
    this.container.zIndex = 25;
    parentContainer.addChild(this.container);

    this.active = [];
    this.pool = [];
    this.floatTexts = []; // { text, y0, life }
    this.textPool = new Map(); // label string -> Text[] (labels are fixed, never re-rasterised)
  }

  /** Rising, fading score label, e.g. "+5 SP" above a smashed block */
  floatText(x, y, label) {
    const pool = this.textPool.get(label) || [];
    const text =
      pool.pop() || new Text({ text: label, style: FLOAT_TEXT_STYLE, resolution: 4 });
    text.anchor.set(0.5);
    text.position.set(x, y);
    text.alpha = 1;
    text.scale.set(0.6);
    text.visible = true;
    this.container.addChild(text);
    this.floatTexts.push({ text, y0: y, life: FLOAT_TEXT_LIFE });
  }

  releaseFloatText(text) {
    text.visible = false;
    this.container.removeChild(text);
    const pool = this.textPool.get(text.text) || [];
    pool.push(text);
    this.textPool.set(text.text, pool);
  }

  acquire(texture) {
    const sprite = this.pool.pop() || new Sprite();
    sprite.texture = texture;
    sprite.anchor.set(0.5);
    sprite.visible = true;
    sprite.alpha = 1;
    sprite.rotation = 0;
    this.container.addChild(sprite);
    return sprite;
  }

  spawn(texture, { x, y, vx, vy, life, size, color, gravity = 0, spin = 0 }) {
    const sprite = this.acquire(texture);
    sprite.position.set(x, y);
    sprite.tint = color;
    const baseScale = texture === Texture.WHITE ? size : size / 5;
    sprite.scale.set(baseScale);
    this.active.push({ sprite, vx, vy, life, maxLife: life, gravity, spin, baseScale });
  }

  /** Continuous Asterix-style sparkles around the player */
  emitAura(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 14 + Math.random() * 14;
    this.spawn(this.sparkleTexture, {
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
      vx: Math.cos(angle) * 25 - 40,
      vy: -40 - Math.random() * 50,
      life: 0.35 + Math.random() * 0.3,
      size: 4 + Math.random() * 4,
      color: Math.random() < 0.35 ? 0xffffff : color,
      spin: (Math.random() - 0.5) * 8,
    });
  }

  /** Radial burst when a power-up is collected or a double jump fires */
  burst(x, y, color, count = 18, speed = 160) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const s = speed * (0.6 + Math.random() * 0.6);
      this.spawn(this.sparkleTexture, {
        x,
        y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life: 0.45 + Math.random() * 0.25,
        size: 5 + Math.random() * 5,
        color: i % 3 === 0 ? 0xffffff : color,
        spin: (Math.random() - 0.5) * 10,
      });
    }
  }

  /** Chunky pixel debris when an obstacle is smashed */
  debris(x, y, colors = [0x5d9bd6, 0xe8f4ff, 0xe02f40, 0x2f5e96]) {
    for (let i = 0; i < 22; i++) {
      this.spawn(Texture.WHITE, {
        x: x + (Math.random() - 0.5) * 30,
        y: y - Math.random() * 40,
        vx: 60 + Math.random() * 220,
        vy: -120 - Math.random() * 240,
        life: 0.6 + Math.random() * 0.4,
        size: 3 + Math.floor(Math.random() * 4),
        color: colors[i % colors.length],
        gravity: 900,
        spin: (Math.random() - 0.5) * 14,
      });
    }
  }

  update(dt) {
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const f = this.floatTexts[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.releaseFloatText(f.text);
        this.floatTexts.splice(i, 1);
        continue;
      }
      const t = 1 - f.life / FLOAT_TEXT_LIFE; // 0 -> 1
      const ease = 1 - (1 - t) * (1 - t); // ease-out rise
      f.text.y = f.y0 - FLOAT_TEXT_RISE * ease;
      // quick pop (0.6 -> 1.15 -> 1), then fade out over the last 40 %
      const pop = t < 0.15 ? 0.6 + (t / 0.15) * 0.55 : Math.max(1, 1.15 - (t - 0.15) * 1.5);
      f.text.scale.set(pop);
      f.text.alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
    }
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.sprite.visible = false;
        this.container.removeChild(p.sprite);
        this.pool.push(p.sprite);
        this.active.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.sprite.rotation += p.spin * dt;
      const t = p.life / p.maxLife;
      p.sprite.alpha = Math.min(1, t * 1.6);
      p.sprite.scale.set(p.baseScale * (0.5 + t * 0.5));
    }
  }

  clear() {
    for (const f of this.floatTexts) this.releaseFloatText(f.text);
    this.floatTexts = [];
    for (const p of this.active) {
      p.sprite.visible = false;
      this.container.removeChild(p.sprite);
      this.pool.push(p.sprite);
    }
    this.active = [];
  }
}
