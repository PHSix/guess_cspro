export interface MysteryPlayer {
  id: string;
  playerName: string;
  team: string;
  country: string;
  birthYear: number;
  majorsPlayed: number;
  role: "AWPer" | "Rifler" | "Unknown";
}

export interface CreateRoomRequest {
  gamerId: string;
  gamerName: string;
}

export interface JoinRoomRequest {
  gamerId: string;
  gamerName: string;
  roomId: string;
}

export type MatchType = "M" | "N" | "D";

export interface Mask {
  playerName: MatchType;
  team: MatchType;
  country: MatchType;
  birthYear: MatchType;
  majorsPlayed: MatchType;
  role: MatchType;
}

export interface Guess {
  guessId: string;
  playerName: string;
  team: string;
  country: string;
  age: number;
  majorMaps: number;
  role: string;
  mask: Mask;
}

export interface GamerInfo {
  gamerId: string;
  gamerName: string;
  ready: boolean;
  joinedAt: Date;
  guessesLeft: number;
  guesses: Guess[];
}

export type RoomStatus =
  | "pending"
  | "waiting"
  | "ready"
  | "inProgress"
  | "ended";

export interface SSEEventData {
  connected: { gamerId: string; gamerName: string };
  gamerJoined: { gamerId: string; gamerName: string };
  gamerLeft: { gamerId: string };
  readyUpdate: { gamerId: string; ready: boolean };
  allReady: {};
  gameStarted: { status: "inProgress" };
  guessResult: {
    gamerId: string;
    guessId: string;
    mask: Mask;
    guessesLeft: number;
  };
  gameEnded: {
    status: "ended";
    winner?: string;
    mysteryPlayer: MysteryPlayer;
  };
  roomEnded: {};
}

export interface CreateRoomResponse {
  roomId: string;
  sessionId: string;
}

export interface JoinRoomResponse {
  sessionId: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
}

export interface SuccessResponse {
  success: true;
}

export type ApiResponse =
  | CreateRoomResponse
  | JoinRoomResponse
  | ErrorResponse
  | SuccessResponse;
