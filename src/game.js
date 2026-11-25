import { Application, Container } from 'pixi.js';
import { GAME_CONFIG } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacle.js';
import { PowerUpManager } from './powerups.js';
import { EffectsManager } from './effects.js';
import { PlatformManager } from './platforms.js';
import { CoinManager } from './coins.js';
import { UIManager } from './ui.js';

export class Game {
  constructor(assetLoader) {
    this.assetLoader = assetLoader;
    this.ui = new UIManager();
    this.container = document.getElementById('canvas-container');

    this.state = 'START'; // START | PLAYING | GAME_OVER
    this.distanceMeters = 0;
    this.elapsedTime = 0;
    this.keys = {
      left: false,
      right: false,
      down: false,
    };

    this.app = null;
    this.worldContainer = null;
    this.viewWidth = 640;
  }

  async init() {
    this.app = new Application();
    await this.app.init({
      resizeTo: this.container,
      background: '#3a8ad6',
      antialias: false,
      roundPixels: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });

    this.container.appendChild(this.app.canvas);

    this.worldContainer = new Container();
    this.worldContainer.sortableChildren = true;
    this.app.stage.addChild(this.worldContainer);

    this.computeScale(this.app.screen.width, this.app.screen.height);

    this.world = new World(this.assetLoader, this.worldContainer, this.viewWidth);
    this.player = new Player(this.assetLoader);
    this.worldContainer.addChild(this.player.container);
    this.obstacles = new ObstacleManager(this.assetLoader, this.worldContainer);
    this.powerups = new PowerUpManager(this.assetLoader, this.worldContainer);
    this.effects = new EffectsManager(this.assetLoader, this.worldContainer);
    this.platforms = new PlatformManager(this.assetLoader, this.worldContainer);
    this.coins = new CoinManager(this.assetLoader, this.worldContainer);
    this.obstacles.onGap = (x, gapPx, obstacle) => {
      this.powerups.onObstacleGap(x, gapPx, (px) => this.platforms.coversX(px));
      this.coins.onObstacle(obstacle, gapPx);
    };
    this.platforms.onReward = (x, y) => this.powerups.spawnReward(x, y);
    this.platforms.onCreate = (left, width, top) => this.coins.onPlatform(left, width, top);
    this.storyPoints = 0;

    const icons = {};
    for (const [type, def] of Object.entries(GAME_CONFIG.POWERUPS)) {
      icons[type] = this.assetLoader.getSpriteMeta(def.sprite)?.path;
    }
    this.ui.setPowerUpIcons(icons);

    this.shakeTime = 0;
    this.auraEmitAccumulator = 0;

    this.app.renderer.on('resize', (width, height) => {
      this.computeScale(width, height);
      this.world.resize(this.viewWidth);
    });

    this.resizeObserver = new ResizeObserver(() => this.app.queueResize());
    this.resizeObserver.observe(this.container);

    this.bindEvents();
    this.ui.showStartScreen();

    this.app.ticker.add((ticker) => this.update(ticker));
  }

