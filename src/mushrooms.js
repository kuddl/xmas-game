import { BlurFilter, ColorMatrixFilter, Container, Sprite } from 'pixi.js';
import { GAME_CONFIG } from './config.js';

/**
 * Creative-mode mushrooms (#14): a harmless ground pickup that only appears in
 * REAL PRODUCTION. Touching one tints the whole game world pink and blurs it
 * slightly for a few seconds. Physics and controls stay exactly the same.
 */
export class MushroomManager {
  constructor(assetLoader, parentContainer) {
    this.texture = assetLoader.getTexture('mushroom');
    this.container = new Container();
    this.container.zIndex = 17;
    parentContainer.addChild(this.container);
    this.mushrooms = [];
    this.reset();
  }

  reset() {
    for (const m of this.mushrooms) m.sprite.destroy();
    this.mushrooms = [];
    this.cooldown = GAME_CONFIG.CREATIVE_MODE.firstDelay;
  }

  resetCooldown() {
    const cfg = GAME_CONFIG.CREATIVE_MODE;
    this.cooldown = cfg.minInterval + Math.random() * (cfg.maxInterval - cfg.minInterval);
  }

  /**
   * Hook from the obstacle spawner: maybe place a mushroom in the middle of a wide gap.
   * @returns {boolean} true if a mushroom was placed (caller skips other gap pickups)
   */
  onObstacleGap(obstacleX, gapPx, { inProduction, effectActive, isBlocked }) {
    const cfg = GAME_CONFIG.CREATIVE_MODE;
    if (!inProduction || effectActive || this.cooldown > 0 || this.mushrooms.length > 0) return false;
    if (gapPx < cfg.minGapPx) return false;
    const x = obstacleX + gapPx * 0.5;
    if (isBlocked?.(x)) return false; // not under a platform or the coin cloud
    this.spawn(x);
    this.resetCooldown();
    return true;
  }

  spawn(x) {
    const size = GAME_CONFIG.CREATIVE_MODE.size;
    const sprite = new Sprite(this.texture);
    sprite.anchor.set(0.5, 1);
    sprite.width = size;
    sprite.height = size;
    sprite.position.set(x, GAME_CONFIG.GROUND_Y);
    this.container.addChild(sprite);
    const m = { sprite, x, t: Math.random() * 6 };
    this.mushrooms.push(m);
    return m;
  }

  update(dt, scrollSpeed, inProduction) {
    if (inProduction) this.cooldown = Math.max(0, this.cooldown - dt);
    for (let i = this.mushrooms.length - 1; i >= 0; i--) {
      const m = this.mushrooms[i];
      m.t += dt;
      m.x -= scrollSpeed * dt;
      m.sprite.x = m.x;
      // little wobble so it reads as "alive"
      m.sprite.rotation = Math.sin(m.t * 5) * 0.08;
      if (m.x < -40) {
        m.sprite.destroy();
        this.mushrooms.splice(i, 1);
      }
    }
  }

  /** Returns the touched mushroom's position (and removes it), or null */
  collect(hitbox) {
    const half = GAME_CONFIG.CREATIVE_MODE.size * 0.35;
    const top = GAME_CONFIG.GROUND_Y - GAME_CONFIG.CREATIVE_MODE.size * 0.8;
    for (let i = 0; i < this.mushrooms.length; i++) {
      const m = this.mushrooms[i];
      if (hitbox.right > m.x - half && hitbox.left < m.x + half && hitbox.bottom > top) {
        const pos = { x: m.x, y: GAME_CONFIG.GROUND_Y - 16 };
        m.sprite.destroy();
        this.mushrooms.splice(i, 1);
        return pos;
      }
    }
    return null;
  }
}

/** Pink tint + soft blur on the game world, faded in and out */
export class CreativeModeEffect {
  constructor(target) {
    const cfg = GAME_CONFIG.CREATIVE_MODE;
    this.target = target;
    this.color = new ColorMatrixFilter();
    // Blend every pixel towards pink: out = in * (1 - a) + tint * a
    const a = cfg.tintAmount;
    const [r, g, b] = cfg.tint;
    this.color.matrix = [
      1 - a, 0, 0, 0, r * a,
      0, 1 - a, 0, 0, g * a,
      0, 0, 1 - a, 0, b * a,
      0, 0, 0, 1, 0,
    ];
    this.blur = new BlurFilter({ strength: cfg.blur, quality: 3, resolution: 'inherit' });
    this.blur.repeatEdgePixels = true;
    this.remaining = 0;
    this.intensity = 0;
    this.attached = false;
  }

  get active() {
    return this.remaining > 0;
  }

  /** Start (or restart) the full effect duration */
  trigger() {
    this.remaining = GAME_CONFIG.CREATIVE_MODE.duration;
  }

  reset() {
    this.remaining = 0;
    this.intensity = 0;
    this.apply();
  }

  update(dt) {
    const cfg = GAME_CONFIG.CREATIVE_MODE;
    if (this.remaining > 0) this.remaining = Math.max(0, this.remaining - dt);
    const target = this.remaining > 0 ? 1 : 0;
    const step = dt / cfg.fade;
    this.intensity =
      target > this.intensity
        ? Math.min(target, this.intensity + step)
        : Math.max(target, this.intensity - step);
    this.apply();
  }

  apply() {
    const on = this.intensity > 0;
    if (on !== this.attached) {
      this.target.filters = on ? [this.color, this.blur] : null;
      this.attached = on;
    }
    if (!on) return;
    this.color.alpha = this.intensity;
    this.blur.strength = GAME_CONFIG.CREATIVE_MODE.blur * this.intensity;
  }
}
