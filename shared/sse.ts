/**
 * SSE (Server-Sent Events) event data schemas
 * Each event has a dedicated interface for type safety
 * Also includes Zod schemas for runtime validation
 */

import { z } from "zod";
import type { Mask } from "./gameEngine";
import type { MysteryPlayer, ServerGamerInfo, RoomStatus } from "./api";

// ==================== SSE Event Data Interfaces ====================

/**
 * Connected event data
 * Sent when SSE connection is established
 */
export interface ConnectedEventData {
  gamerId: string;
  gamerName: string;
  roomId: string;
}

/**
 * Room state event data
 * Sent on connection with full room state
 */
export interface RoomStateEventData {
  gamers: ServerGamerInfo[];
  roomStatus: RoomStatus;
}

/**
 * Heartbeat event data
 * Sent every 30 seconds to keep connection alive
 */
export interface HeartbeatEventData {
  timestamp: string; // ISO string
}

/**
 * Gamer joined event data
 */
export interface GamerJoinedEventData {
  gamerId: string;
  gamerName: string;
}

/**
 * Gamer left event data
 */
export interface GamerLeftEventData {
  gamerId: string;
}

/**
 * Ready status update event data
 */
export interface ReadyUpdateEventData {
  gamerId: string;
  ready: boolean;
}

/**
 * All ready event data
 * Sent when all non-host gamers are ready
 */
export interface AllReadyEventData {
  /** Empty object */
}

/**
 * Game started event data
 */
export interface GameStartedEventData {
  status: "inProgress";
}

/**
 * Guess result event data
 * Sent when a player submits a guess
 */
export interface GuessResultEventData {
  gamerId: string;
  guessId: string;
  mask: Mask;
  guessesLeft: number;
}

/**
 * Game ended event data
 */
export interface GameEndedEventData {
  winner?: string; // undefined if no winner (all guesses exhausted)
  mysteryPlayer: MysteryPlayer;
}

/**
 * Room ended event data
 * Sent when room is closed/disbanded
 */
export interface RoomEndedEventData {
  /** Empty object */
}

// ==================== SSE Event Union ====================

/**
 * Union type of all SSE event data
 * Maps event name to its data type
 */
export interface SSEEventDataSet {
  connected: ConnectedEventData;
  roomState: RoomStateEventData;
  heartbeat: HeartbeatEventData;
  gamerJoined: GamerJoinedEventData;
  gamerLeft: GamerLeftEventData;
  readyUpdate: ReadyUpdateEventData;
  gameStarted: GameStartedEventData;
  guessResult: GuessResultEventData;
  gameEnded: GameEndedEventData;
  roomEnded: RoomEndedEventData;
}

/**
 * Extract event names
 */
export type SSEEventName = keyof SSEEventDataSet;

/**
 * Generic SSE event wrapper
 */
export interface SSEEvent<T extends SSEEventName = SSEEventName> {
  event: T;
  data: SSEEventDataSet[T];
}

// ==================== Zod Schemas for Validation ====================

/**
 * Zod schema for Mask (from gameEngine)
 */
export const MaskSchema = z.object({
  guessId: z.enum(["M", "N", "D"]),
  team: z.enum(["M", "N", "D"]),
  country: z.enum(["M", "N", "D"]),
  age: z.enum(["M", "N", "D", "G", "L"]),
  majorsPlayed: z.enum(["M", "N", "D", "G", "L"]),
  role: z.enum(["M", "N", "D"]),
}) as z.ZodType<Mask>;

/**
 * Zod schema for MysteryPlayer
 */
export const MysteryPlayerSchema = z.object({
  id: z.union([z.string(), z.number()]),
  proId: z.string(),
  playerName: z.string(),
  team: z.string(),
  country: z.string(),
  birthYear: z.number(),
  majorsPlayed: z.number(),
  role: z.enum(["AWPer", "Rifler", "Unknown"]),
  lowerProId: z.string(),
  filterProId: z.string(),
}) satisfies z.ZodType<MysteryPlayer>;

/**
 * Zod schema for ServerGamerInfo
 */
export const ServerGamerInfoSchema = z.object({
  gamerId: z.string(),
  gamerName: z.string(),
  ready: z.boolean(),
  joinedAt: z.string(),
});

/**
 * Zod schema for ConnectedEventData
 */
export const ConnectedEventSchema = z.object({
  gamerId: z.string().uuid(),
  gamerName: z.string(),
  roomId: z.string().uuid(),
}) satisfies z.ZodType<ConnectedEventData>;

/**
 * Zod schema for RoomStateEventData
 */
export const RoomStateEventSchema = z.object({
  gamers: z.array(ServerGamerInfoSchema),
  roomStatus: z.enum(["pending", "waiting", "inProgress", "ended"]),
}) satisfies z.ZodType<RoomStateEventData>;

/**
 * Zod schema for HeartbeatEventData
 */
export const HeartbeatEventSchema = z.object({
  timestamp: z.string(),
}) satisfies z.ZodType<HeartbeatEventData>;

/**
 * Zod schema for GamerJoinedEventData
 */
export const GamerJoinedEventSchema = z.object({
  gamerId: z.string().uuid(),
  gamerName: z.string(),
}) satisfies z.ZodType<GamerJoinedEventData>;

/**
 * Zod schema for GamerLeftEventData
 */
export const GamerLeftEventSchema = z.object({
  gamerId: z.string().uuid(),
}) satisfies z.ZodType<GamerLeftEventData>;

/**
 * Zod schema for ReadyUpdateEventData
 */
export const ReadyUpdateEventSchema = z.object({
  gamerId: z.string().uuid(),
  ready: z.boolean(),
}) satisfies z.ZodType<ReadyUpdateEventData>;

/**
 * Zod schema for AllReadyEventData
 */
export const AllReadyEventSchema = z.object(
  {}
) satisfies z.ZodType<AllReadyEventData>;

/**
 * Zod schema for GameStartedEventData
 */
export const GameStartedEventSchema = z.object({
  status: z.literal("inProgress"),
}) satisfies z.ZodType<GameStartedEventData>;

/**
 * Zod schema for GuessResultEventData
 */
export const GuessResultEventSchema = z.object({
  gamerId: z.string().uuid(),
  guessId: z.string(),
  mask: MaskSchema,
  guessesLeft: z.number().int().min(0).max(8),
}) satisfies z.ZodType<GuessResultEventData>;

/**
 * Zod schema for GameEndedEventData
 */
export const GameEndedEventSchema = z.object({
  winner: z.string().optional(),
  mysteryPlayer: MysteryPlayerSchema,
}) satisfies z.ZodType<GameEndedEventData>;

/**
 * Zod schema for RoomEndedEventData
 */
export const RoomEndedEventSchema = z.object(
  {}
) satisfies z.ZodType<RoomEndedEventData>;

/**
 * helper type for check
 */
type SSEEventSchemasType = {
  [K in SSEEventName]: z.ZodType<SSEEventDataSet[K]>;
};

/**
 * Map of event name to its Zod schema
 */
export const SSEEventSchemas: SSEEventSchemasType = {
  connected: ConnectedEventSchema,
  roomState: RoomStateEventSchema,
  heartbeat: HeartbeatEventSchema,
  gamerJoined: GamerJoinedEventSchema,
  gamerLeft: GamerLeftEventSchema,
  readyUpdate: ReadyUpdateEventSchema,
  gameStarted: GameStartedEventSchema,
  guessResult: GuessResultEventSchema,
  gameEnded: GameEndedEventSchema,
  roomEnded: RoomEndedEventSchema,
} as const;
