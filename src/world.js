import {
  BlurFilter,
  ColorMatrixFilter,
  Container,
  FillGradient,
  Graphics,
  Sprite,
  Text,
  Texture,
  TilingSprite,
} from 'pixi.js';
import { GAME_CONFIG } from './config.js';

export class World {
  constructor(assetLoader, parentContainer, initialViewWidth) {
    this.assetLoader = assetLoader;
    this.viewWidth = initialViewWidth;

    this.bgContainer = new Container();
    this.bgContainer.zIndex = 0;
    parentContainer.addChild(this.bgContainer);

    this.fgContainer = new Container();
    this.fgContainer.zIndex = 30;
    parentContainer.addChild(this.fgContainer);

    this.parallaxLayers = [];
    this.snowflakes = [];

    // Sky + parallax live in their own container so the MVP "staging" look
    // (tint + blur) never touches ground, obstacles, coins or the player
    this.backdrop = new Container();
    this.bgContainer.addChild(this.backdrop);

    this.buildSky();
    this.buildParallaxLayers();
    this.buildGround();
    this.buildProductionLine();
    this.buildSnowfall();
    this.buildStagingLook();
  }

  buildStagingLook() {
    const cfg = GAME_CONFIG.MVP_BACKDROP;
    this.stagingColor = new ColorMatrixFilter();
    this.stagingColor.saturate(cfg.SATURATION, false);
    this.stagingColor.tint(cfg.TINT, true);

    this.stagingBlur = new BlurFilter({ strength: cfg.BLUR, quality: 3, resolution: 'inherit' });
    this.stagingBlur.repeatEdgePixels = true; // no transparent fringe at the screen edges

    this.backdrop.filters = [this.stagingColor, this.stagingBlur];
    this.productionMix = 0; // 0 = MVP staging look, 1 = full production colours
    this.applyStagingLook();
  }

  applyStagingLook() {
    const staging = 1 - this.productionMix;
    this.stagingColor.alpha = staging;
    this.stagingColor.enabled = staging > 0;
    this.stagingBlur.strength = GAME_CONFIG.MVP_BACKDROP.BLUR * staging;
    this.stagingBlur.enabled = staging > 0 && GAME_CONFIG.MVP_BACKDROP.BLUR > 0;
  }

  updateStagingLook(dt, inProduction) {
    let mix = this.productionMix;
    if (!inProduction) {
      mix = 0; // new run: back to staging instantly
    } else if (mix < 1) {
      mix = Math.min(1, mix + dt / GAME_CONFIG.MVP_BACKDROP.FADE_SECONDS);
    }
    if (mix !== this.productionMix) {
      this.productionMix = mix;
      this.applyStagingLook();
    }
  }

