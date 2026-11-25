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
};
