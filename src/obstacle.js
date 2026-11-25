import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { GAME_CONFIG } from './config.js';

export class ObstacleManager {
  constructor(assetLoader, parentContainer) {
    this.assetLoader = assetLoader;
    this.container = new Container();
    this.container.zIndex = 15;
    parentContainer.addChild(this.container);

    this.obstacles = [];
    this.spawnTimer = GAME_CONFIG.FIRST_OBSTACLE_DELAY;
    this.wordBag = [];
  }

  reset() {
    for (const obs of this.obstacles) {
      obs.container.destroy({ children: true });
    }
    this.obstacles = [];
    this.spawnTimer = GAME_CONFIG.FIRST_OBSTACLE_DELAY;
    this.wordBag = [];
  }

  nextBuzzword() {
    if (this.wordBag.length === 0) {
      this.wordBag = [...GAME_CONFIG.BUZZWORDS];
      for (let i = this.wordBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.wordBag[i], this.wordBag[j]] = [this.wordBag[j], this.wordBag[i]];
      }
    }
    return this.wordBag.pop();
  }

  spawn(spawnX) {
    const word = this.nextBuzzword();
    const obsContainer = new Container();
    obsContainer.position.set(spawnX, GAME_CONFIG.GROUND_Y);

    // Obstacle block sprite (24x24 -> 48x48 @ 2x pixel scale)
    const blockTex = this.assetLoader.getTexture('obstacle');
    const blockSprite = new Sprite(blockTex);
    blockSprite.anchor.set(0.5, 1);
    blockSprite.width = GAME_CONFIG.OBSTACLE_WIDTH;
    blockSprite.height = GAME_CONFIG.OBSTACLE_HEIGHT;
    obsContainer.addChild(blockSprite);

    // Sign post + retro pixel sign board
    const signWidth = Math.max(70, word.length * 7.5 + 16);
    const signHeight = 20;
    const signBottomY = -GAME_CONFIG.OBSTACLE_HEIGHT - 8;

    const signGraphics = new Graphics()
      // Post
      .rect(-2, -GAME_CONFIG.OBSTACLE_HEIGHT - 9, 4, 11)
      .fill(0x16243d)
      // Outer dark pixel border
      .rect(-signWidth / 2, signBottomY - signHeight, signWidth, signHeight)
      .fill(0x12223a)
      // Snow-white interior
      .rect(
        -signWidth / 2 + 2,
        signBottomY - signHeight + 2,
        signWidth - 4,
        signHeight - 4
      )
      .fill(0xf2f8ff)
      // Festive red top accent bar
      .rect(-signWidth / 2 + 2, signBottomY - signHeight + 2, signWidth - 4, 3)
      .fill(0xe02f40);
    obsContainer.addChild(signGraphics);

    // Buzzword label using native PixiJS v8 Text
    const label = new Text({
      text: word,
      style: {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: 7,
        fontWeight: 'bold',
        fill: 0xb81d2c,
      },
    });
    label.anchor.set(0.5, 0.5);
    label.position.set(0, signBottomY - signHeight / 2 + 1.5);
    obsContainer.addChild(label);

    this.container.addChild(obsContainer);

    this.obstacles.push({
      word,
      container: obsContainer,
      x: spawnX,
      hitInMvp: false,
    });
  }

  update(dt, scrollSpeed, { viewWidth, inProduction, distanceMeters }) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= scrollSpeed * dt;
      obs.container.x = obs.x;

      if (obs.x < -120) {
        obs.container.destroy({ children: true });
        this.obstacles.splice(i, 1);
      }
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const spawnX = viewWidth + 90;
      this.spawn(spawnX);

      const prodFactor = inProduction
        ? Math.max(
            0.75,
            1 - (distanceMeters - GAME_CONFIG.MVP_DISTANCE_METERS) / 2500
          )
        : 1.05;
      const minGap = GAME_CONFIG.OBSTACLE_MIN_GAP_TIME * prodFactor;
      const maxGap = GAME_CONFIG.OBSTACLE_MAX_GAP_TIME * prodFactor;
      this.spawnTimer = minGap + Math.random() * (maxGap - minGap);
    }
  }

  checkCollision(playerHitbox) {
    const halfW = GAME_CONFIG.OBSTACLE_WIDTH * 0.36;
    const height = GAME_CONFIG.OBSTACLE_HEIGHT * 0.84;

    for (const obs of this.obstacles) {
      const left = obs.x - halfW;
      const right = obs.x + halfW;
      const top = GAME_CONFIG.GROUND_Y - height;
      const bottom = GAME_CONFIG.GROUND_Y;

      const overlaps =
        playerHitbox.right > left &&
        playerHitbox.left < right &&
        playerHitbox.bottom > top &&
        playerHitbox.top < bottom;

      if (overlaps) {
        return obs;
      }
    }
    return null;
  }

  markSafeHit(obs) {
    obs.hitInMvp = true;
    obs.container.alpha = 0.45;
  }
}
