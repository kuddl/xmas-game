import { Assets, Rectangle, Texture } from 'pixi.js';

export class AssetLoader {
  constructor() {
    this.manifest = null;
    this.textures = {};
    this.frameArrays = {};
  }

  async loadAll() {
    const res = await fetch('/assets/spritesheet.json');
    if (!res.ok) {
      throw new Error(`Failed to load spritesheet.json: ${res.status}`);
    }
    this.manifest = await res.json();

    const entries = Object.entries(this.manifest.sprites);
    const paths = entries.map(([, meta]) => meta.path);
    const loaded = await Assets.load(paths);

    for (const [key, meta] of entries) {
      const texture = loaded[meta.path];
      if (!texture) {
        throw new Error(`Missing texture for sprite "${key}" (${meta.path})`);
      }

      // Enforce crisp nearest-neighbor pixel art scaling
      texture.source.scaleMode = 'nearest';
      this.textures[key] = texture;

      // Slice horizontal spritesheets into sub-textures for AnimatedSprite
      if (meta.frames && meta.frameWidth && meta.frameHeight) {
        const frames = [];
        for (let i = 0; i < meta.frames; i++) {
          frames.push(
            new Texture({
              source: texture.source,
              frame: new Rectangle(
                i * meta.frameWidth,
                0,
                meta.frameWidth,
                meta.frameHeight
              ),
            })
          );
        }
        this.frameArrays[key] = frames;
      }
    }

    return { manifest: this.manifest, textures: this.textures };
  }

  getSpriteMeta(key) {
    return this.manifest?.sprites?.[key] || null;
  }

  getTexture(key) {
    return this.textures[key] || null;
  }

  getFrames(key) {
    return this.frameArrays[key] || [];
  }
}
