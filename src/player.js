import { AnimatedSprite, Container, Graphics } from 'pixi.js';
import { GAME_CONFIG } from './config.js';

const FOOT_HALF_WIDTH = GAME_CONFIG.PLAYER_SIZE * 0.22;

export class Player {
  constructor(assetLoader) {
    this.meta = assetLoader.getSpriteMeta('player');
    const allFrames = assetLoader.getFrames('player');
    const anim = this.meta?.animations || {};

    this.baseRunFps = anim.run?.fps || 10;
    this.textures = {
      run: (anim.run?.frames || [0, 1, 2, 1]).map((i) => allFrames[i]),
      jump: (anim.jump?.frames || [3]).map((i) => allFrames[i]),
      // Fallback to the jump frame if an older spritesheet has no duck pose
      duck: (anim.duck?.frames || anim.jump?.frames || [3]).map((i) => allFrames[i]),
    };

    this.container = new Container();
    this.container.zIndex = 20;

    // Shadow oval on whatever surface is below the player
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

    // Animated 8-bit sprite (driven by the game ticker via autoUpdate: false)
    this.sprite = new AnimatedSprite({
      textures: this.textures.run,
      autoUpdate: false,
      autoPlay: true,
      animationSpeed: this.baseRunFps / 60,
    });
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(GAME_CONFIG.PLAYER_SIZE / (this.meta?.frameWidth || 16));
    this.container.addChild(this.sprite);

    this.currentAnim = 'run';
    this.reset();
  }

  reset() {
    this.x = GAME_CONFIG.PLAYER_BASE_X;
    this.y = GAME_CONFIG.GROUND_Y;
    this.vy = 0;
    this.isGrounded = true;
    this.surface = 'ground'; // 'ground' | platform surface object | null (airborne)
    this.isDucking = false;
    this.dropTimer = 0;
    this.prevDownHeld = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.flashTimer = 0;
    this.airJumpsUsed = 0;
    this.justAirJumped = false;
    this.powerTint = null;
    this.shadowY = GAME_CONFIG.GROUND_Y;
    this.aura.visible = false;
    this.setAnimation('run');
    this.sprite.tint = 0xffffff;
    this.sprite.alpha = 1;
    this.syncDisplay();
  }

  get onPlatform() {
    return this.isGrounded && this.surface !== 'ground' && this.surface != null;
  }

  setAnimation(name) {
    if (this.currentAnim === name) return;
    this.currentAnim = name;
    this.sprite.textures = this.textures[name];
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
      this.surface = null;
    }
  }

  /**
   * @param {object} opts
   * @param {boolean} opts.downHeld  ↓ key: duck on ground, drop through platforms, fast-fall in air
   * @param {{left:number,right:number,top:number}[]} opts.platforms  one-way platform surfaces
   */
  update(
    ticker,
    dt,
    {
      moveDir = 0,
      speedMultiplier = 1,
      isPlaying = true,
      canAirJump = false,
      downHeld = false,
      platforms = [],
    } = {}
  ) {
    const downPressed = downHeld && !this.prevDownHeld;
    this.prevDownHeld = downHeld;

    // Subtle horizontal nudge with Left/Right keys
    if (isPlaying) {
      if (moveDir !== 0) {
        this.x += moveDir * GAME_CONFIG.PLAYER_NUDGE_SPEED * dt;
      } else {
        this.x += (GAME_CONFIG.PLAYER_BASE_X - this.x) * Math.min(1, dt * 2.5);
      }
      this.x = Math.max(GAME_CONFIG.PLAYER_MIN_X, Math.min(GAME_CONFIG.PLAYER_MAX_X, this.x));
    }

    // ↓ on a platform: drop down through it
    if (downPressed && this.onPlatform) {
      this.dropTimer = GAME_CONFIG.PLATFORM_DROP_TIME;
      this.isGrounded = false;
      this.surface = null;
      this.y += 2;
    }
    this.dropTimer = Math.max(0, this.dropTimer - dt);

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
        this.surface = null;
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

    // Vertical physics (Y-down); holding ↓ in the air = fast fall
    const fastFall = !this.isGrounded && downHeld && this.vy > -120;
    const gravity = GAME_CONFIG.GRAVITY * (fastFall ? GAME_CONFIG.FAST_FALL_MULTIPLIER : 1);
    const prevY = this.y;
    this.vy += gravity * dt;
    this.y += this.vy * dt;

    // Landing: one-way platforms first (only while falling), then the ground
    let landedOn = null;
    if (this.vy >= 0) {
      if (this.dropTimer <= 0) {
        for (const p of platforms) {
          const overlapsX = this.x + FOOT_HALF_WIDTH > p.left && this.x - FOOT_HALF_WIDTH < p.right;
          if (overlapsX && prevY <= p.top + 0.5 && this.y >= p.top) {
            this.y = p.top;
            landedOn = p;
            break;
          }
        }
      }
      if (!landedOn && this.y >= GAME_CONFIG.GROUND_Y) {
        this.y = GAME_CONFIG.GROUND_Y;
        landedOn = 'ground';
      }
    }

    if (landedOn) {
      this.vy = 0;
      this.isGrounded = true;
      this.surface = landedOn;
      this.airJumpsUsed = 0;
    } else {
      this.isGrounded = false;
      this.surface = null;
    }

    // Ducking only makes sense on the ground (flyers live at ground level)
    this.isDucking = isPlaying && downHeld && this.isGrounded && this.surface === 'ground';

    // Animation state
    if (!this.isGrounded) {
      this.setAnimation('jump');
    } else if (this.isDucking) {
      this.setAnimation('duck');
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

    this.shadowY = this.findSurfaceBelow(platforms);
    this.auraTime += dt;
    this.syncDisplay();
  }

  /** Highest surface at or below the feet (for the shadow) */
  findSurfaceBelow(platforms) {
    let best = GAME_CONFIG.GROUND_Y;
    for (const p of platforms) {
      const overlapsX = this.x + FOOT_HALF_WIDTH > p.left && this.x - FOOT_HALF_WIDTH < p.right;
      if (overlapsX && p.top >= this.y - 0.5 && p.top < best) best = p.top;
    }
    return best;
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
    this.aura.scale.set(1 + Math.sin(this.auraTime * 14) * 0.1);
    this.powerTint = blinkOff ? 0xffffff : 0xfff2e0;
  }

  /** Center of the sprite body (for particle emitters) */
  get centerY() {
    return this.y - GAME_CONFIG.PLAYER_SIZE * (this.isDucking ? 0.3 : 0.5);
  }

  syncDisplay() {
    this.sprite.position.set(this.x, this.y);
    this.aura.position.set(this.x, this.centerY);

    const heightAbove = Math.max(0, this.shadowY - this.y);
    const shadowScale = Math.max(0.4, 1 - heightAbove / 180);
    this.shadow.position.set(this.x, this.shadowY - 1);
    this.shadow.scale.set(shadowScale, 1);
    this.shadow.alpha = shadowScale;
  }

  /**
   * Forgiving hitbox in virtual pixel coordinates (Y-down).
   * Ducking makes it low and a bit wider.
   */
  getHitbox() {
    const size = GAME_CONFIG.PLAYER_SIZE;
    const halfW = size * (this.isDucking ? 0.34 : 0.28);
    const height = size * (this.isDucking ? 0.45 : 0.82);
    return {
      left: this.x - halfW,
      right: this.x + halfW,
      top: this.y - height,
      bottom: this.y - 2,
    };
  }
}
