export const GAME_CONFIG = {
  // Virtual 2D pixel-art height (width adapts to viewport aspect ratio)
  VIRTUAL_HEIGHT: 360,
  GROUND_Y: 292,
  PIXELS_PER_METER: 30,

  // Player dimensions & physics (virtual pixels, Y-down)
  PLAYER_SIZE: 48, // 16x16 sprite @ 3x crisp pixel scale
  PLAYER_BASE_X: 140,
  PLAYER_MIN_X: 70,
  PLAYER_MAX_X: 250,
  PLAYER_NUDGE_SPEED: 140,
  JUMP_VELOCITY: -450,
  GRAVITY: 1180,
  COYOTE_TIME: 0.08,
  JUMP_BUFFER_TIME: 0.1,

  // Scroll speed (virtual px/sec) & Left/Right modulation
  BASE_SCROLL_SPEED: 225,
  MIN_SPEED_MULTIPLIER: 0.72,
  MAX_SPEED_MULTIPLIER: 1.32,
  PROD_SPEED_RAMP_PER_100M: 12,
  MAX_SCROLL_SPEED: 410,

  // Progression: MVP-Phase -> Real Production (in meters)
  MVP_DISTANCE_METERS: 175,
  // MVP "staging" look: backdrop (sky + parallax) is cooler, desaturated and slightly blurred,
  // fades to full colour once the player crosses the REAL PRODUCTION line
  MVP_BACKDROP: {
    SATURATION: -0.5, // -1 = greyscale, 0 = unchanged
    TINT: 0xc4d6f2, // cool blue-grey multiply
    BLUR: 2, // blur strength (0 = off)
    FADE_SECONDS: 1, // crossfade to production colours
  },

  // Obstacles (Ticket 02 & 04)
  OBSTACLE_WIDTH: 48, // 24x24 sprite @ 2x crisp pixel scale
  OBSTACLE_HEIGHT: 48,
  OBSTACLE_MIN_GAP_TIME: 1.15,
  OBSTACLE_MAX_GAP_TIME: 2.35,
  FIRST_OBSTACLE_DELAY: 1.6,

  BUZZWORDS: [
    'DEADLINE',
    'TCO',
    'SCOPE',
    'MILESTONE',
    'MVP',
    'PRODUCTION',
  ],

  // Local leaderboard storage key
  LEADERBOARD_KEY: 'xmas_game_local_leaderboard_v2', // v2: scores are PTS (v1 stored meters)

  // Score (Ticket #3): SCORE = meters + story points * factor
  SP_SCORE_FACTOR: 10,
  BREAKTHROUGH_SMASH_SP: 5, // story points per block smashed with MERKLE BREAKTHROUGH
  GAME_OVER_INPUT_LOCK_MS: 600, // game-over buttons ignore clicks right after dying
  LEADERBOARD_SIZE: 20, // entries kept locally and shown on the leaderboard screen

  // Online leaderboard (ticket 024): top 20, claimed with a company e-mail + nickname.
  // Shared by the game (src/) and the server (server/), so the limits follow the game tuning.
  ONLINE: {
    API_BASE: '/api',
    CLAIM_WINDOW_SECONDS: 60, // claim only on the game-over screen, within this time
    CHECKPOINT_SECONDS: 10, // the game reports distance + SP this often
    RUN_MAX_MINUTES: 30, // a run token is useless after this
    EMAIL_DOMAINS: ['merkle.com', 'dentsu.com'],
    NICKNAME_MAX: 16,
    // plausibility: fastest possible run (MAX_SCROLL_SPEED * MAX_SPEED_MULTIPLIER) and SP rate
    MAX_SP_PER_SECOND: 4, // coins + breakthrough smashes, generous
    TOLERANCE: 1.15, // +15 % on every upper bound
    RATE_LIMIT_RUNS_PER_MINUTE: 20, // per IP
    RATE_LIMIT_CLAIMS_PER_MINUTE: 5, // per IP
  },

  // Ducking & flying obstacles (Ticket 08)
  FAST_FALL_MULTIPLIER: 1.9, // gravity boost while holding ↓ in the air
  PLATFORM_DROP_TIME: 0.22, // seconds platforms are ignored after pressing ↓ on one
  FLYER_START_METERS: 60, // flying obstacles appear after this distance
  FLYER_CHANCE: 0.35,
  FLYER_BOTTOM_ABOVE_GROUND: 30, // envelope bottom; ducked player (~22px) fits below, standing (~39px) does not
  FLYER_EXTRA_SPEED: 45, // flyers move a bit faster than the world
  FLYER_BUZZWORDS: ['MEETING', 'SCOPE CREEP', 'ASAP', 'KPI', 'REPLY ALL'],

  // Elevated platforms = Ebene 2 & 3 (Ticket 09)
  PLATFORM_LEVELS: [72, 144], // platform top height above ground for level 2 and 3
  PLATFORM_HEIGHT: 16, // 16x8 tile @ 2x
  PLATFORM_FIRST_DELAY: 6,
  PLATFORM_MIN_INTERVAL: 6,
  PLATFORM_MAX_INTERVAL: 11,
  PLATFORM_MIN_WIDTH: 192,
  PLATFORM_MAX_WIDTH: 320,
  PLATFORM_STAIR_CHANCE: 0.5, // chance a level-3 platform is stacked on top
  PLATFORM_CLEARANCE_BEFORE: 70, // px kept free of obstacles before a platform starts
  PLATFORM_CLEARANCE_AFTER_TIME: 1.2, // seconds of run-out kept free after a platform ends

  // Story Points (gold coins)
  COIN_SIZE: 24, // 12x12 sprite @ 2x
  COIN_SPACING: 28,
  COIN_PICKUP_RADIUS: 11,
  COIN_ARC_CHANCE: 0.5, // arc of coins over a ground block (shows the jump path)
  COIN_UNDER_FLYER_CHANCE: 0.7, // low row under a flyer (rewards ducking)
  COIN_GAP_ROW_CHANCE: 0.35, // ground row inside a wide gap
  COIN_PLATFORM_ROW_CHANCE: 0.8, // row along the top of a platform
  COIN_ROW_HEIGHT: 16, // coin center above the walking surface

  // Power-Ups (brand logos as collectibles)
  POWERUP_SIZE: 32, // 16x16 sprite @ 2x
  POWERUP_HEIGHT_ABOVE_GROUND: 74, // reachable only by jumping
  POWERUP_FIRST_DELAY: 5, // seconds before the first power-up may appear
  POWERUP_MIN_INTERVAL: 7,
  POWERUP_MAX_INTERVAL: 12,
  POWERUP_MIN_GAP_PX: 200, // only spawn in obstacle gaps at least this wide
  POWERUP_WARNING_TIME: 1.5, // blink when this much time is left
  DOUBLE_JUMP_VELOCITY: -410,

  // Coin cloud (#17): after grabbing the Arc logo, a cloud of coins appears
  // high in the air, only reachable with the double jump
  COIN_CLOUD: {
    ROWS: [6, 7, 5], // coins per row, bottom -> top (18 total)
    BOTTOM_ABOVE_GROUND: 152, // single jump tops out at ~145 incl. pickup radius
    ROW_GAP: 20,
    DELAY: 0.6, // seconds after the pickup
    LEAD_PX: 600, // spawn this far ahead of the player (or just off-screen, if closer)
    POP_TIME: 0.35, // puff-in animation
  },

  // Creative-mode mushrooms (#14): harmless ground pickup, pink + blur for a few seconds
  CREATIVE_MODE: {
    label: 'CREATIVE MODE',
    hint: 'YOU CHANGED A COLOR TOKEN IN FIGMA',
    cssColor: '#e8458b',
    duration: 5, // seconds; another mushroom restarts the timer
    fade: 0.4, // fade in / out
    tint: [1.0, 0.42, 0.78], // pink overlay (r, g, b in 0..1)
    tintAmount: 0.35, // 0 = off, 1 = solid pink
    blur: 1.5, // blur strength at full effect
    firstDelay: 10, // seconds into REAL PRODUCTION before the first mushroom
    minInterval: 25,
    maxInterval: 40,
    minGapPx: 240, // only in wide gaps, centered (never right before a block)
    size: 32, // 16x16 sprite @ 2x
  },

  POWERUPS: {
    breakthrough: {
      sprite: 'powerupMerkle',
      label: 'MERKLE BREAKTHROUGH',
      hint: 'SMASH THROUGH BLOCKS!',
      duration: 5,
      color: 0xf23a1d,
      cssColor: '#f23a1d',
    },
    doubleJump: {
      sprite: 'powerupArc',
      label: 'ARC DOUBLE JUMP',
      hint: 'SPACE AGAIN IN THE AIR!',
      duration: 5,
      color: 0x6f8cff,
      cssColor: '#6f8cff',
    },
  },
};
