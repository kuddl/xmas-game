import { GAME_CONFIG } from './config.js';

const DEFAULT_LEADERBOARD = [
  { name: 'SANTA', score: 620 },
  { name: 'PMO', score: 410 },
  { name: 'DEV', score: 280 },
];

export class UIManager {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.hud = document.getElementById('hud');
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('gameover-screen');

    this.hudScore = document.getElementById('hud-score');
    this.hudTime = document.getElementById('hud-time');
    this.hudHighScore = document.getElementById('hud-highscore');
    this.phaseBadge = document.getElementById('phase-badge');
    this.phaseProgressLabel = document.getElementById('phase-progress-label');
    this.phaseProgressFill = document.getElementById('phase-progress-fill');
    this.hudLeaderboardList = document.getElementById('hud-leaderboard-list');
    this.mvpToast = document.getElementById('mvp-toast');
    this.powerupBar = document.getElementById('powerup-bar');
    this.powerupSlots = new Map(); // type -> { el, fill, time }

    this.goCause = document.getElementById('gameover-cause');
    this.goScore = document.getElementById('go-score');
    this.goHighScore = document.getElementById('go-highscore');
    this.goTime = document.getElementById('go-time');
    this.goLeaderboardList = document.getElementById('go-leaderboard-list');

    this.btnStart = document.getElementById('btn-start');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnResume = document.getElementById('btn-resume');
    this.pauseScreen = document.getElementById('pause-screen');
    this.hudSp = document.getElementById('hud-sp');
    this.goSp = document.getElementById('go-sp');
    this.lastSp = 0;

