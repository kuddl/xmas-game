import './style.css';
import { AssetLoader } from './assetLoader.js';
import { Game } from './game.js';

async function bootstrap() {
  if (window.location.pathname === '/info') {
    renderInfoRoute();
    return;
  }

  renderVersionBadge();

  const assetLoader = new AssetLoader();
  try {
    await assetLoader.loadAll();
    const game = new Game(assetLoader);
    await game.init();
    if (import.meta.env.DEV) window.__game = game; // debug handle (dev only)
  } catch (err) {
    console.error('Failed to initialize Christmas Game:', err);
  }
}

function renderVersionBadge() {
  const badge = document.createElement('a');
  badge.href = '/info';
  badge.className = 'version-badge';
  badge.title = 'View deployment info';
  badge.textContent = `v${__APP_VERSION__} · commit ${__GIT_COMMIT__}`;
  document.body.appendChild(badge);
}

function renderInfoRoute() {
  document.title = 'Deployment Info — Christmas Game';
  const buildDate = new Date(__BUILD_TIME__);
  const formattedTime = buildDate.toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  document.body.innerHTML = `
    <div class="info-container">
      <div class="info-card">
        <h1 class="info-title">CHRISTMAS GAME</h1>
        <div class="info-subtitle">DEPLOYMENT & BUILD INFO</div>

        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">VERSION</span>
            <span class="info-value accent">v${__APP_VERSION__}</span>
          </div>
          <div class="info-row">
            <span class="info-label">GIT COMMIT</span>
            <span class="info-value font-mono">${__GIT_COMMIT__}</span>
          </div>
          <div class="info-row">
            <span class="info-label">BUILD TIME (BERLIN)</span>
            <span class="info-value">${formattedTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">BUILD TIME (UTC)</span>
            <span class="info-value">${__BUILD_TIME__}</span>
          </div>
          <div class="info-row">
            <span class="info-label">ENVIRONMENT</span>
            <span class="info-value">Cloudflare Workers</span>
          </div>
        </div>

        <a href="/" class="pixel-btn info-back-btn">← ZURÜCK ZUM SPIEL</a>
      </div>
    </div>
  `;
}

bootstrap();
