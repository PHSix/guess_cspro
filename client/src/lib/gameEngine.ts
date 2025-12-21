export interface Player {
  id: number;
  playerName: string;
  team: string;
  country: string;
  birthYear: number;
  majorMaps: number;
  role: "AWPer" | "Rifler" | "Unknown";
}

export interface ComparisonResult {
  teamMatch: MatchType;
  countryMatch: MatchType;
  ageMatch: MatchType;
  majorMapsMatch: MatchType;
  roleMatch: MatchType;
}

export interface Guess {
  playerName: string;
  team: string;
  country: string;
  age: number;
  majorMaps: number;
  role: string;
  result: ComparisonResult;
}

let playersCache: Player[] | null = null;

/**
 * 初始化选手数据
 */
async function initializePlayers(): Promise<Player[]> {
  if (playersCache) return playersCache;

  try {
    const response = await fetch("/players_data.json");
    const playersData = await response.json();

    playersCache = Object.entries(playersData).map((entry, index) => {
      const [key, data]: [string, any] = entry;
      return {
        id: index + 1,
        playerName: data.player || key,
        team: data.team || "Unknown",
        country: data.country || "Unknown",
        birthYear: data.birth_year || 2000,
        majorMaps: parseInt(data.Maps) || 0,
        role: data.role || "Unknown",
      };
    });

    return playersCache;
  } catch (error) {
    console.error("Failed to load players data:", error);
    return [];
  }
}

/**
 * 获取所有选手
 */
export async function getAllPlayers(): Promise<Player[]> {
  return initializePlayers();
}

/**
 * 搜索选手（快速搜索）
 */
export async function searchPlayers(query: string): Promise<Player[]> {
  if (!query.trim()) return [];

  const players = await initializePlayers();
  const lowerQuery = query.toLowerCase();

  return players
    .filter(p => p.playerName.toLowerCase().includes(lowerQuery))
    .slice(0, 20); // 限制返回数量
}

/**
 * 随机选择一个选手
 */
export async function getRandomPlayer(): Promise<Player> {
  const players = await initializePlayers();
  return players[Math.floor(Math.random() * players.length)];
}

export enum MatchType {
  Exact = "exact",
  Near = "near",
  similar = "similar",
  Different = "different",
  Greater = "greater",
  Less = "less",
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * 对比两个选手的属性
 */
export function comparePlayerAttributes(
  guessedPlayer: Player,
  answerPlayer: Player
): ComparisonResult {
  const guessedAge = new Date().getFullYear() - guessedPlayer.birthYear;
  const answerAge = new Date().getFullYear() - answerPlayer.birthYear;

  return {
    teamMatch:
      guessedPlayer.team === answerPlayer.team
        ? MatchType.Exact
        : MatchType.Different,
    // TODO: 临近国家
    countryMatch:
      guessedPlayer.country === answerPlayer.country
        ? MatchType.Exact
        : MatchType.Different,
    ageMatch:
      guessedAge === answerAge
        ? MatchType.Exact
        : inRange(guessedAge - answerAge, 0, 2)
          ? MatchType.Greater
          : inRange(guessedAge - answerAge, -2, 0)
            ? MatchType.Less
            : MatchType.Different,
    majorMapsMatch:
      guessedPlayer.majorMaps === answerPlayer.majorMaps
        ? MatchType.Exact
        : inRange(guessedPlayer.majorMaps - answerPlayer.majorMaps, 0, 3)
          ? MatchType.Greater
          : inRange(guessedPlayer.majorMaps - answerPlayer.majorMaps, -3, 0)
            ? MatchType.Less
            : MatchType.Different,
    roleMatch:
      guessedPlayer.role === answerPlayer.role
        ? MatchType.Exact
        : MatchType.Different,
  };
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
export function createGuessRecord(
  guessedPlayer: Player,
  result: ComparisonResult
): Guess {
  const age = new Date().getFullYear() - guessedPlayer.birthYear;
  return {
    playerName: guessedPlayer.playerName,
    team: guessedPlayer.team,
    country: guessedPlayer.country,
    age,
    majorMaps: guessedPlayer.majorMaps,
    role: guessedPlayer.role,
    result,
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
