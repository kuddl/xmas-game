import { GAME_CONFIG } from './config.js';

const DEFAULT_LEADERBOARD = [
  { name: 'SANTA', score: 1500 },
  { name: 'PMO', score: 1000 },
  { name: 'DEV', score: 600 },
];

export class UIManager {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.hud = document.getElementById('hud');
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('gameover-screen');
    this.leaderboardScreen = document.getElementById('leaderboard-screen');
    this.lbFullList = document.getElementById('lb-full-list');
    document.getElementById('lb-sp-factor').textContent = GAME_CONFIG.SP_SCORE_FACTOR;
    document.getElementById('lb-size').textContent = GAME_CONFIG.LEADERBOARD_SIZE;
    this.latestEntry = null; // leaderboard entry of the last finished run (highlighted)

    this.hudScore = document.getElementById('hud-score');
    this.hudDist = document.getElementById('hud-dist');
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
    this.goDist = document.getElementById('go-dist');
    document.getElementById('go-sp-factor').textContent = `\u00d7${GAME_CONFIG.SP_SCORE_FACTOR}`;
    this.goHighScore = document.getElementById('go-highscore');
    this.goTime = document.getElementById('go-time');

    this.btnStart = document.getElementById('btn-start');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnLeaderboard = document.getElementById('btn-leaderboard');
    this.btnLbBack = document.getElementById('btn-lb-back');
    this.btnLbRestart = document.getElementById('btn-lb-restart');
    this.goButtons = [this.btnRestart, this.btnLeaderboard];
    // A clicked button keeps focus and would fire again on SPACE/ENTER: hand focus back
    for (const btn of [...this.goButtons, this.btnLbBack, this.btnLbRestart]) {
      btn.addEventListener('click', () => btn.blur());
    }
    this.btnResume = document.getElementById('btn-resume');
    this.btnPause = document.getElementById('btn-pause');
    this.pauseScreen = document.getElementById('pause-screen');
    this.hudSp = document.getElementById('hud-sp');
    this.goSp = document.getElementById('go-sp');
    this.lastSp = 0;

    this.chkTutorial = document.getElementById('chk-tutorial');
    this.tutOverlay = document.getElementById('tutorial-overlay');
    this.tutRing = document.getElementById('tut-ring');
    this.tutCard = document.getElementById('tut-card');
    this.tutStep = document.getElementById('tut-step');
    this.tutIcon = document.getElementById('tut-icon');
    this.tutBadge = document.getElementById('tut-badge');
    this.tutTitle = document.getElementById('tut-title');
    this.tutText = document.getElementById('tut-text');
    this.spriteIcons = {};
    // A clicked checkbox keeps focus and would toggle on SPACE: hand focus back to the game
    this.chkTutorial.addEventListener('change', () => this.chkTutorial.blur());
    this.setupFullscreen();

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
    this.latestEntry = null;
    if (rounded <= 0) return this.getHighScore();

