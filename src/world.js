import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class World {
  constructor(assetLoader, scene) {
    this.assetLoader = assetLoader;
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.layers = [];
    this.snowParticles = null;
    this.productionLineGroup = null;

    this.buildSky();
    this.buildParallaxLayers();
    this.buildGround();
    this.buildProductionLine();
    this.buildSnowfall();
  }

  buildSky() {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#3a8ad6');
    grad.addColorStop(0.45, '#7bc4f7');
    grad.addColorStop(0.85, '#c7e8ff');
    grad.addColorStop(1, '#eaf6ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 4, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(50, GAME_CONFIG.WORLD_HEIGHT + 2);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = -10;
    this.group.add(mesh);
  }

  buildParallaxLayers() {
    const layerDefs = [
      {
        key: 'bgMountainsFar',
        width: 48,
        height: 9.0,
        y: GAME_CONFIG.GROUND_Y + 4.3,
        z: -6,
        repeatX: 2.5,
        parallax: 0.012,
      },
      {
        key: 'bgMountainsMid',
        width: 48,
        height: 7.4,
        y: GAME_CONFIG.GROUND_Y + 3.5,
        z: -4,
        repeatX: 2.8,
        parallax: 0.025,
      },
      {
        key: 'bgTreesNear',
        width: 48,
        height: 3.6,
        y: GAME_CONFIG.GROUND_Y + 1.75,
        z: -2,
        repeatX: 3.5,
        parallax: 0.055,
      },
    ];

    for (const def of layerDefs) {
      const tex = this.assetLoader.getTexture(def.key).clone();
      tex.needsUpdate = true;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(def.repeatX, 1);

      const geo = new THREE.PlaneGeometry(def.width, def.height);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.05,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, def.y, def.z);
      this.group.add(mesh);

      this.layers.push({ tex, parallax: def.parallax });
    }
  }

  buildGround() {
    const groundHeight = 3.2;
    const groundWidth = 48;
    const tex = this.assetLoader.getTexture('ground').clone();
    tex.needsUpdate = true;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(12, 1);

    const geo = new THREE.PlaneGeometry(groundWidth, groundHeight);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, GAME_CONFIG.GROUND_Y - groundHeight * 0.5, 0.5);
    this.group.add(mesh);

    this.groundLayer = {
      tex,
      repeatPerUnit: 12 / groundWidth,
    };
  }

  buildProductionLine() {
    this.productionLineGroup = new THREE.Group();

    // Vertical red/white milestone line spanning the sky down to ground
    const lineGeo = new THREE.PlaneGeometry(0.14, GAME_CONFIG.WORLD_HEIGHT);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xe02f40,
      transparent: true,
      opacity: 0.85,
    });
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.position.y = 0.5;
    lineMesh.position.z = 0.2;

    // Banner at top of line
    const bannerTex = this.assetLoader.createProductionBannerTexture();
    const bannerGeo = new THREE.PlaneGeometry(4.2, 1.05);
    const bannerMat = new THREE.MeshBasicMaterial({
      map: bannerTex,
      transparent: true,
    });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.y = GAME_CONFIG.GROUND_Y + 6.8;
    bannerMesh.position.z = 0.3;

    this.productionLineGroup.add(lineMesh);
    this.productionLineGroup.add(bannerMesh);
    this.group.add(this.productionLineGroup);
  }

  buildSnowfall() {
    const count = 140;
    const positions = new Float32Array(count * 3);
    this.snowVelocities = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * (GAME_CONFIG.WORLD_HEIGHT + 2);
      positions[i * 3 + 2] = 3 + Math.random();

      this.snowVelocities[i * 2] = -0.8 - Math.random() * 1.4; // wind X
      this.snowVelocities[i * 2 + 1] = -1.2 - Math.random() * 1.8; // fall Y
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.85,
    });

    this.snowParticles = new THREE.Points(geo, mat);
    this.group.add(this.snowParticles);
  }

  update(dt, scrollSpeed, { distance = 0, playerX = GAME_CONFIG.PLAYER_BASE_X } = {}) {
    // Scroll parallax backgrounds
    for (const layer of this.layers) {
      layer.tex.offset.x = (layer.tex.offset.x + scrollSpeed * layer.parallax * dt) % 1;
    }

    // Scroll ground locked 1:1 with world units
    this.groundLayer.tex.offset.x =
      (this.groundLayer.tex.offset.x +
        scrollSpeed * this.groundLayer.repeatPerUnit * dt) %
      1;

    // Position the MVP -> REAL PRODUCTION boundary line in world space
    const unitsRemaining = GAME_CONFIG.MVP_DISTANCE_UNITS - distance;
    this.productionLineGroup.position.x = playerX + unitsRemaining;
    this.productionLineGroup.visible =
      Math.abs(this.productionLineGroup.position.x) < 26;

    // Animate snowfall
    const pos = this.snowParticles.geometry.attributes.position;
    const halfH = GAME_CONFIG.WORLD_HEIGHT * 0.5 + 1;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) + (this.snowVelocities[i * 2] - scrollSpeed * 0.18) * dt;
      let y = pos.getY(i) + this.snowVelocities[i * 2 + 1] * dt;

      if (x < -17) x += 34;
      if (y < -halfH) {
        y = halfH;
        x = (Math.random() - 0.5) * 34;
      }
      pos.setXY(i, x, y);
    }
    pos.needsUpdate = true;
  }
}
