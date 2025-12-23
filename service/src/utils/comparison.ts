/**
 * 玩家猜测比较工具
 * 使用共享游戏引擎模块进行比较
 */
// 导出共享的类型和函数，方便其他模块使用
export type { Player, Mask, Difficulty } from "@guess-cspro/shared";
export {
  findPlayerByName,
  getRandomPlayer,
  getPlayersByDifficulty,
} from "../models/playerDataLoader";