    this.latestEntry = { name: 'YOU', score: rounded };
    this.leaderboard.push(this.latestEntry);
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, GAME_CONFIG.LEADERBOARD_SIZE);

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
          `<li>${entry.name.padEnd(5, ' ')} ${this.formatPts(entry.score)}</li>`
      )
      .join('');
    this.hudLeaderboardList.innerHTML = html;
    this.hudHighScore.textContent = this.formatPts(this.getHighScore());
  }

  renderFullLeaderboard() {
    // Always show every place; free places are dotted placeholders
    const rows = [];
    for (let i = 0; i < GAME_CONFIG.LEADERBOARD_SIZE; i++) {
      const entry = this.leaderboard[i];
      const rank = `<span class="lb-rank">${i + 1}.</span>`;
      rows.push(
        entry
          ? `<li class="${entry === this.latestEntry ? 'lb-latest' : ''}">${rank}` +
              `<span>${entry.name}</span><span>${this.formatPts(entry.score)}</span></li>`
          : `<li class="lb-empty">${rank}<span>...</span><span>.....</span></li>`
      );
    }
    this.lbFullList.innerHTML = rows.join('');
  }

  /** Game Over -> Leaderboard (show=true) or back (show=false) */
  showLeaderboard(show) {
    if (show) this.renderFullLeaderboard();
    this.leaderboardScreen.classList.toggle('hidden', !show);
    this.gameOverScreen.classList.toggle('hidden', show);
  }

  formatPts(value) {
    return String(Math.floor(value)).padStart(5, '0');
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
    this.leaderboardScreen.classList.add('hidden');
    this.renderLeaderboard();
  }

  showPlayingHUD() {
    this.canvasContainer.classList.remove('blurred');
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.leaderboardScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.mvpToast.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.lastSp = 0;
    this.hudSp.textContent = this.formatSp(0);
  }

  showGameOver({ score, distanceMeters, elapsedTime, causeWord, storyPoints = 0 }) {
    const highScore = this.saveScore(score);
    this.canvasContainer.classList.add('blurred');
    this.hud.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.leaderboardScreen.classList.add('hidden');
    this.gameOverScreen.classList.remove('hidden');

    // Mouse players click to jump: ignore clicks that were meant for the last jump
    for (const btn of this.goButtons) btn.disabled = true;
    clearTimeout(this.goLockTimer);
    this.goLockTimer = setTimeout(() => {
      for (const btn of this.goButtons) btn.disabled = false;
    }, GAME_CONFIG.GAME_OVER_INPUT_LOCK_MS);

    this.goCause.textContent = `STOPPED BY: ${causeWord}`;
    this.goDist.textContent = this.formatMeters(distanceMeters);
    this.goSp.textContent = this.formatSp(storyPoints);
    this.goTime.textContent = this.formatTime(elapsedTime);
    this.goScore.textContent = `${this.formatPts(score)} PTS`;
    this.goHighScore.textContent = `${this.formatPts(highScore)} PTS`;
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

  updateHUD({ distanceMeters, elapsedTime, inProduction, score = 0 }) {
    this.hudScore.textContent = this.formatPts(score);
    this.hudDist.textContent = this.formatMeters(distanceMeters);
    this.hudTime.textContent = this.formatTime(elapsedTime);

    const best = Math.max(this.getHighScore(), Math.floor(score));
    this.hudHighScore.textContent = this.formatPts(best);

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

  /** sprite key -> { path, frames } from spritesheet.json (tutorial card icons) */
  setSpriteIcons(icons) {
    this.spriteIcons = icons;
  }

  get tutorialChecked() {
    return this.chkTutorial.checked;
  }

  /** Touch mode swaps every keyboard hint for its tap/hold counterpart (CSS: body.touch) */
  setTouchMode(isTouch) {
    document.body.classList.toggle('touch', isTouch);
  }

  /**
   * Fullscreen toggle (start screen + HUD). Hides the mobile URL bar and, on Android,
   * locks landscape. Browsers without the Fullscreen API (iPhone Safari) hide the buttons.
   */
  setupFullscreen() {
    const root = document.documentElement;
    const supported = !!(root.requestFullscreen || root.webkitRequestFullscreen);
    document.body.classList.toggle('no-fullscreen', !supported);
    if (!supported) return;

    const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

    const toggle = async () => {
      try {
        if (isFullscreen()) {
          await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          await (root.requestFullscreen || root.webkitRequestFullscreen).call(root, {
            navigationUI: 'hide',
          });
          // Only allowed in fullscreen and only on some devices; ignore if refused
          await screen.orientation?.lock?.('landscape').catch(() => {});
        }
      } catch (err) {
        console.warn('Fullscreen not available:', err);
      }
    };

    for (const btn of document.querySelectorAll('.btn-fullscreen')) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.blur(); // keep SPACE for the game
        toggle();
      });
    }

    const sync = () => document.body.classList.toggle('is-fullscreen', isFullscreen());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
  }

  set tutorialChecked(value) {
    this.chkTutorial.checked = value;
  }

  showSpotlight({ screenX, screenY, screenR, step, title, text, icon, badge, accent }) {
    const ov = this.tutOverlay;
    ov.style.setProperty('--spot-x', `${screenX}px`);
    ov.style.setProperty('--spot-y', `${screenY}px`);
    ov.style.setProperty('--spot-r', `${screenR}px`);

    const ringR = screenR + 6;
    Object.assign(this.tutRing.style, {
      left: `${screenX - ringR}px`,
      top: `${screenY - ringR}px`,
      width: `${ringR * 2}px`,
      height: `${ringR * 2}px`,
    });

    this.tutStep.textContent = step || '';
    this.tutTitle.textContent = title || '';
    this.tutText.innerHTML = text || '';
    this.tutCard.style.setProperty('--tut-accent', accent || 'var(--gold)');

    const meta = icon ? this.spriteIcons[icon] : null;
    if (meta) {
      this.tutIcon.style.display = '';
      this.tutIcon.style.backgroundImage = `url('${meta.path}')`;
      // Sprite sheets: show only the first frame
      this.tutIcon.style.backgroundSize = meta.frames ? `${meta.frames * 100}% 100%` : 'contain';
      this.tutIcon.style.backgroundPosition = meta.frames ? '0 0' : 'center';
    } else {
      this.tutIcon.style.display = 'none';
    }
    this.tutBadge.classList.toggle('hidden', !badge);
    this.tutBadge.textContent = badge || '';

    ov.classList.remove('hidden');

    // Place the card on the side of the spotlight with more room; shrink it on small screens
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 20;
    const roomRight = vw - (screenX + ringR + gap) - 12;
    const roomLeft = screenX - ringR - gap - 12;
    const placeRight = roomRight >= roomLeft;
    const cardW = Math.max(240, Math.min(460, placeRight ? roomRight : roomLeft));
    this.tutCard.style.width = `${cardW}px`;
    const cardH = this.tutCard.offsetHeight;
    let left = placeRight ? screenX + ringR + gap : screenX - ringR - gap - cardW;
    left = Math.max(12, Math.min(vw - cardW - 12, left));
    let top = screenY - cardH / 2 - 30;
    top = Math.max(Math.min(110, vh * 0.2), Math.min(vh - cardH - 12, top));
    this.tutCard.style.left = `${left}px`;
    this.tutCard.style.top = `${top}px`;
  }

  hideSpotlight() {
    this.tutOverlay.classList.add('hidden');
  }
}
