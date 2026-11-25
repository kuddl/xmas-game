import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class Player {
  constructor(assetLoader) {
    this.meta = assetLoader.getSpriteMeta('player');
    const baseTexture = assetLoader.getTexture('player');
    this.texture = baseTexture.clone();
    this.texture.needsUpdate = true;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.totalFrames = this.meta?.frames || 4;
    this.runFrames = this.meta?.animations?.run?.frames || [0, 1, 2, 1];
    this.runFps = this.meta?.animations?.run?.fps || 10;
    this.jumpFrame = this.meta?.animations?.jump?.frames?.[0] ?? 3;

    this.texture.repeat.set(1 / this.totalFrames, 1);
    this.texture.offset.set(0, 0);

    const size = GAME_CONFIG.PLAYER_SIZE;
    const geometry = new THREE.PlaneGeometry(size, size);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      alphaTest: 0.1,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.z = 2;

    // Ground shadow oval under player
    const shadowGeo = new THREE.PlaneGeometry(size * 0.72, size * 0.14);
    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f2b4c,
      transparent: true,
      opacity: 0.35,
    });
    this.shadow = new THREE.Mesh(shadowGeo, this.shadowMat);
    this.shadow.position.z = 1.5;

    this.group = new THREE.Group();
    this.group.add(this.shadow);
    this.group.add(this.mesh);

    this.reset();
  }

  get groundCenterY() {
    return GAME_CONFIG.GROUND_Y + GAME_CONFIG.PLAYER_SIZE * 0.5;
  }

  reset() {
    this.x = GAME_CONFIG.PLAYER_BASE_X;
    this.y = this.groundCenterY;
    this.vy = 0;
    this.isGrounded = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.animTimer = 0;
    this.animIndex = 0;
    this.flashTimer = 0;
    this.material.opacity = 1;
    this.material.color.setHex(0xffffff);
    this.syncMesh();
  }

  queueJump() {
    this.jumpBufferTimer = GAME_CONFIG.JUMP_BUFFER_TIME;
  }

  triggerSafeHit() {
    this.flashTimer = 0.55;
    // Slight playful hop if grounded
    if (this.isGrounded) {
      this.vy = GAME_CONFIG.JUMP_VELOCITY * 0.35;
      this.isGrounded = false;
    }
  }

  update(dt, { moveDir = 0, speedMultiplier = 1, isPlaying = true } = {}) {
    // Horizontal subtle adjustment with Left/Right keys
    if (isPlaying) {
      if (moveDir !== 0) {
        this.x += moveDir * GAME_CONFIG.PLAYER_NUDGE_SPEED * dt;
      } else {
        // Gently drift back toward base X
        const diff = GAME_CONFIG.PLAYER_BASE_X - this.x;
        this.x += diff * Math.min(1, dt * 2.5);
      }
      this.x = THREE.MathUtils.clamp(
        this.x,
        GAME_CONFIG.PLAYER_MIN_X,
        GAME_CONFIG.PLAYER_MAX_X
      );
    }

    // Coyote time & jump buffer
    if (this.isGrounded) {
      this.coyoteTimer = GAME_CONFIG.COYOTE_TIME;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
      if (this.coyoteTimer > 0) {
        this.vy = GAME_CONFIG.JUMP_VELOCITY;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
      }
    }

    // Vertical physics
    this.vy += GAME_CONFIG.GRAVITY * dt;
    this.y += this.vy * dt;

    if (this.y <= this.groundCenterY) {
      this.y = this.groundCenterY;
      this.vy = 0;
      this.isGrounded = true;
    }

    // Sprite frame animation
    if (!this.isGrounded) {
      this.setFrame(this.jumpFrame);
    } else {
      this.animTimer += dt * this.runFps * speedMultiplier;
      this.animIndex = Math.floor(this.animTimer) % this.runFrames.length;
      this.setFrame(this.runFrames[this.animIndex]);
    }

    // MVP safe-hit blink feedback
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
      const blink = Math.floor(this.flashTimer * 18) % 2 === 0;
      this.material.color.setHex(blink ? 0x99ffbb : 0xffffff);
      this.material.opacity = blink ? 0.75 : 1;
    } else {
      this.material.color.setHex(0xffffff);
      this.material.opacity = 1;
    }

    this.syncMesh();
  }

  setFrame(frameIndex) {
    this.texture.offset.x = frameIndex / this.totalFrames;
  }

  syncMesh() {
    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y;

    const heightAboveGround = Math.max(0, this.y - this.groundCenterY);
    const shadowScale = Math.max(0.4, 1 - heightAboveGround * 0.14);
    this.shadow.position.x = this.x;
    this.shadow.position.y = GAME_CONFIG.GROUND_Y + 0.06;
    this.shadow.scale.set(shadowScale, 1, 1);
    this.shadowMat.opacity = 0.35 * shadowScale;
  }

  /**
   * Forgiving hitbox (slightly inset from visual sprite bounds)
   */
  getHitbox() {
    const halfW = GAME_CONFIG.PLAYER_SIZE * 0.28;
    const halfH = GAME_CONFIG.PLAYER_SIZE * 0.38;
    return {
      left: this.x - halfW,
      right: this.x + halfW,
      bottom: this.y - GAME_CONFIG.PLAYER_SIZE * 0.45,
      top: this.y + halfH,
    };
  }
}
