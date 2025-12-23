import type { GamerState, MysteryPlayer } from "./PlayerData.js";

export type RoomStatus =
  | "pending"
  | "waiting"
  | "ready"
  | "inProgress"
  | "ended";

export interface Room {
  roomId: string;
  hostGamerId: string;
  gamers: Map<string, GamerState>;
  status: RoomStatus;
  mysteryPlayer: MysteryPlayer | null;
  createdAt: Date;
  startedAt?: Date;
}
