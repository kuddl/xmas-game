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
  MVP_DISTANCE_METERS: 250,

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
  LEADERBOARD_KEY: 'xmas_game_local_leaderboard_v1',

  // Power-Ups (brand logos as collectibles)
  POWERUP_SIZE: 32, // 16x16 sprite @ 2x
  POWERUP_HEIGHT_ABOVE_GROUND: 74, // reachable only by jumping
  POWERUP_FIRST_DELAY: 5, // seconds before the first power-up may appear
  POWERUP_MIN_INTERVAL: 7,
  POWERUP_MAX_INTERVAL: 12,
  POWERUP_MIN_GAP_PX: 200, // only spawn in obstacle gaps at least this wide
  POWERUP_WARNING_TIME: 1.5, // blink when this much time is left
  DOUBLE_JUMP_VELOCITY: -410,

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
