/**
 * Shared API types for online multiplayer
 * Used by both frontend (app) and backend (service)
 */

import type { Player, Difficulty } from "./gameEngine";

/**
 * Room status enum
 */
export type RoomStatus = "pending" | "waiting" | "inProgress" | "ended";

// Re-export Difficulty from gameEngine for convenience
export type { Difficulty };

// ==================== Request Types ====================

/**
 * Create room request
 */
export interface CreateRoomRequest {
  gamerId: string;
  gamerName: string;
  difficulty?: Difficulty;
}

/**
 * Join room request
 */
export interface JoinRoomRequest {
  gamerId: string;
  gamerName: string;
  roomId: string;
}

/**
 * Ready status toggle request
 */
export interface ReadyRequest {
  ready: boolean;
}

/**
 * Guess submission request
 */
export interface GuessRequest {
  guess: string; // Player proId
}

/**
 * Empty request body (for /room/start, /room/leave, /room/heartbeat)
 */
export interface EmptyRequest {}

// ==================== Response Types ====================

/**
 * Create room response
 */
export interface CreateRoomResponse {
  roomId: string;
  sessionId: string;
}

/**
 * Join room response
 */
export interface JoinRoomResponse {
  sessionId: string;
  difficulty: Difficulty;
}

/**
 * Success response
 */
export interface SuccessResponse {
  success: true;
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  message: string;
}

/**
 * Generic API response union
 */
export type ApiResponse =
  | CreateRoomResponse
  | JoinRoomResponse
  | SuccessResponse
  | ErrorResponse;

// ==================== Common Types ====================

/**
 * Mystery player (answer)
 * Extends Player with additional fields
 */
export interface MysteryPlayer extends Player {
  id: string | number;
  playerName: string;
  team: string;
  country: string;
  birthYear: number;
  majorsPlayed: number;
  role: "AWPer" | "Rifler" | "Unknown";
}

/**
 * Gamer information (from server perspective)
 */
export interface ServerGamerInfo {
  gamerId: string;
  gamerName: string;
  ready: boolean;
  joinedAt: string; // ISO string
}

/**
 * Gamer information (client-side with Date)
 */
export interface GamerInfo {
  gamerId: string;
  gamerName: string;
  ready: boolean;
  joinedAt: Date;
  guessesLeft: number;
  guesses: import("./gameEngine").Guess[];
}
