import { sound } from '@pixi/sound';

const MUSIC_ALIAS = 'background-music';
const MUSIC_URL = '/assets/audio/pixel-christmas-by-ende-dot-app.mp3';
const MUTE_STORAGE_KEY = 'xmas-game:muted';
const MUSIC_VOLUME = 0.28;
const BLURRED_MUSIC_VOLUME = 0.1;
const EFFECTS = {
  coin: '/assets/audio/sfx/coin.wav',
  jump: '/assets/audio/sfx/jump.wav',
  destroy: '/assets/audio/sfx/destroy.wav',
  levelEnd: '/assets/audio/sfx/level-end.wav',
  arcPickup: '/assets/audio/sfx/arc-pickup.wav',
};

export class AudioManager {
  constructor() {
    this.muteButton = document.getElementById('btn-mute');
    this.muted = this.loadMuted();
    this.started = false;
    this.music = sound.add(MUSIC_ALIAS, {
      url: MUSIC_URL,
      preload: true,
      loop: true,
      volume: MUSIC_VOLUME,
    });
    this.effects = Object.fromEntries(
      Object.entries(EFFECTS).map(([name, url]) => [
        name,
        sound.add(`sfx-${name}`, { url, preload: true, volume: 0.5 }),
      ])
    );
    if (this.muted) sound.muteAll();
    this.syncMuteButton();
    this.muteButton.addEventListener('click', () => this.toggleMuted());
    this.bindFirstInteraction();
    this.observeBlurredScene();
  }

  bindFirstInteraction() {
    const unlock = () => {
      this.start();
      document.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    document.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
  }

  observeBlurredScene() {
    const canvasContainer = document.getElementById('canvas-container');
    const syncVolume = () => {
      this.music.volume = canvasContainer.classList.contains('blurred')
        ? BLURRED_MUSIC_VOLUME
        : MUSIC_VOLUME;
    };
    syncVolume();
    this.blurObserver = new MutationObserver(syncVolume);
    this.blurObserver.observe(canvasContainer, { attributes: true, attributeFilter: ['class'] });
  }

  loadMuted() {
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    } catch (err) {
      console.warn('Could not restore mute preference:', err);
      return false;
    }
  }

  toggleMuted() {
    this.muted = !this.muted;
    if (this.muted) sound.muteAll();
    else sound.unmuteAll();
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
    } catch (err) {
      console.warn('Could not persist mute preference:', err);
    }
    this.syncMuteButton();
    if (!this.muted) this.start();
  }

  syncMuteButton() {
    const label = this.muted ? 'SOUND OFF — CLICK TO UNMUTE' : 'SOUND ON — CLICK TO MUTE';
    this.muteButton.classList.toggle('is-muted', this.muted);
    this.muteButton.setAttribute('aria-label', label);
    this.muteButton.setAttribute('title', label);
    this.muteButton.setAttribute('aria-pressed', String(this.muted));
    this.muteButton.querySelector('.audio-on').hidden = this.muted;
    this.muteButton.querySelector('.audio-off').hidden = !this.muted;
  }

  start() {
    if (this.started) {
      if (this.music.instances.length > 0) this.music.resume();
      return;
    }
    this.started = true;

    sound.context.playEmptySound();
    const playback = this.music.play({ loop: true });
    if (playback instanceof Promise) {
      playback.catch((err) => {
        this.started = false;
        console.warn('Could not play background music:', err);
      });
    }
  }

  pause() {
    this.music.pause();
  }

  resume() {
    if (this.music.instances.length > 0) this.music.resume();
  }

  play(name) {
    const effect = this.effects[name];
    if (!effect) throw new Error(`Unknown sound effect: ${name}`);
    const playback = effect.play();
    if (playback instanceof Promise) {
      playback.catch((err) => console.warn(`Could not play "${name}" sound:`, err));
    }
  }

  stop() {
    this.music.stop();
  }
}
