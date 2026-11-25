import * as THREE from 'three';

export class AssetLoader {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.manifest = null;
    this.textures = {};
    this.buzzwordTextures = new Map();
  }

  async loadAll() {
    const res = await fetch('/assets/spritesheet.json');
    if (!res.ok) {
      throw new Error(`Failed to load spritesheet.json: ${res.status}`);
    }
    this.manifest = await res.json();

    const entries = Object.entries(this.manifest.sprites);
    const repeatKeys = new Set([
      'ground',
      'bgMountainsFar',
      'bgMountainsMid',
      'bgTreesNear',
    ]);

    await Promise.all(
      entries.map(async ([key, meta]) => {
        const tex = await this.loadTexture(meta.path, {
          repeatX: repeatKeys.has(key),
        });
        this.textures[key] = tex;
      })
    );

    return { manifest: this.manifest, textures: this.textures };
  }

  loadTexture(url, { repeatX = false } = {}) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;
          texture.colorSpace = THREE.SRGBColorSpace;
          if (repeatX) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
          }
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  getSpriteMeta(key) {
    return this.manifest?.sprites?.[key] || null;
  }

  getTexture(key) {
    return this.textures[key] || null;
  }

  /**
   * Generates a crisp 8-bit retro label texture for obstacle buzzwords.
   */
  getBuzzwordTexture(word) {
    if (this.buzzwordTextures.has(word)) {
      return this.buzzwordTextures.get(word);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Dark pixel border
    ctx.fillStyle = '#12223a';
    ctx.fillRect(0, 6, 256, 52);

    // Snow-white sign interior
    ctx.fillStyle = '#f2f8ff';
    ctx.fillRect(6, 12, 244, 40);

    // Festive red top accent strip
    ctx.fillStyle = '#e02f40';
    ctx.fillRect(6, 12, 244, 6);

    // Buzzword text
    ctx.fillStyle = '#b81d2c';
    ctx.font = 'bold 24px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, 128, 37, 230);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    this.buzzwordTextures.set(word, texture);
    return texture;
  }

  /**
   * Generates the visual banner texture for the MVP -> REAL PRODUCTION line.
   */
  createProductionBannerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#12223a';
    ctx.fillRect(0, 0, 320, 80);
    ctx.fillStyle = '#e02f40';
    ctx.fillRect(6, 6, 308, 68);
    ctx.fillStyle = '#f2f8ff';
    ctx.fillRect(10, 10, 300, 60);
    ctx.fillStyle = '#e02f40';
    ctx.fillRect(14, 14, 292, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('REAL PRODUCTION', 160, 42, 276);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
