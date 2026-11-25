import { AnimatedSprite, Container, Graphics } from 'pixi.js';
import { GAME_CONFIG } from './config.js';

export class Player {
  constructor(assetLoader) {
    this.meta = assetLoader.getSpriteMeta('player');
    const allFrames = assetLoader.getFrames('player');

    const runIndices = this.meta?.animations?.run?.frames || [0, 1, 2, 1];
    const jumpIndices = this.meta?.animations?.jump?.frames || [3];
    this.baseRunFps = this.meta?.animations?.run?.fps || 10;

    this.runTextures = runIndices.map((i) => allFrames[i]);
    this.jumpTextures = jumpIndices.map((i) => allFrames[i]);

    this.container = new Container();
    this.container.zIndex = 20;

    // Ground shadow oval under the player's feet
    this.shadow = new Graphics()
      .ellipse(0, 0, GAME_CONFIG.PLAYER_SIZE * 0.34, 4)
      .fill({ color: 0x0f2b4c, alpha: 0.35 });
    this.container.addChild(this.shadow);

    // Pulsing power-up aura (hidden unless a power-up is active)
    this.aura = new Graphics()
      .circle(0, 0, GAME_CONFIG.PLAYER_SIZE * 0.62)
      .fill({ color: 0xffffff, alpha: 0.18 })
      .circle(0, 0, GAME_CONFIG.PLAYER_SIZE * 0.46)
      .fill({ color: 0xffffff, alpha: 0.22 });
    this.aura.visible = false;
    this.container.addChild(this.aura);
    this.auraTime = 0;

    // Animated 8-bit sprite (driven manually by game ticker via autoUpdate: false)
    this.sprite = new AnimatedSprite({
      textures: this.runTextures,
      autoUpdate: false,
      autoPlay: true,
      animationSpeed: this.baseRunFps / 60,
    });
    this.sprite.anchor.set(0.5, 1);
    const scale = GAME_CONFIG.PLAYER_SIZE / (this.meta?.frameWidth || 16);
    this.sprite.scale.set(scale);
    this.container.addChild(this.sprite);

    this.currentAnim = 'run';
    this.reset();
  }

  reset() {
    this.x = GAME_CONFIG.PLAYER_BASE_X;
    this.y = GAME_CONFIG.GROUND_Y;
    this.vy = 0;
    this.isGrounded = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.flashTimer = 0;
    this.airJumpsUsed = 0;
    this.justAirJumped = false;
    this.powerTint = null;
    this.aura.visible = false;
    this.setAnimation('run');
    this.sprite.tint = 0xffffff;
    this.sprite.alpha = 1;
    this.syncDisplay();
  }

  setAnimation(name) {
    if (this.currentAnim === name) return;
    this.currentAnim = name;
    this.sprite.textures = name === 'jump' ? this.jumpTextures : this.runTextures;
    this.sprite.play();
  }

  queueJump() {
    this.jumpBufferTimer = GAME_CONFIG.JUMP_BUFFER_TIME;
  }

  triggerSafeHit() {
    this.flashTimer = 0.55;
    if (this.isGrounded) {
      this.vy = GAME_CONFIG.JUMP_VELOCITY * 0.35;
      this.isGrounded = false;
    }
  }

  update(
    ticker,
    dt,
    { moveDir = 0, speedMultiplier = 1, isPlaying = true, canAirJump = false } = {}
  ) {
    // Subtle horizontal nudge with Left/Right keys
    if (isPlaying) {
      if (moveDir !== 0) {
        this.x += moveDir * GAME_CONFIG.PLAYER_NUDGE_SPEED * dt;
      } else {
        const diff = GAME_CONFIG.PLAYER_BASE_X - this.x;
        this.x += diff * Math.min(1, dt * 2.5);
      }
      this.x = Math.max(
        GAME_CONFIG.PLAYER_MIN_X,
        Math.min(GAME_CONFIG.PLAYER_MAX_X, this.x)
      );
    }

    // Coyote time & jump buffer
    if (this.isGrounded) {
      this.coyoteTimer = GAME_CONFIG.COYOTE_TIME;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    this.justAirJumped = false;
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
      if (this.coyoteTimer > 0) {
        this.vy = GAME_CONFIG.JUMP_VELOCITY;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
      } else if (canAirJump && this.airJumpsUsed < 1) {
        // ARC Double Jump: one extra jump in mid-air
        this.vy = GAME_CONFIG.DOUBLE_JUMP_VELOCITY;
        this.airJumpsUsed += 1;
        this.jumpBufferTimer = 0;
        this.justAirJumped = true;
      }
    }

    // Vertical physics (Y-down)
    this.vy += GAME_CONFIG.GRAVITY * dt;
    this.y += this.vy * dt;

    if (this.y >= GAME_CONFIG.GROUND_Y) {
      this.y = GAME_CONFIG.GROUND_Y;
      this.vy = 0;
      this.isGrounded = true;
      this.airJumpsUsed = 0;
    }

    // Animation state
    if (!this.isGrounded) {
      this.setAnimation('jump');
    } else {
      this.setAnimation('run');
      this.sprite.animationSpeed = (this.baseRunFps / 60) * speedMultiplier;
      this.sprite.update(ticker);
    }

    // MVP safe-hit blink feedback
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
      const blink = Math.floor(this.flashTimer * 18) % 2 === 0;
      this.sprite.tint = blink ? 0x99ffbb : 0xffffff;
      this.sprite.alpha = blink ? 0.75 : 1;
    } else {
      this.sprite.tint = this.powerTint ?? 0xffffff;
      this.sprite.alpha = 1;
    }

    this.auraTime += dt;
    this.syncDisplay();
  }

  /**
   * Power-up visuals: colored pulsing aura + subtle tint.
   * @param {number|null} color  active power-up color (null = none)
   * @param {boolean} warning    blink because the power-up is about to expire
   */
  setPowerVisual(color, warning = false) {
    if (color == null) {
      this.aura.visible = false;
      this.powerTint = null;
      return;
    }
    const blinkOff = warning && Math.floor(this.auraTime * 10) % 2 === 0;
    this.aura.visible = !blinkOff;
    this.aura.tint = color;
    const pulse = 1 + Math.sin(this.auraTime * 14) * 0.1;
    this.aura.scale.set(pulse);
    // Light tint keeps the sprite readable while hinting the power-up color
    this.powerTint = blinkOff ? 0xffffff : 0xfff2e0;
  }

  /** Center of the sprite body (for particle emitters) */
  get centerY() {
    return this.y - GAME_CONFIG.PLAYER_SIZE * 0.5;
  }

  syncDisplay() {
    this.sprite.position.set(this.x, this.y);
    this.aura.position.set(this.x, this.y - GAME_CONFIG.PLAYER_SIZE * 0.5);

    const heightAboveGround = Math.max(0, GAME_CONFIG.GROUND_Y - this.y);
    const shadowScale = Math.max(0.4, 1 - heightAboveGround / 180);
    this.shadow.position.set(this.x, GAME_CONFIG.GROUND_Y - 1);
    this.shadow.scale.set(shadowScale, 1);
    this.shadow.alpha = shadowScale;
  }

  /**
   * Forgiving hitbox in virtual pixel coordinates (Y-down)
   */
  getHitbox() {
    const halfW = GAME_CONFIG.PLAYER_SIZE * 0.28;
    const height = GAME_CONFIG.PLAYER_SIZE * 0.82;
    return {
      left: this.x - halfW,
      right: this.x + halfW,
      top: this.y - height,
      bottom: this.y - 2,
    };
  }
}
