import './style.css';
import { AssetLoader } from './assetLoader.js';
import { Game } from './game.js';

async function bootstrap() {
  const assetLoader = new AssetLoader();
  try {
    await assetLoader.loadAll();
    new Game(assetLoader);
  } catch (err) {
    console.error('Failed to initialize Christmas Game:', err);
  }
}

bootstrap();