  buildSky() {
    this.skyGradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: '#3a8ad6' },
        { offset: 0.45, color: '#7bc4f7' },
        { offset: 0.85, color: '#c7e8ff' },
        { offset: 1, color: '#eaf6ff' },
      ],
    });

    this.sky = new Graphics()
      .rect(0, 0, this.viewWidth, GAME_CONFIG.VIRTUAL_HEIGHT)
      .fill(this.skyGradient);
    this.backdrop.addChild(this.sky);
  }

  buildParallaxLayers() {
    const defs = [
      {
        key: 'bgMountainsFar',
        scale: 2,
        bottomY: GAME_CONFIG.GROUND_Y + 4,
        parallax: 0.14,
      },
      {
        key: 'bgMountainsMid',
        scale: 1.75,
        bottomY: GAME_CONFIG.GROUND_Y + 4,
        parallax: 0.3,
      },
      {
        key: 'bgTreesNear',
        scale: 1.85,
        bottomY: GAME_CONFIG.GROUND_Y + 2,
        parallax: 0.62,
      },
    ];

    for (const def of defs) {
      const texture = this.assetLoader.getTexture(def.key);
      const layerHeight = texture.height * def.scale;
      const tiling = new TilingSprite({
        texture,
        width: this.viewWidth,
        height: layerHeight,
      });
      tiling.tileScale.set(def.scale, def.scale);
      tiling.position.set(0, def.bottomY - layerHeight);
      this.backdrop.addChild(tiling);

      this.parallaxLayers.push({ sprite: tiling, parallax: def.parallax });
    }
  }

  buildGround() {
    const texture = this.assetLoader.getTexture('ground');
    const groundHeight = GAME_CONFIG.VIRTUAL_HEIGHT - GAME_CONFIG.GROUND_Y;
    const scale = Math.ceil(groundHeight / texture.height);

    this.ground = new TilingSprite({
      texture,
      width: this.viewWidth,
      height: groundHeight + 8,
    });
    this.ground.tileScale.set(scale, scale);
    this.ground.position.set(0, GAME_CONFIG.GROUND_Y);
    this.bgContainer.addChild(this.ground);
  }

  buildProductionLine() {
    this.productionLine = new Container();

    const line = new Graphics()
      .rect(-2, 0, 4, GAME_CONFIG.GROUND_Y)
      .fill({ color: 0xe02f40, alpha: 0.85 });
    this.productionLine.addChild(line);

    const bannerW = 142;
    const bannerH = 26;
    const bannerY = 72;

    const bannerBg = new Graphics()
      .rect(-bannerW / 2, bannerY, bannerW, bannerH)
      .fill(0x12223a)
      .rect(-bannerW / 2 + 2, bannerY + 2, bannerW - 4, bannerH - 4)
      .fill(0xf2f8ff)
      .rect(-bannerW / 2 + 4, bannerY + 4, bannerW - 8, bannerH - 8)
      .fill(0xe02f40);
    this.productionLine.addChild(bannerBg);

    const bannerText = new Text({
      text: 'REAL PRODUCTION',
      style: {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: 7.5,
        fontWeight: 'bold',
        fill: 0xffffff,
      },
    });
    bannerText.anchor.set(0.5, 0.5);
    bannerText.position.set(0, bannerY + bannerH / 2 + 0.5);
    this.productionLine.addChild(bannerText);

    this.bgContainer.addChild(this.productionLine);
  }

  buildSnowfall() {
    const count = 90;
    for (let i = 0; i < count; i++) {
      const size = Math.random() < 0.65 ? 2 : 3;
      const flake = new Sprite(Texture.WHITE);
      flake.width = size;
      flake.height = size;
      flake.alpha = 0.6 + Math.random() * 0.35;
      flake.position.set(
        Math.random() * (this.viewWidth + 100),
        Math.random() * GAME_CONFIG.VIRTUAL_HEIGHT
      );
      this.fgContainer.addChild(flake);

      this.snowflakes.push({
        sprite: flake,
        vx: -18 - Math.random() * 28,
        vy: 30 + Math.random() * 48,
      });
    }
  }

  resize(newViewWidth) {
    this.viewWidth = newViewWidth;
    this.sky
      .clear()
      .rect(0, 0, newViewWidth, GAME_CONFIG.VIRTUAL_HEIGHT)
      .fill(this.skyGradient);

    for (const layer of this.parallaxLayers) {
      layer.sprite.width = newViewWidth;
    }
    this.ground.width = newViewWidth;
  }

  update(dt, scrollSpeed, { distanceMeters = 0, playerX = GAME_CONFIG.PLAYER_BASE_X } = {}) {
    // Scroll parallax layers
    for (const layer of this.parallaxLayers) {
      layer.sprite.tilePosition.x -= scrollSpeed * layer.parallax * dt;
    }

    // Scroll ground 1:1 with world pixels
    this.ground.tilePosition.x -= scrollSpeed * dt;

    // Position the MVP -> REAL PRODUCTION boundary line
    const metersRemaining = GAME_CONFIG.MVP_DISTANCE_METERS - distanceMeters;
    const lineX = playerX + metersRemaining * GAME_CONFIG.PIXELS_PER_METER;
    this.productionLine.x = lineX;
    this.productionLine.visible = lineX > -120 && lineX < this.viewWidth + 160;

    this.updateStagingLook(dt, distanceMeters >= GAME_CONFIG.MVP_DISTANCE_METERS);

    // Animate snowfall
    for (const flake of this.snowflakes) {
      flake.sprite.x += (flake.vx - scrollSpeed * 0.2) * dt;
      flake.sprite.y += flake.vy * dt;

      if (flake.sprite.x < -10) {
        flake.sprite.x = this.viewWidth + Math.random() * 40;
      }
      if (flake.sprite.y > GAME_CONFIG.VIRTUAL_HEIGHT + 6) {
        flake.sprite.y = -6;
        flake.sprite.x = Math.random() * (this.viewWidth + 60);
      }
    }
  }
}
