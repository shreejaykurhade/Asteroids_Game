// Game Constants
export const FPS = 30;
export const FRICTION = 0.7;
export const GAME_LIVES = 3;
export const LASER_DIST = 0.6;
export const LASER_EXPLODE_DUR = 0.1;
export const LASER_MAX = 10;
export const LASER_SIZE = 5;
export const LASER_SPD = 500;
export const ROID_JAG = 0.4;
export const ROID_PTS_LGE = 20;
export const ROID_PTS_MED = 50;
export const ROID_PTS_SML = 100;
export const ROID_NUM = 3;
export const ROID_SIZE = 100;
export const ROID_SPD = 50;
export const ROID_VERT = 10;
export const SAVE_KEY_LEADERBOARD = "asteroid_leaderboard";
export const SHIP_BLINK_DUR = 0.1;
export const SHIP_EXPLODE_DUR = 0.3;
export const SHIP_INV_DUR = 3;
export const SHIP_SIZE = 30;
export const SHIP_THRUST = 5;
export const SHIP_TURN_SPD = 360;
export const SHOW_BOUNDING = false;
export const SHOW_CENTRE_DOT = false;
export const TEXT_FADE_TIME = 2.5;
export const TEXT_SIZE = 40;

export const distBetweenPoints = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};
