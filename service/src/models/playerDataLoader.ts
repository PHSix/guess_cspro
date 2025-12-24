/**
 * 玩家数据加载器
 * 从共享数据文件加载玩家数据并提供查询功能
 */

import path from "path";
import fs from "fs";
import type { Player, Difficulty } from "@guess-cspro/shared";

/** 服务器玩家数据原始格式 */
interface ServerPlayerData {
  [key: string]: {
    team: string;
    country: string;
    birth_year: number;
    majorsPlayed: number;
    role: string;
  };
}

/** 缓存的玩家数据 */
let cachedPlayers: Player[] | null = null;

/** 模式玩家列表 */
interface ModePlayerList {
  ylg: string[];
  normal: string[];
}

/** 缓存的模式玩家列表 */
let cachedModeList: ModePlayerList | null = null;

/**
 * 获取数据文件路径
 */
function getDataFilePath(filename: string): string {
  // 从 shared/data 目录读取
  return path.resolve(import.meta.dirname, "../../../shared/data", filename);
}

/**
 * 加载所有玩家数据
 *
 * @returns 玩家列表
 */
export function loadAllPlayers(): Player[] {
  if (cachedPlayers) {
    return cachedPlayers;
  }

  try {
    const dataPath = getDataFilePath("all_players_data.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const playersData = JSON.parse(rawData) as ServerPlayerData;

    cachedPlayers = Object.entries(playersData).map(([key, data]) => ({
      id: key,
      proId: key,
      team: data.team || "Unknown",
      country: data.country || "Unknown",
      birthYear: data.birth_year || 2000,
      majorsPlayed: data.majorsPlayed || 0,
      role: (data.role || "Unknown") as "AWPer" | "Rifler" | "Unknown",
      lowerProId: key.toLowerCase(),
      filterProId: key
        .toLowerCase()
        .replace("1", "i")
        .replace("0", "o")
        .replace("3", "e"),
    }));

    return cachedPlayers;
  } catch (error) {
    console.error("Failed to load players data:", error);
    return [];
  }
}

/**
 * 加载模式玩家列表
 *
 * @returns 模式玩家列表
 */
export function loadModePlayerList(): ModePlayerList {
  if (cachedModeList) {
    return cachedModeList;
  }

  try {
    const dataPath = getDataFilePath("mode_player_list.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    cachedModeList = JSON.parse(rawData) as ModePlayerList;

    return cachedModeList;
  } catch (error) {
    console.error("Failed to load mode player list:", error);
    return { ylg: [], normal: [] };
  }
}

/**
 * 根据难度获取玩家列表
 *
 * @param difficulty - 难度等级
 * @returns 玩家列表
 */
export function getPlayersByDifficulty(difficulty: Difficulty): Player[] {
  const allPlayers = loadAllPlayers();

  if (difficulty === "all") {
    return allPlayers;
  }

  const modeList = loadModePlayerList();
  const allowedProIds = modeList[difficulty] || [];

  return allPlayers.filter(player => allowedProIds.includes(player.proId));
}

/**
 * 获取所有玩家（兼容旧代码）
 *
 * @deprecated 使用 getPlayersByDifficulty("all") 代替
 */
export function getMysteryPlayers(): Player[] {
  return getPlayersByDifficulty("all");
}

/**
 * 根据玩家名查找玩家
 *
 * @param name - 玩家名
 * @param difficulty - 难度等级（可选，默认 "all"）
 * @returns 找到的玩家或 undefined
 */
export function findPlayerByName(
  name: string,
  difficulty?: Difficulty
): Player | undefined {
  const players = difficulty
    ? getPlayersByDifficulty(difficulty)
    : getMysteryPlayers();

  return players.find(p => p.proId.toLowerCase() === name.toLowerCase());
}

/**
 * 从玩家列表中随机选择一个
 *
 * @param difficulty - 难度等级（可选，默认 "all"）
 * @returns 随机玩家
 */
export function getRandomPlayer(difficulty?: Difficulty): Player {
  const players = difficulty
    ? getPlayersByDifficulty(difficulty)
    : getMysteryPlayers();

  return players[Math.floor(Math.random() * players.length)];
}

/**
 * 清除缓存（用于测试或数据更新）
 */
export function clearCache(): void {
  cachedPlayers = null;
  cachedModeList = null;
}
