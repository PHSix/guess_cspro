import { usePlayerStore } from "@/store/usePlayerStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import {} from "@/types";
import { Guess, Mask, Player } from "@shared/gameEngine";

export type Difficulty = "all" | "normal" | "ylg";

/**
 * 获取当前难度设置
 */
function getCurrentDifficulty(): Difficulty {
  return useSettingsStore.getState().difficulty;
}

/**
 * 获取所有选手（从全局状态）
 */
export function getAllPlayers(): Player[] {
  const store = usePlayerStore.getState();
  const difficulty = getCurrentDifficulty();
  return store.getPlayersByMode(difficulty);
}

/**
 * 搜索选手（快速搜索）
 */
export function searchPlayers(query: string): Player[] {
  if (!query.trim()) return [];

  const players = getAllPlayers();
  const lowerQuery = query.toLowerCase();

  // 搜索匹配项并按匹配度排序
  const matchedPlayers = players
    .filter(p => {
      const playerNameLower = p.proId.toLowerCase();
      // 检查是否匹配（包含匹配）
      return playerNameLower.includes(lowerQuery);
    })
    .map(p => {
      // 计算匹配分数：开头匹配分数更高
      if (p.filterProId.startsWith(lowerQuery)) {
        const index = p.filterProId.indexOf(lowerQuery);
        return { player: p, score: 2, index };
      } else {
        const startsWithScore = p.filterProId.startsWith(lowerQuery) ? 2 : 1;
        const index = p.filterProId.indexOf(lowerQuery);
        return { player: p, score: startsWithScore, index };
      }
    })
    // 按分数降序，然后按索引升序（前面的匹配优先）
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    })
    .map(item => item.player)
    .slice(0, 20); // 限制返回数量

  return matchedPlayers;
}

/**
 * 随机选择一个选手
 */
export function getRandomPlayer(): Player {
  const players = getAllPlayers();
  return players[Math.floor(Math.random() * players.length)];
}

/**
 * 检查是否猜中
 */
export function isCorrectGuess(
  guessedPlayer: Player,
  answerPlayer: Player
): boolean {
  return guessedPlayer.id === answerPlayer.id;
}

/**
 * 创建猜测记录
 */
export function createGuessRecord(guessedPlayer: Player, mask: Mask): Guess {
  const age = new Date().getFullYear() - guessedPlayer.birthYear;
  return {
    guessId: guessedPlayer.proId,
    team: guessedPlayer.team,
    country: guessedPlayer.country,
    age,
    majorMaps: guessedPlayer.majorsPlayed,
    role: guessedPlayer.role,
    mask,
  };
}

/**
 * 游戏状态
 */
export enum GameState {
  Menu = "menu",
  Playing = "playing",
  Finished = "finished",
}
