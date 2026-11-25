import { GAME_CONFIG } from './config.js';

const STORAGE_KEY = 'xmas_game_tutorial_done_v1';
const CONTINUE_LOCK_MS = 400; // ignore SPACE right after a card opens (no accidental skips)
const SPOT_LEAD_PX = 250; // freeze once the target is this far ahead of the player

/**
 * Scripted onboarding for the MVP phase: spawns each game element once,
 * freezes the game in a "spotlight moment" when it comes into view and
 * explains it on a card. Continue with SPACE.
 */
export class TutorialDirector {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.steps = this.buildSteps();
    this.total = this.steps.length;
  }

  static isDone() {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  static markDone() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // storage unavailable: tutorial simply shows again next time
    }
  }

  start() {
    this.active = true;
    this.stepIndex = 0; // next step to spawn
    this.pending = []; // spawned steps waiting for their spotlight
    this.shownCount = 0;
    this.seenPickupCards = new Set();
    this.card = null;
  }

  stop() {
    this.active = false;
    this.pending = [];
    this.card = null;
    this.game.ui.hideSpotlight();
  }

  get spawnX() {
    return this.game.viewWidth + 90;
  }

  buildSteps() {
    const G = GAME_CONFIG.GROUND_Y;
    const g = () => this.game;
    return [
      {
        at: 3,
        spawn: () => {
          const o = g().obstacles.spawn(this.spawnX, 'ground', 'DEADLINE');
          return { x: () => o.x, y: () => G - 30, r: 60, alive: () => g().obstacles.obstacles.includes(o) };
        },
        card: {
          icon: 'obstacle',
          title: 'BUZZWORD BLOCKS',
          text: 'DEADLINE, TCO, SCOPE &amp; friends block your way.<br>Press <b>SPACE</b> to jump over them.',
        },
      },
      {
        at: 20,
        spawn: () => {
          const x = this.spawnX;
          g().obstacles.spawn(x, 'ground', 'TCO');
          const arc = g().coins.arcOver(x);
          const mid = arc[2];
          return { x: () => mid.x, y: () => mid.y, r: 72, alive: () => g().coins.coins.includes(mid) };
        },
        card: {
          icon: 'coin',
          title: 'STORY POINTS',
          text: 'Grab the gold coins on your way.<br>They count as a <b>bonus</b> for your highscore.',
        },
      },
      {
        at: 40,
        spawn: () => {
          const o = g().obstacles.spawn(this.spawnX, 'flyer', 'MEETING');
          g().coins.rowUnderFlyer(o.x);
          return {
            x: () => o.x,
            y: () => o.baseY - 16,
            r: 64,
            alive: () => g().obstacles.obstacles.includes(o),
          };
        },
        card: {
          icon: 'obstacleFlyer',
          title: 'FLYING INVITES',
          text: 'Meeting invites fly in at head height.<br>Hold <b>&darr;</b> to duck under them.',
        },
      },
      {
        at: 62,
        spawn: () => {
          const x = this.spawnX;
          const low = g().platforms.create(x, 256, 0);
          g().platforms.create(x + 128, 256, 1);
          return {
            x: () => low.left + 70,
            y: () => low.top - 20,
            r: 90,
            alive: () => g().platforms.platforms.includes(low),
          };
        },
        card: {
          icon: 'platform',
          title: 'ICE PLATFORMS',
          text: 'Jump up through ice ledges to run on<br>level 2 and 3 &mdash; safe from blocks up there.<br>Press <b>&darr;</b> to drop back down.',
        },
      },
      {
        at: 100,
        spawn: () => {
          const x = this.spawnX;
          const p = g().powerups.spawn(x, 'breakthrough');
          // blocks right after it, to try the power-up on
          g().obstacles.spawn(x + 200, 'ground', 'SCOPE');
          g().obstacles.spawn(x + 420, 'ground', 'MILESTONE');
          return {
            x: () => p.container.x,
            y: () => p.container.y,
            r: 52,
            alive: () => g().powerups.pickups.includes(p),
          };
        },
        card: {
          icon: 'powerupMerkle',
          title: 'MERKLE LOGO',
          accent: GAME_CONFIG.POWERUPS.breakthrough.cssColor,
          text: 'A power-up! <b>Jump</b> to grab the Merkle logo.',
        },
      },
      {
        at: 150,
        spawn: () => {
          const x = this.spawnX;
          const p = g().powerups.spawn(x, 'doubleJump');
          g().obstacles.spawn(x + 220, 'ground', 'PRODUCTION');
          g().obstacles.spawn(x + 440, 'ground', 'MVP');
          return {
            x: () => p.container.x,
            y: () => p.container.y,
            r: 52,
            alive: () => g().powerups.pickups.includes(p),
          };
        },
        card: {
          icon: 'powerupArc',
          title: 'ARC LOGO',
          accent: GAME_CONFIG.POWERUPS.doubleJump.cssColor,
          text: 'Another power-up! <b>Jump</b> to grab the Arc logo.',
        },
      },
      {
        at: 200,
        spawn: () => {
          g().obstacles.spawn(this.spawnX, 'ground', 'DEADLINE');
          g().obstacles.spawn(this.spawnX + 300, 'flyer', 'ASAP');
          const line = g().world.productionLine;
          return {
            x: () => line.x,
            y: () => G - 130,
            r: 95,
            lead: SPOT_LEAD_PX + 60,
            alive: () => true,
          };
        },
        card: {
          icon: null,
          badge: 'REAL PRODUCTION',
          title: 'GO LIVE!',
          accent: '#e02f40',
          text: 'So far you were in the <b>MVP phase</b> &mdash; crashing was free.<br>Beyond this line it is production:<br><b>one hit and the game is over.</b> Good luck!',
        },
        isFinal: true,
      },
    ];
  }

  /** Disables the random spawners while the scripted track is running */
  holdRandomSpawners() {
    const g = this.game;
    g.obstacles.spawnTimer = Infinity;
    g.platforms.timer = Infinity;
    g.powerups.cooldown = Infinity;
  }

  releaseRandomSpawners() {
    const g = this.game;
    g.obstacles.spawnTimer = 1.4;
    g.platforms.timer = 5;
    g.powerups.cooldown = 4;
  }

  /**
   * Called every PLAYING frame after the world moved.
   * @returns {boolean} true if a spotlight just opened (game should freeze)
   */
  update(distanceMeters) {
    if (!this.active) return false;
    this.holdRandomSpawners();

    // Spawn the next scripted element
    const next = this.steps[this.stepIndex];
    if (next && distanceMeters >= next.at) {
      this.pending.push({ step: next, target: next.spawn() });
      this.stepIndex += 1;
    }

    // Spotlight a pending element as soon as it comes into view
    const playerX = this.game.player.x;
    for (let i = 0; i < this.pending.length; i++) {
      const { step, target } = this.pending[i];
      if (!target.alive()) {
        this.pending.splice(i, 1);
        i--;
        continue;
      }
      const lead = target.lead ?? SPOT_LEAD_PX;
      if (target.x() <= playerX + lead) {
        this.pending.splice(i, 1);
        this.shownCount += 1;
        this.open({
          ...step.card,
          step: `NEW IN YOUR PROJECT \u00b7 ${this.shownCount}/${this.total}`,
          target,
          isFinal: !!step.isFinal,
        });
        return true;
      }
    }
    return false;
  }

  /** Extra card when a power-up is caught for the first time */
  onPowerUpCollected(type) {
    if (!this.active || this.seenPickupCards.has(type)) return false;
    this.seenPickupCards.add(type);
    const def = GAME_CONFIG.POWERUPS[type];
    const p = this.game.player;
    const text =
      type === 'breakthrough'
        ? `For <b>${def.duration} seconds</b> you smash right<br>through every block and invite.`
        : `For <b>${def.duration} seconds</b>: press <b>SPACE</b> again<br>in mid-air to jump a second time.`;
    this.open({
      icon: def.sprite,
      title: def.label,
      accent: def.cssColor,
      step: 'POWER-UP ACTIVE',
      text,
      target: { x: () => p.x, y: () => p.centerY, r: 60 },
    });
    return true;
  }

  open(card) {
    this.card = { ...card, openedAt: performance.now() };
    const scale = this.game.worldContainer.scale.x;
    this.game.ui.showSpotlight({
      ...card,
      screenX: card.target.x() * scale,
      screenY: card.target.y() * scale,
      screenR: card.target.r * scale * 0.5,
    });
  }

  /** SPACE / tap while a card is open. Returns true if the game may resume. */
  tryContinue() {
    if (!this.card) return true;
    if (performance.now() - this.card.openedAt < CONTINUE_LOCK_MS) return false;
    const wasFinal = this.card.isFinal;
    this.card = null;
    this.game.ui.hideSpotlight();
    if (wasFinal) {
      TutorialDirector.markDone();
      this.active = false;
      this.releaseRandomSpawners();
    }
    return true;
  }
}
