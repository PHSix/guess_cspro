/**
 * 玩家相关数据模型
 * 使用共享类型定义
 */

// 导入共享类型
import type {
  Player,
  Mask,
  MaskType,
  PlayerRole,
  Difficulty,
} from "@guess-cspro/shared";

// 重新导出共享类型
export type { Player, Mask, MaskType as MatchType, PlayerRole, Difficulty };

/**
 * 猜测记录
 */
export interface Guess {
  guessId: string;
  mask: Mask;
}

/**
 * 游戏者状态
 */
export interface GamerState {
  gamerId: string;
  gamerName: string;
  ready: boolean;
  joinedAt: Date;
  guessesLeft: number;
  guesses: Guess[];
}

// 为了向后兼容，导出 MysteryPlayer 作为 Player 的别名
export type { Player as MysteryPlayer };
