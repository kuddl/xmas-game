import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { GAME_CONFIG } from './config.js';

const LABEL_STYLE = {
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontSize: 7,
  fontWeight: 'bold',
  fill: 0xb81d2c,
};

function shuffled(list) {
  const bag = [...list];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/**
 * Ground blocks (jump over) and flying invites (duck under).
 * Every obstacle stores its own hitbox so collision is shape-agnostic.
 */
export class ObstacleManager {
  constructor(assetLoader, parentContainer) {
    this.assetLoader = assetLoader;
    this.container = new Container();
    this.container.zIndex = 15;
    parentContainer.addChild(this.container);

    this.obstacles = [];
    this.onGap = null; // (obstacleX, gapPx) => void
    this.reset();
  }

  reset() {
    for (const obs of this.obstacles) {
      obs.container.destroy({ children: true });
    }
    this.obstacles = [];
    this.spawnTimer = GAME_CONFIG.FIRST_OBSTACLE_DELAY;
    this.groundWords = [];
    this.flyerWords = [];
    this.lastKind = 'ground';
  }

  nextWord(kind) {
    const key = kind === 'flyer' ? 'flyerWords' : 'groundWords';
    if (this[key].length === 0) {
      this[key] = shuffled(
        kind === 'flyer' ? GAME_CONFIG.FLYER_BUZZWORDS : GAME_CONFIG.BUZZWORDS
      );
    }
    return this[key].pop();
  }

  chooseKind(distanceMeters) {
    if (distanceMeters < GAME_CONFIG.FLYER_START_METERS) return 'ground';
    // Never two flyers in a row: keeps the rhythm readable
    if (this.lastKind === 'flyer') return 'ground';
    return Math.random() < GAME_CONFIG.FLYER_CHANCE ? 'flyer' : 'ground';
  }

  /** Retro sign board: dark border, snow interior, red top accent */
  drawSign(g, centerX, bottomY, width, height) {
    g.rect(centerX - width / 2, bottomY - height, width, height)
      .fill(0x12223a)
      .rect(centerX - width / 2 + 2, bottomY - height + 2, width - 4, height - 4)
      .fill(0xf2f8ff)
      .rect(centerX - width / 2 + 2, bottomY - height + 2, width - 4, 3)
      .fill(0xe02f40);
  }

  spawn(spawnX, kind = 'ground') {
    const obs = kind === 'flyer' ? this.buildFlyer(spawnX) : this.buildGround(spawnX);
    this.container.addChild(obs.container);
    this.obstacles.push(obs);
    this.lastKind = kind;
    return obs;
  }

  buildGround(spawnX) {
    const word = this.nextWord('ground');
    const c = new Container();
    c.position.set(spawnX, GAME_CONFIG.GROUND_Y);

    const block = new Sprite(this.assetLoader.getTexture('obstacle'));
    block.anchor.set(0.5, 1);
    block.width = GAME_CONFIG.OBSTACLE_WIDTH;
    block.height = GAME_CONFIG.OBSTACLE_HEIGHT;
    c.addChild(block);

    const signW = Math.max(70, word.length * 7.5 + 16);
    const signH = 20;
    const signBottom = -GAME_CONFIG.OBSTACLE_HEIGHT - 8;
    const sign = new Graphics()
      .rect(-2, -GAME_CONFIG.OBSTACLE_HEIGHT - 9, 4, 11)
      .fill(0x16243d);
    this.drawSign(sign, 0, signBottom, signW, signH);
    c.addChild(sign);

    const label = new Text({ text: word, style: LABEL_STYLE });
    label.anchor.set(0.5);
    label.position.set(0, signBottom - signH / 2 + 1.5);
    c.addChild(label);

    const halfW = GAME_CONFIG.OBSTACLE_WIDTH * 0.36;
    return {
      kind: 'ground',
      word,
      container: c,
      x: spawnX,
      baseY: GAME_CONFIG.GROUND_Y,
      extraSpeed: 0,
      // hitbox relative to obstacle x
      hit: {
        left: -halfW,
        right: halfW,
        top: GAME_CONFIG.GROUND_Y - GAME_CONFIG.OBSTACLE_HEIGHT * 0.84,
        bottom: GAME_CONFIG.GROUND_Y,
      },
      hitInMvp: false,
      t: 0,
    };
  }

  buildFlyer(spawnX) {
    const word = this.nextWord('flyer');
    const bottomY = GAME_CONFIG.GROUND_Y - GAME_CONFIG.FLYER_BOTTOM_ABOVE_GROUND;
    const c = new Container();
    c.position.set(spawnX, bottomY);

    // Envelope flies left, banner trails behind it on the right
    const envW = 48;
    const envH = 32;
    const bannerW = Math.max(64, word.length * 7.5 + 14);
    const bannerH = 18;
    const ropeLen = 8;

    const banner = new Graphics()
      .rect(envW / 2 - 4, -envH * 0.55, ropeLen + 4, 2)
      .fill(0x12223a);
    this.drawSign(banner, envW / 2 + ropeLen + bannerW / 2, -envH * 0.2, bannerW, bannerH);
    c.addChild(banner);

    const label = new Text({ text: word, style: LABEL_STYLE });
    label.anchor.set(0.5);
    label.position.set(envW / 2 + ropeLen + bannerW / 2, -envH * 0.2 - bannerH / 2 + 1.5);
    c.addChild(label);

    const envelope = new Sprite(this.assetLoader.getTexture('obstacleFlyer'));
    envelope.anchor.set(0.5, 1);
    envelope.width = envW;
    envelope.height = envH;
    c.addChild(envelope);

    return {
      kind: 'flyer',
      word,
      container: c,
      envelope,
      envBaseScaleY: envelope.scale.y,
      x: spawnX,
      baseY: bottomY,
      extraSpeed: GAME_CONFIG.FLYER_EXTRA_SPEED,
      hit: {
        left: -envW * 0.4,
        right: envW / 2 + ropeLen + bannerW - 4,
        top: bottomY - envH * 0.8,
        bottom: bottomY - 2, // envelope art has 2 empty rows (4px) at the bottom
      },
      hitInMvp: false,
      t: Math.random() * 6,
    };
  }

  update(dt, scrollSpeed, { viewWidth, inProduction, distanceMeters }) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= (scrollSpeed + obs.extraSpeed) * dt;
      obs.container.x = obs.x;

      if (obs.kind === 'flyer') {
        obs.t += dt;
        // Gentle visual bob only upward, so the duck gap never shrinks
        obs.container.y = obs.baseY - Math.abs(Math.sin(obs.t * 5)) * 3;
        obs.envelope.scale.y = obs.envBaseScaleY * (1 + Math.sin(obs.t * 18) * 0.06);
      }

      if (obs.x + obs.hit.right < -60) {
        obs.container.destroy({ children: true });
        this.obstacles.splice(i, 1);
      }
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const spawnX = viewWidth + 90;
      const kind = this.chooseKind(distanceMeters);
      this.spawn(spawnX, kind);

      const prodFactor = inProduction
        ? Math.max(0.75, 1 - (distanceMeters - GAME_CONFIG.MVP_DISTANCE_METERS) / 2500)
        : 1.05;
      const minGap = GAME_CONFIG.OBSTACLE_MIN_GAP_TIME * prodFactor;
      const maxGap = GAME_CONFIG.OBSTACLE_MAX_GAP_TIME * prodFactor;
      // Flyers are long: give the player a beat to stand up again
      const flyerBonus = kind === 'flyer' ? 0.35 : 0;
      this.spawnTimer = minGap + flyerBonus + Math.random() * (maxGap - minGap);
      this.onGap?.(spawnX, this.spawnTimer * scrollSpeed);
    }
  }

  checkCollision(playerHitbox) {
    for (const obs of this.obstacles) {
      const left = obs.x + obs.hit.left;
      const right = obs.x + obs.hit.right;
      if (
        playerHitbox.right > left &&
        playerHitbox.left < right &&
        playerHitbox.bottom > obs.hit.top &&
        playerHitbox.top < obs.hit.bottom
      ) {
        return obs;
      }
    }
    return null;
  }

  markSafeHit(obs) {
    obs.hitInMvp = true;
    obs.container.alpha = 0.45;
  }

  /** Remove an obstacle instantly (Breakthrough power-up). Returns its position. */
  smash(obs) {
    const index = this.obstacles.indexOf(obs);
    if (index === -1) return null;
    const pos = { x: obs.x, y: (obs.hit.top + obs.hit.bottom) / 2 };
    obs.container.destroy({ children: true });
    this.obstacles.splice(index, 1);
    return pos;
  }
}
