export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  POINTS_TO_ADVANCE: 5,
  CARDS_PER_LEVEL: 10,
  TOTAL_LEVELS: 3,
  SKIP_CARD_PENALTY: 0,
  ANSWER_CARD_POINTS: 1
};

export const LEVEL_NAMES = {
  1: 'Percepción',
  2: 'Conexión', 
  3: 'Reflexión'
};

export const LEVEL_DESCRIPTIONS = {
  1: 'Primeras impresiones y percepciones',
  2: 'Conexiones más profundas y personales',
  3: 'Reflexiones íntimas y vulnerables'
};

export const UI_CONFIG = {
  CARD_TRANSITION_DURATION: 300,
  LEVEL_CHANGE_DELAY: 1500,
  AUTO_SAVE_INTERVAL: 30000
};

export const STORAGE_KEYS = {
  GAME_STATE: 'wnrs_game_state',
  GAME_HISTORY: 'wnrs_game_history',
  PLAYER_PREFERENCES: 'wnrs_player_preferences'
};