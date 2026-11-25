import { Container, Sprite } from 'pixi.js';
import { GAME_CONFIG } from './config.js';

/**
 * Story Points: spinning gold coins laid out in readable patterns
 * (jump arcs over blocks, duck rows under flyers, rows on platforms).
 */
export class CoinManager {
  constructor(assetLoader, parentContainer) {
    this.frames = assetLoader.getFrames('coin');
    const meta = assetLoader.getSpriteMeta('coin');
    this.fps = meta?.animations?.spin?.fps || 8;

    this.container = new Container();
    this.container.zIndex = 16;
    parentContainer.addChild(this.container);

    this.coins = [];
    this.pool = [];
    this.animTime = 0;
  }

  reset() {
    for (const coin of this.coins) this.release(coin);
    this.coins = [];
  }

  release(coin) {
    coin.sprite.visible = false;
    this.container.removeChild(coin.sprite);
    this.pool.push(coin.sprite);
  }

  add(x, y, phase = 0) {
    const sprite = this.pool.pop() || new Sprite(this.frames[0]);
    sprite.anchor.set(0.5);
    sprite.width = GAME_CONFIG.COIN_SIZE;
    sprite.height = GAME_CONFIG.COIN_SIZE;
    sprite.visible = true;
    sprite.position.set(x, y);
    this.container.addChild(sprite);
    this.coins.push({ sprite, x, y, phase });
  }

  /** Coin arc above a ground block, tracing the jump path (kept above the buzzword sign) */
  arcOver(x) {
    const ground = GAME_CONFIG.GROUND_Y;
    [-56, -28, 0, 28, 56].forEach((dx, i) => {
      const lift = 50 + 32 * (1 - (dx / 72) ** 2);
      this.add(x + dx, ground - lift, i);
    });
  }

  /** Low row under a flyer: only safe to grab while ducking */
  rowUnderFlyer(x) {
    for (let i = 0; i < 4; i++) {
      this.add(x + i * GAME_CONFIG.COIN_SPACING, GAME_CONFIG.GROUND_Y - 12, i);
    }
  }

  /** Ground-level row inside a wide gap between obstacles */
  rowInGap(obstacleX, gapPx) {
    const count = Math.max(3, Math.min(6, Math.floor((gapPx - 140) / GAME_CONFIG.COIN_SPACING)));
    const startX = obstacleX + 70;
    for (let i = 0; i < count; i++) {
      this.add(
        startX + i * GAME_CONFIG.COIN_SPACING,
        GAME_CONFIG.GROUND_Y - GAME_CONFIG.COIN_ROW_HEIGHT,
        i
      );
    }
  }

  /** Row along the top of a platform */
  rowOnPlatform(left, width, top) {
    for (let x = left + 24; x <= left + width - 24; x += GAME_CONFIG.COIN_SPACING) {
      this.add(x, top - GAME_CONFIG.COIN_ROW_HEIGHT, x / GAME_CONFIG.COIN_SPACING);
    }
  }

  /** Hook: an obstacle was spawned and the next gap is known */
  onObstacle(obstacle, gapPx) {
    if (obstacle.kind === 'flyer') {
      if (Math.random() < GAME_CONFIG.COIN_UNDER_FLYER_CHANCE) this.rowUnderFlyer(obstacle.x);
      return;
    }
    if (Math.random() < GAME_CONFIG.COIN_ARC_CHANCE) {
      this.arcOver(obstacle.x);
    } else if (gapPx >= 240 && Math.random() < GAME_CONFIG.COIN_GAP_ROW_CHANCE) {
      this.rowInGap(obstacle.x, gapPx);
    }
  }

  /** Hook: a platform was created */
  onPlatform(left, width, top) {
    if (Math.random() < GAME_CONFIG.COIN_PLATFORM_ROW_CHANCE) this.rowOnPlatform(left, width, top);
  }

  update(dt, scrollSpeed) {
    this.animTime += dt;
    const frameCount = this.frames.length;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= scrollSpeed * dt;
      coin.sprite.x = coin.x;
      // Staggered spin so a row ripples instead of flipping in sync
      const frame = Math.floor(this.animTime * this.fps + coin.phase) % frameCount;
      coin.sprite.texture = this.frames[frame];
      if (coin.x < -30) {
        this.release(coin);
        this.coins.splice(i, 1);
      }
    }
  }

  /** Collect every coin touching the hitbox; returns their positions */
  collect(hitbox) {
    const r = GAME_CONFIG.COIN_PICKUP_RADIUS;
    const collected = [];
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      const nx = Math.max(hitbox.left, Math.min(coin.x, hitbox.right));
      const ny = Math.max(hitbox.top, Math.min(coin.y, hitbox.bottom));
      const dx = coin.x - nx;
      const dy = coin.y - ny;
      if (dx * dx + dy * dy <= r * r) {
        collected.push({ x: coin.x, y: coin.y });
        this.release(coin);
        this.coins.splice(i, 1);
      }
    }
    return collected;
  }
}
