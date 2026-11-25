export const GAME_CONFIG = {
  // Virtual 2D world height in Three.js units (width scales with aspect ratio)
  WORLD_HEIGHT: 12,
  GROUND_Y: -3.6,

  // Player dimensions & physics
  PLAYER_SIZE: 1.55,
  PLAYER_BASE_X: -5.0,
  PLAYER_MIN_X: -7.0,
  PLAYER_MAX_X: -2.2,
  PLAYER_NUDGE_SPEED: 4.5,
  JUMP_VELOCITY: 14.5,
  GRAVITY: -36.0,
  COYOTE_TIME: 0.08,
  JUMP_BUFFER_TIME: 0.1,

  // Scroll speed (units/sec) & Left/Right modulation
  BASE_SCROLL_SPEED: 7.5,
  MIN_SPEED_MULTIPLIER: 0.72,
  MAX_SPEED_MULTIPLIER: 1.32,
  // Gentle speed ramp after Real Production starts
  PROD_SPEED_RAMP_PER_100M: 0.35,
  MAX_SCROLL_SPEED: 13.5,

  // Progression: MVP-Phase -> Real Production
  MVP_DISTANCE_UNITS: 250, // ~30s warm-up safe zone
  METERS_PER_UNIT: 1.0,

  // Obstacles (Ticket 02 & 04)
  OBSTACLE_WIDTH: 1.45,
  OBSTACLE_HEIGHT: 1.45,
  OBSTACLE_MIN_GAP_TIME: 1.15, // seconds at current speed
  OBSTACLE_MAX_GAP_TIME: 2.35, // seconds at current speed
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
};
