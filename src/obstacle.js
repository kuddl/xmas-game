import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class ObstacleManager {
  constructor(assetLoader, scene) {
    this.assetLoader = assetLoader;
    this.scene = scene;
    this.obstacles = [];
    this.spawnTimer = GAME_CONFIG.FIRST_OBSTACLE_DELAY;
    this.wordBag = [];

    this.blockGeometry = new THREE.PlaneGeometry(
      GAME_CONFIG.OBSTACLE_WIDTH,
      GAME_CONFIG.OBSTACLE_HEIGHT
    );
    this.signGeometry = new THREE.PlaneGeometry(2.35, 0.58);
    this.postGeometry = new THREE.PlaneGeometry(0.12, 0.35);
    this.postMaterial = new THREE.MeshBasicMaterial({ color: 0x16243d });
  }

  reset() {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.group);
    }
    this.obstacles = [];
    this.spawnTimer = GAME_CONFIG.FIRST_OBSTACLE_DELAY;
    this.wordBag = [];
  }

  nextBuzzword() {
    if (this.wordBag.length === 0) {
      this.wordBag = [...GAME_CONFIG.BUZZWORDS];
      // Fisher-Yates shuffle for fair variety
      for (let i = this.wordBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.wordBag[i], this.wordBag[j]] = [this.wordBag[j], this.wordBag[i]];
      }
    }
    return this.wordBag.pop();
  }

  spawn(spawnX) {
    const word = this.nextBuzzword();
    const group = new THREE.Group();

    const blockMat = new THREE.MeshBasicMaterial({
      map: this.assetLoader.getTexture('obstacle'),
      transparent: true,
      alphaTest: 0.1,
    });
    const blockMesh = new THREE.Mesh(this.blockGeometry, blockMat);
    blockMesh.position.y = GAME_CONFIG.OBSTACLE_HEIGHT * 0.5;
    blockMesh.position.z = 1.8;

    const postMesh = new THREE.Mesh(this.postGeometry, this.postMaterial);
    postMesh.position.y = GAME_CONFIG.OBSTACLE_HEIGHT + 0.12;
    postMesh.position.z = 1.7;

    const signMat = new THREE.MeshBasicMaterial({
      map: this.assetLoader.getBuzzwordTexture(word),
      transparent: true,
    });
    const signMesh = new THREE.Mesh(this.signGeometry, signMat);
    signMesh.position.y = GAME_CONFIG.OBSTACLE_HEIGHT + 0.52;
    signMesh.position.z = 1.9;

    group.add(blockMesh);
    group.add(postMesh);
    group.add(signMesh);

    group.position.x = spawnX;
    group.position.y = GAME_CONFIG.GROUND_Y;

    this.scene.add(group);

    this.obstacles.push({
      word,
      group,
      blockMat,
      signMat,
      x: spawnX,
      hitInMvp: false,
    });
  }

  update(dt, scrollSpeed, { viewHalfWidth, inProduction, distance }) {
    // Move existing obstacles left
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= scrollSpeed * dt;
      obs.group.position.x = obs.x;

      if (obs.x < -viewHalfWidth - 3.5) {
        this.scene.remove(obs.group);
        obs.blockMat.dispose();
        obs.signMat.dispose();
        this.obstacles.splice(i, 1);
      }
    }

    // Semi-random fair spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const spawnX = viewHalfWidth + 2.5;
      this.spawn(spawnX);

      // Slightly tighter gaps in Production, but always fair
      const prodFactor = inProduction
        ? Math.max(0.75, 1 - (distance - GAME_CONFIG.MVP_DISTANCE_UNITS) / 2500)
        : 1.05;
      const minGap = GAME_CONFIG.OBSTACLE_MIN_GAP_TIME * prodFactor;
      const maxGap = GAME_CONFIG.OBSTACLE_MAX_GAP_TIME * prodFactor;
      this.spawnTimer = minGap + Math.random() * (maxGap - minGap);
    }
  }

  checkCollision(playerHitbox) {
    const halfW = GAME_CONFIG.OBSTACLE_WIDTH * 0.38;
    const height = GAME_CONFIG.OBSTACLE_HEIGHT * 0.86;

    for (const obs of this.obstacles) {
      const left = obs.x - halfW;
      const right = obs.x + halfW;
      const bottom = GAME_CONFIG.GROUND_Y;
      const top = GAME_CONFIG.GROUND_Y + height;

      const overlaps =
        playerHitbox.right > left &&
        playerHitbox.left < right &&
        playerHitbox.top > bottom &&
        playerHitbox.bottom < top;

      if (overlaps) {
        return obs;
      }
    }
    return null;
  }

  markSafeHit(obs) {
    obs.hitInMvp = true;
    obs.blockMat.opacity = 0.45;
    obs.signMat.opacity = 0.45;
  }
}
