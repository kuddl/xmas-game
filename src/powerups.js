import { Container, Graphics, Sprite } from 'pixi.js';
import { GAME_CONFIG } from './config.js';

const TYPES = Object.keys(GAME_CONFIG.POWERUPS);

/**
 * Spawns brand-logo collectibles into obstacle gaps and tracks
 * which power-ups are currently active (each with its own timer).
 */
export class PowerUpManager {
  constructor(assetLoader, parentContainer) {
    this.assetLoader = assetLoader;
    this.container = new Container();
    this.container.zIndex = 18;
    parentContainer.addChild(this.container);

    this.pickups = [];
    this.active = {}; // type -> remaining seconds
    this.typeBag = [];
    this.reset();
  }

  reset() {
    for (const p of this.pickups) {
      p.container.destroy({ children: true });
    }
    this.pickups = [];
    this.active = {};
    this.typeBag = [];
    this.cooldown = GAME_CONFIG.POWERUP_FIRST_DELAY;
  }

  nextType() {
    if (this.typeBag.length === 0) {
      this.typeBag = [...TYPES].sort(() => Math.random() - 0.5);
    }
    return this.typeBag.pop();
  }

  /** Called by the obstacle manager after it spawns a block and schedules the next gap */
  onObstacleGap(obstacleX, gapPx, isBlocked = () => false) {
    if (this.cooldown > 0 || this.pickups.length > 0) return;
    if (gapPx < GAME_CONFIG.POWERUP_MIN_GAP_PX) return;
    const x = obstacleX + gapPx * 0.5;
    if (isBlocked(x)) return; // don't bury pickups inside a platform
    this.spawn(x, this.nextType());
    this.resetCooldown();
  }

  /** Reward pickup on the highest platform level */
  spawnReward(x, y) {
    if (this.pickups.length > 0) return;
    this.spawn(x, this.nextType(), y);
    this.resetCooldown();
  }

  resetCooldown() {
    this.cooldown =
      GAME_CONFIG.POWERUP_MIN_INTERVAL +
      Math.random() *
        (GAME_CONFIG.POWERUP_MAX_INTERVAL - GAME_CONFIG.POWERUP_MIN_INTERVAL);
  }

  spawn(x, type, y = null) {
    const def = GAME_CONFIG.POWERUPS[type];
    const size = GAME_CONFIG.POWERUP_SIZE;
    const baseY =
      y ?? GAME_CONFIG.GROUND_Y - GAME_CONFIG.POWERUP_HEIGHT_ABOVE_GROUND;

    const c = new Container();
    c.position.set(x, baseY);

    const glow = new Graphics()
      .circle(0, 0, size * 0.78)
      .fill({ color: def.color, alpha: 0.28 })
      .circle(0, 0, size * 0.62)
      .fill({ color: 0xffffff, alpha: 0.22 });
    c.addChild(glow);

    const icon = new Sprite(this.assetLoader.getTexture(def.sprite));
    icon.anchor.set(0.5);
    icon.width = size;
    icon.height = size;
    c.addChild(icon);

    this.container.addChild(c);
    const pickup = { type, container: c, glow, icon, x, baseY, t: Math.random() * 6 };
    this.pickups.push(pickup);
    return pickup;
  }

  isActive(type) {
    return (this.active[type] || 0) > 0;
  }

  activate(type) {
    this.active[type] = GAME_CONFIG.POWERUPS[type].duration;
  }

  /** Active power-ups as [{ type, remaining, ratio }] for HUD & visuals */
  getActiveList() {
    return TYPES.filter((t) => this.isActive(t)).map((type) => {
      const remaining = this.active[type];
      return {
        type,
        remaining,
        ratio: remaining / GAME_CONFIG.POWERUPS[type].duration,
      };
    });
  }

  update(dt, scrollSpeed) {
    this.cooldown = Math.max(0, this.cooldown - dt);

    for (const type of TYPES) {
      if (this.active[type] > 0) {
        this.active[type] = Math.max(0, this.active[type] - dt);
      }
    }

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.t += dt;
      p.x -= scrollSpeed * dt;
      p.container.x = p.x;
      p.container.y = p.baseY + Math.sin(p.t * 4) * 4; // gentle bob
      p.glow.scale.set(1 + Math.sin(p.t * 7) * 0.12);
      p.icon.rotation = Math.sin(p.t * 3) * 0.12;

      if (p.x < -60) {
        p.container.destroy({ children: true });
        this.pickups.splice(i, 1);
      }
    }
  }

  /** Returns the collected pickup (and removes it) if the player touches one */
  checkPickup(hitbox) {
    const r = GAME_CONFIG.POWERUP_SIZE * 0.5;
    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      const cx = p.container.x;
      const cy = p.container.y;
      const nearestX = Math.max(hitbox.left, Math.min(cx, hitbox.right));
      const nearestY = Math.max(hitbox.top, Math.min(cy, hitbox.bottom));
      const dx = cx - nearestX;
      const dy = cy - nearestY;
      if (dx * dx + dy * dy <= r * r) {
        const collected = { type: p.type, x: cx, y: cy };
        p.container.destroy({ children: true });
        this.pickups.splice(i, 1);
        return collected;
      }
    }
    return null;
  }
}