    this.toastTimeout = null;
    this.leaderboard = this.loadLeaderboard();
    this.renderLeaderboard();
  }

  loadLeaderboard() {
    try {
      const raw = localStorage.getItem(GAME_CONFIG.LEADERBOARD_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [...DEFAULT_LEADERBOARD];
  }

  saveScore(score) {
    const rounded = Math.floor(score);
    if (rounded <= 0) return this.getHighScore();

    this.leaderboard.push({ name: 'YOU', score: rounded });
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 5);

    try {
      localStorage.setItem(
        GAME_CONFIG.LEADERBOARD_KEY,
        JSON.stringify(this.leaderboard)
      );
    } catch {
      // ignore storage errors
    }

    this.renderLeaderboard();
    return this.getHighScore();
  }

  getHighScore() {
    return this.leaderboard.length > 0 ? this.leaderboard[0].score : 0;
  }

  renderLeaderboard() {
    const top3 = this.leaderboard.slice(0, 3);
    const html = top3
      .map(
        (entry) =>
          `<li>${entry.name.padEnd(5, ' ')} ${this.formatMeters(entry.score)}</li>`
      )
      .join('');
    this.hudLeaderboardList.innerHTML = html;
    this.goLeaderboardList.innerHTML = html;
    this.hudHighScore.textContent = this.formatMeters(this.getHighScore());
  }

  formatMeters(value) {
    return `${String(Math.floor(value)).padStart(4, '0')}m`;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  showStartScreen() {
    this.canvasContainer.classList.add('blurred');
    this.startScreen.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.renderLeaderboard();
  }

  showPlayingHUD() {
    this.canvasContainer.classList.remove('blurred');
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.mvpToast.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.lastSp = 0;
    this.hudSp.textContent = this.formatSp(0);
  }

  showGameOver({ score, elapsedTime, causeWord, storyPoints = 0 }) {
    const highScore = this.saveScore(score);
    this.canvasContainer.classList.add('blurred');
    this.hud.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.remove('hidden');

    this.goCause.textContent = `STOPPED BY: ${causeWord}`;
    this.goScore.textContent = this.formatMeters(score);
    this.goHighScore.textContent = this.formatMeters(highScore);
    this.goTime.textContent = this.formatTime(elapsedTime);
    this.goSp.textContent = this.formatSp(storyPoints);
  }

  formatSp(value) {
    return String(value).padStart(3, '0');
  }

  updateStoryPoints(value) {
    if (value === this.lastSp) return;
    const increased = value > this.lastSp;
    this.lastSp = value;
    this.hudSp.textContent = this.formatSp(value);
    if (increased) {
      // restart the bump animation
      this.hudSp.classList.remove('sp-bump');
      void this.hudSp.offsetWidth;
      this.hudSp.classList.add('sp-bump');
    }
  }

  showPause(paused) {
    this.pauseScreen.classList.toggle('hidden', !paused);
  }

  updateHUD({ distanceMeters, elapsedTime, inProduction }) {
    this.hudScore.textContent = this.formatMeters(distanceMeters);
    this.hudTime.textContent = this.formatTime(elapsedTime);

    const best = Math.max(this.getHighScore(), Math.floor(distanceMeters));
    this.hudHighScore.textContent = this.formatMeters(best);

    if (!inProduction) {
      const pct = Math.min(
        100,
        (distanceMeters / GAME_CONFIG.MVP_DISTANCE_METERS) * 100
      );
      const remaining = Math.max(
        0,
        Math.ceil(GAME_CONFIG.MVP_DISTANCE_METERS - distanceMeters)
      );
      this.phaseBadge.textContent = 'MVP PHASE (SAFE)';
      this.phaseBadge.className = 'badge badge-mvp';
      this.phaseProgressLabel.textContent = `${remaining}m TO PROD`;
      this.phaseProgressFill.style.width = `${pct}%`;
    } else {
      this.phaseBadge.textContent = 'REAL PRODUCTION';
      this.phaseBadge.className = 'badge badge-prod';
      this.phaseProgressLabel.textContent = '1 LIFE — LIVE!';
      this.phaseProgressFill.style.width = '100%';
    }
  }

  showMvpSafeToast(word) {
    this.showToast(`MVP SAFE! "${word}" IGNORED`, 'rgba(43, 138, 87, 0.92)');
  }

  showToast(text, background) {
    this.mvpToast.textContent = text;
    this.mvpToast.style.background = background;
    this.mvpToast.classList.remove('hidden');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.mvpToast.classList.add('hidden');
    }, 1100);
  }

  /**
   * Renders one draining progress bar per active power-up.
   * @param {{type:string, remaining:number, ratio:number}[]} activeList
   */
  updatePowerUps(activeList) {
    const activeTypes = new Set(activeList.map((p) => p.type));

    for (const [type, slot] of this.powerupSlots) {
      if (!activeTypes.has(type)) {
        slot.el.remove();
        this.powerupSlots.delete(type);
      }
    }

    for (const { type, remaining, ratio } of activeList) {
      let slot = this.powerupSlots.get(type);
      if (!slot) {
        slot = this.createPowerUpSlot(type);
        this.powerupSlots.set(type, slot);
      }
      slot.fill.style.width = `${(ratio * 100).toFixed(1)}%`;
      slot.time.textContent = `${remaining.toFixed(1)}s`;
      slot.el.classList.toggle(
        'warning',
        remaining <= GAME_CONFIG.POWERUP_WARNING_TIME
      );
    }
  }

  createPowerUpSlot(type) {
    const def = GAME_CONFIG.POWERUPS[type];
    const iconPath = this.powerupIcons?.[type] || '';

    const el = document.createElement('div');
    el.className = 'pu-slot';
    el.style.setProperty('--pu-color', def.cssColor);
    el.innerHTML = `
      <img class="pu-icon" src="${iconPath}" alt="" />
      <div class="pu-info">
        <div class="pu-label"><span>${def.label}</span><span class="pu-time"></span></div>
        <div class="pu-track"><div class="pu-fill"></div></div>
      </div>`;
    this.powerupBar.appendChild(el);

    return {
      el,
      fill: el.querySelector('.pu-fill'),
      time: el.querySelector('.pu-time'),
    };
  }

  clearPowerUps() {
    for (const slot of this.powerupSlots.values()) slot.el.remove();
    this.powerupSlots.clear();
  }

  /** type -> icon URL (resolved from spritesheet.json so designers can swap assets) */
  setPowerUpIcons(icons) {
    this.powerupIcons = icons;
  }
}
