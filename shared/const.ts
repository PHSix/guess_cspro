export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// Custom SSE event types
export enum EsCustomEvent {
  CONNECTED = "connected",
  ROOM_STATE = "roomState",
  HEARTBEAT = "heartbeat",
  GAMER_JOINED = "gamerJoined",
  GAMER_LEFT = "gamerLeft",
  READY_UPDATE = "readyUpdate",
  GAME_STARTED = "gameStarted",
  GUESS_RESULT = "guessResult",
  GAME_ENDED = "gameEnded",
  ROOM_ENDED = "roomEnded",
}

export const EsCustomEventList: string[] = Object.values(EsCustomEvent);
