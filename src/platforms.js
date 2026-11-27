import { Container, Graphics, TilingSprite } from 'pixi.js';
import { GAME_CONFIG } from './config.js';

/**
 * One-way ice platforms on level 2 and 3 ("Ebenen").
 * Players jump up through them from below and land on top;
 * pressing ↓ while standing on one drops back down.
 */
export class PlatformManager {
  constructor(assetLoader, parentContainer) {
    this.assetLoader = assetLoader;
    this.container = new Container();
    this.container.zIndex = 17; // above ground obstacles, below player
    parentContainer.addChild(this.container);

    this.platforms = [];
    this.onReward = null; // (x, y) => void — spawn a reward on the top level
    this.onCreate = null; // (left, width, top) => void — decorate a new platform
    this.canSpawnAt = null; // (startX) => boolean — false while an obstacle is in the way
    this.reset();
  }

  reset() {
    for (const p of this.platforms) {
      p.container.destroy({ children: true });
    }
    this.platforms = [];
    this.timer = GAME_CONFIG.PLATFORM_FIRST_DELAY;
  }

  randomWidth() {
    const { PLATFORM_MIN_WIDTH: min, PLATFORM_MAX_WIDTH: max } = GAME_CONFIG;
    // snap to whole 32px tiles for crisp pixel edges
    return Math.round((min + Math.random() * (max - min)) / 32) * 32;
  }

  topForLevel(levelIndex) {
    return GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLATFORM_LEVELS[levelIndex];
  }

  spawnPattern(startX) {
    const lowWidth = this.randomWidth();
    this.create(startX, lowWidth, 0);

    if (Math.random() < GAME_CONFIG.PLATFORM_STAIR_CHANCE) {
      // Staircase: level 3 starts halfway along level 2 and runs past it
      const highX = startX + lowWidth * 0.5;
      const highWidth = this.randomWidth();
      this.create(highX, highWidth, 1);
      this.onReward?.(highX + highWidth * 0.6, this.topForLevel(1) - 30);
    }
  }

  create(left, width, levelIndex) {
    const top = this.topForLevel(levelIndex);
    const height = GAME_CONFIG.PLATFORM_HEIGHT;

    const c = new Container();
    c.position.set(left, top);

    const ice = new TilingSprite({
      texture: this.assetLoader.getTexture('platform'),
      width,
      height,
    });
    ice.tileScale.set(2, 2);
    c.addChild(ice);

    // Dark pixel end caps in the tile's outline colour. The icicles are part of the
    // designer's platform tile (one per tile), so no extra ones are drawn here.
    const deco = new Graphics()
      .rect(0, 0, 2, height)
      .fill(0x080d30)
      .rect(width - 2, 0, 2, height)
      .fill(0x080d30);
    c.addChild(deco);

    this.container.addChild(c);
    this.platforms.push({ container: c, left, width, top, levelIndex });
    this.onCreate?.(left, width, top);
    return this.platforms[this.platforms.length - 1];
  }

  /** Plain geometry for player physics: [{ left, right, top }] */
  getSurfaces() {
    return this.platforms.map((p) => ({
      left: p.left,
      right: p.left + p.width,
      top: p.top,
    }));
  }

  /** True if any platform spans this world x (used to keep pickups out of ledges) */
  coversX(x, margin = 24) {
    return this.platforms.some(
      (p) => x > p.left - margin && x < p.left + p.width + margin
    );
  }

  /**
   * True if an obstacle spanning [left, right] would sit under a platform,
   * too close before it, or inside the run-out after it.
   */
  blocksObstacle(left, right, scrollSpeed) {
    const before = GAME_CONFIG.PLATFORM_CLEARANCE_BEFORE;
    const after = GAME_CONFIG.PLATFORM_CLEARANCE_AFTER_TIME * scrollSpeed;
    return this.platforms.some(
      (p) => right > p.left - before && left < p.left + p.width + after
    );
  }

  update(dt, scrollSpeed, viewWidth) {
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      p.left -= scrollSpeed * dt;
      p.container.x = p.left;
      if (p.left + p.width < -40) {
        p.container.destroy({ children: true });
        this.platforms.splice(i, 1);
      }
    }

    this.timer -= dt;
    if (this.timer <= 0) {
      const startX = viewWidth + 60;
      if (this.canSpawnAt && !this.canSpawnAt(startX - GAME_CONFIG.PLATFORM_CLEARANCE_BEFORE)) {
        this.timer = 0.2; // an obstacle is still in the way; retry shortly
        return;
      }
      this.spawnPattern(startX);
      this.timer =
        GAME_CONFIG.PLATFORM_MIN_INTERVAL +
        Math.random() *
          (GAME_CONFIG.PLATFORM_MAX_INTERVAL - GAME_CONFIG.PLATFORM_MIN_INTERVAL);
    }
  }
}
