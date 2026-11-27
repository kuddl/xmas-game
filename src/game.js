import { Application, Container } from 'pixi.js';
import { GAME_CONFIG } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacle.js';
import { PowerUpManager } from './powerups.js';
import { EffectsManager } from './effects.js';
import { PlatformManager } from './platforms.js';
import { CoinManager } from './coins.js';
import { CreativeModeEffect, MushroomManager } from './mushrooms.js';
import { TutorialDirector } from './tutorial.js';
import { UIManager } from './ui.js';
import { OnlineLeaderboard } from './online/client.js';
import { seedRng } from './rng.js';

/** typing into the claim form must not jump, pause or start a run */
const isTyping = (e) => e.target instanceof HTMLElement && (e.target.matches('input, textarea, select') || e.target.isContentEditable);

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
    this.duckPointers = new Set(); // active touches holding the left (duck) zone
    this.isTouch = null;

    this.app = null;
    this.worldContainer = null;
    this.viewWidth = 640;
  }

  async init() {
    this.app = new Application();
    await this.app.init({
      resizeTo: this.container,
      background: '#0b1630', // night sky behind the canvas (postal-sky.png)
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
    this.mushrooms = new MushroomManager(this.assetLoader, this.worldContainer);
    this.creative = new CreativeModeEffect(this.worldContainer);
    this.pendingCloud = -1; // seconds until a coin cloud spawns (-1 = none)
    this.cloudZone = null; // { left, right } in world x while a coin cloud is on screen
    this.inProduction = false;
    this.obstacles.onGap = (x, gapPx, obstacle) => {
      const placedMushroom = this.mushrooms.onObstacleGap(x, gapPx, {
        inProduction: this.inProduction,
        effectActive: this.creative.active,
        isBlocked: (px) => this.platforms.coversX(px) || this.inCloudZone(px, px),
      });
      if (!placedMushroom) {
        this.powerups.onObstacleGap(x, gapPx, (px) => this.platforms.coversX(px));
      }
      this.coins.onObstacle(obstacle, gapPx);
    };
    this.platforms.onReward = (x, y) => this.powerups.spawnReward(x, y);
    this.platforms.onCreate = (left, width, top) =>
      this.tutorial?.active
        ? this.coins.rowOnPlatform(left, width, top) // scripted track: always show coins
        : this.coins.onPlatform(left, width, top);
    // Spacing rules: no obstacles under/next to platforms or the coin cloud, no platform over an obstacle
    this.obstacles.isBlocked = (left, right, speed) =>
      this.platforms.blocksObstacle(left, right, speed) || this.inCloudZone(left, right);
    this.platforms.canSpawnAt = (x) =>
      this.obstacles.rightmostEdge() < x && !this.inCloudZone(x, x + 400);
    this.storyPoints = 0;

    const icons = {};
    for (const [type, def] of Object.entries(GAME_CONFIG.POWERUPS)) {
      icons[type] = this.assetLoader.getSpriteMeta(def.sprite)?.path;
    }
    this.ui.setPowerUpIcons(icons);

    // Tutorial: on by default until it has been completed once in this browser
    this.tutorial = new TutorialDirector(this);
    const spriteIcons = {};
    for (const key of ['obstacle', 'coin', 'obstacleFlyer', 'platform', 'powerupMerkle', 'powerupArc']) {
      const meta = this.assetLoader.getSpriteMeta(key);
      if (meta) spriteIcons[key] = { path: meta.path, frames: meta.frames || 0 };
    }
    this.ui.setSpriteIcons(spriteIcons);
    this.ui.tutorialChecked = !TutorialDirector.isDone();

    // Online leaderboard (ticket 024): best-effort, the game works offline as before
    this.online = new OnlineLeaderboard();
    this.checkpointClock = 0;
    this.refreshOnline();
    this.online.prepare();

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
    // Start in touch mode on phones/tablets; any key press switches back to keyboard wording
    this.setTouchMode(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    // Same query as the CSS rotate hint: turning the phone to portrait pauses the run
    this.portraitQuery = window.matchMedia('(orientation: portrait) and (max-width: 820px)');
    this.portraitQuery.addEventListener('change', (e) => {
      if (e.matches && this.isTouch) this.setPaused(true);
    });

    window.addEventListener('keydown', (e) => {
      if (isTyping(e)) return;
      this.setTouchMode(false);
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (!e.repeat) this.togglePause();
        return;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (this.state === 'INTRO') {
          this.continueTutorial();
        } else if (this.state === 'START') {
          this.startRun();
        } else if (this.state === 'PLAYING' && !e.repeat) {
          this.player.queueJump();
        }
        // GAME_OVER: deliberately nothing (players are still mashing SPACE), use the buttons
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
      if (isTyping(e)) return;
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

    this.app.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    // Long-press would open the context menu on mobile
    this.app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.ui.btnPause.addEventListener('click', () => this.togglePause());

    this.ui.btnStart.addEventListener('click', () => this.startRun());
    this.ui.btnRestart.addEventListener('click', () => this.startRun());
    this.ui.btnLbRestart.addEventListener('click', () => this.startRun());
    this.ui.btnLeaderboard.addEventListener('click', () => this.ui.showLeaderboard(true));
    this.ui.btnLbBack.addEventListener('click', () => this.ui.showLeaderboard(false));
    this.ui.btnResume.addEventListener('click', () => this.setPaused(false));
    this.ui.tutOverlay.addEventListener('pointerdown', () => this.continueTutorial());

    // Auto-pause when the tab or window loses focus (prevents stuck keys and unfair deaths)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.setPaused(true);
    });
    window.addEventListener('blur', () => this.setPaused(true));
  }

  togglePause() {
    this.setPaused(this.state === 'PLAYING');
  }

  releaseKeys() {
    this.keys.left = false;
    this.keys.right = false;
    this.keys.down = false;
    this.duckPointers.clear();
  }

  /**
   * Touch: hold the LEFT half = duck / drop / fast-fall, tap the RIGHT half = jump.
   * Mouse: a click anywhere jumps.
   */
  onPointerDown(e) {
    if (e.pointerType === 'touch') this.setTouchMode(true);
    if (this.state !== 'PLAYING') return;

    if (e.pointerType === 'touch' && e.clientX < window.innerWidth / 2) {
      this.duckPointers.add(e.pointerId);
      this.keys.down = true;
    } else {
      this.player.queueJump();
    }
  }

  onPointerUp(e) {
    if (this.duckPointers.delete(e.pointerId) && this.duckPointers.size === 0) {
      this.keys.down = false;
    }
  }

  /** Switches all on-screen hints between keyboard and touch wording */
  setTouchMode(isTouch) {
    if (this.isTouch === isTouch) return;
    this.isTouch = isTouch;
    this.ui.setTouchMode(isTouch);
  }

  /** Freeze the game for a tutorial spotlight card */
  enterIntro() {
    this.state = 'INTRO';
    this.releaseKeys();
  }

  continueTutorial() {
    if (this.state !== 'INTRO') return;
    if (!this.tutorial.tryContinue()) return;
    this.state = 'PLAYING';
    this.releaseKeys();
    // Finished once: next start defaults to no tutorial
    if (!this.tutorial.active) this.ui.tutorialChecked = false;
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
    // seeded run: the online leaderboard hands out the seed (null offline -> random)
    seedRng(this.online.begin());
    this.checkpointClock = 0;
    this.state = 'PLAYING';
    this.distanceMeters = 0;
    this.elapsedTime = 0;
    this.player.reset();
    this.obstacles.reset();
    this.powerups.reset();
    this.platforms.reset();
    this.coins.reset();
    this.mushrooms.reset();
    this.creative.reset();
    this.pendingCloud = -1;
    this.cloudZone = null;
    this.inProduction = false;
    this.storyPoints = 0;
    this.ui.hideSpotlight();
    if (this.ui.tutorialChecked) {
      this.tutorial.start();
    } else {
      this.tutorial.stop();
    }
    this.effects.clear();
    this.ui.clearPowerUps();
    this.shakeTime = 0;
    this.worldContainer.position.set(0, 0);
    this.ui.showPlayingHUD();
    this.ui.updateHUD({
      distanceMeters: 0,
      elapsedTime: 0,
      inProduction: false,
      score: 0,
    });
  }

  /** SCORE = meters + story points x factor (decision #3) */
  get score() {
    return Math.floor(this.distanceMeters) + this.storyPoints * GAME_CONFIG.SP_SCORE_FACTOR;
  }

  triggerGameOver(causeWord) {
    this.state = 'GAME_OVER';
    this.tutorial.stop();
    this.player.setPowerVisual(null);
    this.ui.clearPowerUps();
    this.worldContainer.position.set(0, 0);
    this.ui.showGameOver({
      score: this.score,
      distanceMeters: this.distanceMeters,
      elapsedTime: this.elapsedTime,
      causeWord,
      storyPoints: this.storyPoints,
    });
    this.finishOnlineRun();
  }

  async refreshOnline() {
    const data = await this.online.refresh();
    if (data.ok) this.ui.setOnlineLeaderboard(data.entries);
  }

  /** final checkpoint; a top-20 run may then be claimed on the game-over screen */
  async finishOnlineRun() {
    const res = await this.online.checkpoint(this.distanceMeters, this.storyPoints, true);
    this.online.prepare(); // token for the next run
    if (this.state !== 'GAME_OVER') return;
    if (res?.ok && res.claimable) {
      this.ui.showClaim({
        rank: res.rank,
        seconds: res.claimSeconds,
        onSubmit: (email, nickname) => this.online.claim(email, nickname),
      });
    }
    this.refreshOnline();
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
    if (this.state === 'PAUSED' || this.state === 'INTRO') return; // scene stays rendered, nothing moves
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
    this.inProduction = inProduction;

    this.elapsedTime += dt;
    this.distanceMeters += (scrollSpeed * dt) / GAME_CONFIG.PIXELS_PER_METER;

    // online checkpoint every few seconds (the server checks it against its own clock)
    this.checkpointClock += dt;
    if (this.checkpointClock >= GAME_CONFIG.ONLINE.CHECKPOINT_SECONDS) {
      this.checkpointClock = 0;
      this.online.checkpoint(this.distanceMeters, this.storyPoints);
    }

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
    this.mushrooms.update(dt, scrollSpeed, inProduction);
    this.creative.update(dt);
    this.updateCoinCloud(dt, scrollSpeed);

    // Scripted MVP onboarding: spawn elements and freeze for spotlight cards
    if (this.tutorial.update(this.distanceMeters)) {
      this.enterIntro();
      return;
    }

    this.powerups.update(dt, scrollSpeed);

    // Collect power-ups
    const hitbox = this.player.getHitbox();
    const collected = this.powerups.checkPickup(hitbox);
    if (collected) {
      const def = GAME_CONFIG.POWERUPS[collected.type];
      this.powerups.activate(collected.type);
      this.effects.burst(collected.x, collected.y, def.color, 24, 190);
      this.ui.showToast(`${def.label}! ${def.hint}`, def.cssColor);
      // Arc double jump: a coin cloud high up, only reachable with the second jump
      if (collected.type === 'doubleJump') this.pendingCloud = GAME_CONFIG.COIN_CLOUD.DELAY;
      if (this.tutorial.onPowerUpCollected(collected.type)) {
        this.enterIntro();
        return;
      }
    }

    this.updatePowerUpVisuals(dt);

    // Collect Story Points
    const coinsHit = this.coins.collect(hitbox);
    if (coinsHit.length > 0) {
      this.storyPoints += coinsHit.length;
      for (const c of coinsHit) this.effects.burst(c.x, c.y, 0xf5b82e, 6, 90);
      this.ui.updateStoryPoints(this.storyPoints);
    }

    // Creative-mode mushroom: harmless, only changes the look (also during Breakthrough)
    const shroom = this.mushrooms.collect(hitbox);
    if (shroom) {
      const cm = GAME_CONFIG.CREATIVE_MODE;
      this.creative.trigger();
      this.effects.burst(shroom.x, shroom.y, 0xe8458b, 18, 150);
      this.ui.showToast(`${cm.label}! ${cm.hint}`, cm.cssColor);
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
          // every smashed block pays out story points
          const sp = GAME_CONFIG.BREAKTHROUGH_SMASH_SP;
          this.storyPoints += sp;
          this.ui.updateStoryPoints(this.storyPoints);
          this.effects.burst(pos.x, pos.y - 20, 0xf5b82e, 8, 110);
          this.effects.floatText(pos.x, pos.y - 34, `+${sp} SP`);
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
      score: this.score,
    });
    this.ui.updatePowerUps(this.powerups.getActiveList());
    this.applyScreenShake(dt);
  }

  /** Coin-cloud bookkeeping (#17): delayed spawn and the obstacle-free zone below it */
  updateCoinCloud(dt, scrollSpeed) {
    if (this.cloudZone) {
      this.cloudZone.left -= scrollSpeed * dt;
      this.cloudZone.right -= scrollSpeed * dt;
      if (this.cloudZone.right < -40) this.cloudZone = null;
    }
    if (this.pendingCloud < 0) return;
    this.pendingCloud -= dt;
    if (this.pendingCloud > 0) return;

    const cfg = GAME_CONFIG.COIN_CLOUD;
    const x = Math.min(this.viewWidth + 80, this.player.x + cfg.LEAD_PX);
    if (this.platforms.coversX(x, 140)) {
      this.pendingCloud = 0.1; // an ice platform is in the way: try again in a moment
      return;
    }
    this.pendingCloud = -1;
    const box = this.coins.cloudAt(x);
    // Keep the ground below free so the landing after the double jump is safe.
    // MVP: landing on a block is harmless anyway, and the tutorial's practice blocks stay.
    this.cloudZone = { left: box.left - 90, right: box.right + 140 };
    if (this.inProduction) {
      this.obstacles.clearRange(this.cloudZone.left, this.cloudZone.right, (pos) =>
        this.effects.burst(pos.x, pos.y, 0xffffff, 10, 120)
      );
    }
    this.effects.burst(x, box.top + 20, 0xffffff, 22, 170);
  }

  inCloudZone(left, right) {
    return !!this.cloudZone && right > this.cloudZone.left && left < this.cloudZone.right;
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