  computeScale(screenWidth, screenHeight) {
    const safeH = Math.max(1, screenHeight);
    const scale = safeH / GAME_CONFIG.VIRTUAL_HEIGHT;
    this.worldContainer.scale.set(scale);
    this.viewWidth = screenWidth / scale;
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (!e.repeat) this.togglePause();
        return;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (this.state === 'START' || this.state === 'GAME_OVER') {
          this.startRun();
        } else if (this.state === 'PLAYING' && !e.repeat) {
          this.player.queueJump();
        }
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = true;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        this.keys.down = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = false;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.keys.down = false;
      }
    });

    this.app.canvas.addEventListener('pointerdown', () => {
      if (this.state === 'PLAYING') {
        this.player.queueJump();
      }
    });

    this.ui.btnStart.addEventListener('click', () => this.startRun());
    this.ui.btnRestart.addEventListener('click', () => this.startRun());
    this.ui.btnResume.addEventListener('click', () => this.setPaused(false));

    // Auto-pause when the tab or window loses focus (prevents stuck keys and unfair deaths)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.setPaused(true);
    });
    window.addEventListener('blur', () => this.setPaused(true));
  }

  togglePause() {
    this.setPaused(this.state === 'PLAYING');
  }

  setPaused(paused) {
    if (paused && this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (!paused && this.state === 'PAUSED') {
      this.state = 'PLAYING';
    } else {
      return;
    }
    // Release held keys so nothing is stuck after resuming
    this.keys.left = false;
    this.keys.right = false;
    this.keys.down = false;
    this.ui.showPause(paused);
  }

  startRun() {
    this.state = 'PLAYING';
    this.distanceMeters = 0;
    this.elapsedTime = 0;
    this.player.reset();
    this.obstacles.reset();
    this.powerups.reset();
    this.platforms.reset();
    this.coins.reset();
    this.storyPoints = 0;
    this.effects.clear();
    this.ui.clearPowerUps();
    this.shakeTime = 0;
    this.worldContainer.position.set(0, 0);
    this.ui.showPlayingHUD();
    this.ui.updateHUD({
      distanceMeters: 0,
      elapsedTime: 0,
      inProduction: false,
    });
  }

  triggerGameOver(causeWord) {
    this.state = 'GAME_OVER';
    this.player.setPowerVisual(null);
    this.ui.clearPowerUps();
    this.worldContainer.position.set(0, 0);
    this.ui.showGameOver({
      score: this.distanceMeters,
      elapsedTime: this.elapsedTime,
      causeWord,
      storyPoints: this.storyPoints,
    });
  }

  getSpeedInfo() {
    const inProduction = this.distanceMeters >= GAME_CONFIG.MVP_DISTANCE_METERS;
    let baseSpeed = GAME_CONFIG.BASE_SCROLL_SPEED;

    if (inProduction) {
      const prodMeters = this.distanceMeters - GAME_CONFIG.MVP_DISTANCE_METERS;
      baseSpeed = Math.min(
        GAME_CONFIG.MAX_SCROLL_SPEED,
        baseSpeed + (prodMeters / 100) * GAME_CONFIG.PROD_SPEED_RAMP_PER_100M
      );
    }

    let multiplier = 1.0;
    let moveDir = 0;
    if (this.keys.left && !this.keys.right) {
      multiplier = GAME_CONFIG.MIN_SPEED_MULTIPLIER;
      moveDir = -1;
    } else if (this.keys.right && !this.keys.left) {
      multiplier = GAME_CONFIG.MAX_SPEED_MULTIPLIER;
      moveDir = 1;
    }

    return {
      inProduction,
      moveDir,
      speedMultiplier: multiplier,
      scrollSpeed: baseSpeed * multiplier,
    };
  }

  update(ticker) {
    if (this.state === 'PAUSED') return; // scene stays rendered, nothing moves
    const dt = Math.min(0.05, ticker.deltaMS / 1000);
    this.effects.update(dt);

    if (this.state === 'START') {
      const idleSpeed = GAME_CONFIG.BASE_SCROLL_SPEED * 0.45;
      this.world.update(dt, idleSpeed, {
        distanceMeters: 0,
        playerX: this.player.x,
      });
      this.player.update(ticker, dt, {
        moveDir: 0,
        speedMultiplier: 0.6,
        isPlaying: false,
      });
      return;
    }

    if (this.state === 'GAME_OVER') {
      this.world.update(dt, 0, {
        distanceMeters: this.distanceMeters,
        playerX: this.player.x,
      });
      return;
    }

    // PLAYING state
    const { inProduction, moveDir, speedMultiplier, scrollSpeed } =
      this.getSpeedInfo();

    this.elapsedTime += dt;
    this.distanceMeters += (scrollSpeed * dt) / GAME_CONFIG.PIXELS_PER_METER;

    this.world.update(dt, scrollSpeed, {
      distanceMeters: this.distanceMeters,
      playerX: this.player.x,
    });

    this.player.update(ticker, dt, {
      moveDir,
      speedMultiplier,
      isPlaying: true,
      canAirJump: this.powerups.isActive('doubleJump'),
      downHeld: this.keys.down,
      platforms: this.platforms.getSurfaces(),
    });

    if (this.player.justAirJumped) {
      this.effects.burst(
        this.player.x,
        this.player.y,
        GAME_CONFIG.POWERUPS.doubleJump.color,
        14,
        120
      );
    }

    this.obstacles.update(dt, scrollSpeed, {
      viewWidth: this.viewWidth,
      inProduction,
      distanceMeters: this.distanceMeters,
    });
    this.platforms.update(dt, scrollSpeed, this.viewWidth);
    this.coins.update(dt, scrollSpeed);

    this.powerups.update(dt, scrollSpeed);

    // Collect power-ups
    const hitbox = this.player.getHitbox();
    const collected = this.powerups.checkPickup(hitbox);
    if (collected) {
      const def = GAME_CONFIG.POWERUPS[collected.type];
      this.powerups.activate(collected.type);
      this.effects.burst(collected.x, collected.y, def.color, 24, 190);
      this.ui.showToast(`${def.label}! ${def.hint}`, def.cssColor);
    }

    this.updatePowerUpVisuals(dt);

    // Collect Story Points
    const coinsHit = this.coins.collect(hitbox);
    if (coinsHit.length > 0) {
      this.storyPoints += coinsHit.length;
      for (const c of coinsHit) this.effects.burst(c.x, c.y, 0xf5b82e, 6, 90);
      this.ui.updateStoryPoints(this.storyPoints);
    }

    const hitObstacle = this.obstacles.checkCollision(hitbox);
    if (hitObstacle) {
      if (this.powerups.isActive('breakthrough')) {
        // MERKLE BREAKTHROUGH: smash right through the buzzword block
        const pos = this.obstacles.smash(hitObstacle);
        if (pos) {
          this.effects.debris(pos.x, pos.y);
          this.effects.burst(pos.x, pos.y, GAME_CONFIG.POWERUPS.breakthrough.color, 12, 150);
          this.shakeTime = 0.18;
        }
      } else if (!inProduction) {
        if (!hitObstacle.hitInMvp) {
          this.obstacles.markSafeHit(hitObstacle);
          this.player.triggerSafeHit();
          this.ui.showMvpSafeToast(hitObstacle.word);
        }
      } else {
        this.triggerGameOver(hitObstacle.word);
        return;
      }
    }

    this.ui.updateHUD({
      distanceMeters: this.distanceMeters,
      elapsedTime: this.elapsedTime,
      inProduction,
    });
    this.ui.updatePowerUps(this.powerups.getActiveList());
    this.applyScreenShake(dt);
  }

  /** Aura + Asterix-style sparkles for whichever power-up is active */
  updatePowerUpVisuals(dt) {
    const activeList = this.powerups.getActiveList();
    if (activeList.length === 0) {
      this.player.setPowerVisual(null);
      return;
    }

    // Breakthrough takes visual priority; otherwise show the active one
    const primary =
      activeList.find((p) => p.type === 'breakthrough') || activeList[0];
    const def = GAME_CONFIG.POWERUPS[primary.type];
    const warning = primary.remaining <= GAME_CONFIG.POWERUP_WARNING_TIME;
    this.player.setPowerVisual(def.color, warning);

    // ~45 sparkles per second, alternating colors if both are active
    this.auraEmitAccumulator += dt * 45;
    while (this.auraEmitAccumulator >= 1) {
      this.auraEmitAccumulator -= 1;
      const pick = activeList[Math.floor(Math.random() * activeList.length)];
      this.effects.emitAura(
        this.player.x,
        this.player.centerY,
        GAME_CONFIG.POWERUPS[pick.type].color
      );
    }
  }

  applyScreenShake(dt) {
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      const amp = 6 * (this.shakeTime / 0.18);
      this.worldContainer.position.set(
        (Math.random() - 0.5) * amp,
        (Math.random() - 0.5) * amp
      );
    } else if (this.worldContainer.x !== 0 || this.worldContainer.y !== 0) {
      this.worldContainer.position.set(0, 0);
    }
  }
}
