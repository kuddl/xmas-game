import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacle.js';
import { UIManager } from './ui.js';

export class Game {
  constructor(assetLoader) {
    this.assetLoader = assetLoader;
    this.ui = new UIManager();
    this.container = document.getElementById('canvas-container');

    this.state = 'START'; // START | PLAYING | GAME_OVER
    this.distance = 0;
    this.elapsedTime = 0;
    this.keys = {
      left: false,
      right: false,
    };

    this.initThree();

    this.world = new World(assetLoader, this.scene);
    this.player = new Player(assetLoader);
    this.scene.add(this.player.group);
    this.obstacles = new ObstacleManager(assetLoader, this.scene);

    this.bindEvents();
    this.ui.showStartScreen();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  initThree() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;
    const halfH = GAME_CONFIG.WORLD_HEIGHT / 2;
    const halfW = halfH * aspect;

    this.viewHalfWidth = halfW;
    this.camera = new THREE.OrthographicCamera(
      -halfW,
      halfW,
      halfH,
      -halfH,
      0.1,
      50
    );
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);
  }

  onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;
    const halfH = GAME_CONFIG.WORLD_HEIGHT / 2;
    const halfW = halfH * aspect;

    this.viewHalfWidth = halfW;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    window.addEventListener('keydown', (e) => {
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
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = false;
      }
    });

    // Touch / click jump during gameplay
    this.renderer.domElement.addEventListener('pointerdown', () => {
      if (this.state === 'PLAYING') {
        this.player.queueJump();
      }
    });

    this.ui.btnStart.addEventListener('click', () => this.startRun());
    this.ui.btnRestart.addEventListener('click', () => this.startRun());
  }

  startRun() {
    this.state = 'PLAYING';
    this.distance = 0;
    this.elapsedTime = 0;
    this.player.reset();
    this.obstacles.reset();
    this.ui.showPlayingHUD();
    this.ui.updateHUD({
      distance: 0,
      elapsedTime: 0,
      inProduction: false,
    });
  }

  triggerGameOver(causeWord) {
    this.state = 'GAME_OVER';
    this.ui.showGameOver({
      score: this.distance * GAME_CONFIG.METERS_PER_UNIT,
      elapsedTime: this.elapsedTime,
      causeWord,
    });
  }

  getSpeedInfo() {
    const inProduction = this.distance >= GAME_CONFIG.MVP_DISTANCE_UNITS;
    let baseSpeed = GAME_CONFIG.BASE_SCROLL_SPEED;

    if (inProduction) {
      const prodDist = this.distance - GAME_CONFIG.MVP_DISTANCE_UNITS;
      baseSpeed = Math.min(
        GAME_CONFIG.MAX_SCROLL_SPEED,
        baseSpeed + (prodDist / 100) * GAME_CONFIG.PROD_SPEED_RAMP_PER_100M
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

  update(dt) {
    if (this.state === 'START') {
      // Gentle attract-mode scrolling in blurred background
      const idleSpeed = GAME_CONFIG.BASE_SCROLL_SPEED * 0.45;
      this.world.update(dt, idleSpeed, {
        distance: 0,
        playerX: this.player.x,
      });
      this.player.update(dt, {
        moveDir: 0,
        speedMultiplier: 0.6,
        isPlaying: false,
      });
      return;
    }

    if (this.state === 'GAME_OVER') {
      // Only gentle snowfall keeps moving
      this.world.update(dt, 0, {
        distance: this.distance,
        playerX: this.player.x,
      });
      return;
    }

    // PLAYING state
    const { inProduction, moveDir, speedMultiplier, scrollSpeed } =
      this.getSpeedInfo();

    this.elapsedTime += dt;
    this.distance += scrollSpeed * dt;

    this.world.update(dt, scrollSpeed, {
      distance: this.distance,
      playerX: this.player.x,
    });

    this.player.update(dt, {
      moveDir,
      speedMultiplier,
      isPlaying: true,
    });

    this.obstacles.update(dt, scrollSpeed, {
      viewHalfWidth: this.viewHalfWidth,
      inProduction,
      distance: this.distance,
    });

    // Collision check
    const hitObstacle = this.obstacles.checkCollision(this.player.getHitbox());
    if (hitObstacle) {
      if (!inProduction) {
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
      distance: this.distance,
      elapsedTime: this.elapsedTime,
      inProduction,
    });
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.loop);
  }
}
