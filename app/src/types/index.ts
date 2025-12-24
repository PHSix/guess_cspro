/**
 * Type definitions for the app
 * Most types are now imported from @shared for consistency
 */

// Re-export all shared API types
export type {
  CreateRoomRequest,
  JoinRoomRequest,
  ReadyRequest,
  GuessRequest,
  EmptyRequest,
  CreateRoomResponse,
  JoinRoomResponse,
  SuccessResponse,
  ErrorResponse,
  ApiResponse,
  RoomStatus,
  Difficulty,
  ServerGamerInfo,
  GamerInfo,
} from "@shared/api";

// Re-export all SSE event types
export type {
  ConnectedEventData,
  RoomStateEventData,
  HeartbeatEventData,
  GamerJoinedEventData,
  GamerLeftEventData,
  ReadyUpdateEventData,
  AllReadyEventData,
  GameStartedEventData,
  GuessResultEventData,
  GameEndedEventData,
  RoomEndedEventData,
  SSEEventDataSet,
  SSEEventName,
  SSEEvent,
} from "@shared/sse";
