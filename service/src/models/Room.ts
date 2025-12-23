/**
 * 房间数据模型
 */

import type { GamerState, Player } from "./PlayerData";

/**
 * 房间状态
 */
export type RoomStatus =
  | "pending" // 刚创建，等待房主确认
  | "waiting" // 等待玩家加入
  | "ready" // 所有玩家已准备，可以开始游戏
  | "inProgress" // 游戏进行中
  | "ended"; // 游戏已结束

/**
 * 房间信息
 */
export interface Room {
  roomId: string;
  hostGamerId: string;
  gamers: Map<string, GamerState>;
  status: RoomStatus;
  /** 游戏难度 */
  difficulty: string;
  /** 神秘玩家（答案） */
  mysteryPlayer: Player | null;
  createdAt: Date;
  startedAt?: Date;
}
