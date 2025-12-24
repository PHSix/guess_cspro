/**
 * 房间数据模型
 */

import { RoomStatus } from "@guess-cspro/shared";
import type { Difficulty, GamerState, Player } from "./PlayerData";

/**
 * 房间信息
 */
export interface Room {
  roomId: string;
  hostGamerId: string;
  gamers: Map<string, GamerState>;
  status: RoomStatus;
  /** 游戏难度 */
  difficulty: Difficulty;
  /** 神秘玩家（答案） */
  mysteryPlayer: Player | null;
  createdAt: Date;
  startedAt?: Date;
}
