/**
 * 共享的游戏引擎模块
 * 包含游戏核心逻辑、类型定义和工具函数
 * 同时供前端 (app) 和后端 (service) 使用
 */

// ==================== 类型定义 ====================

/**
 * 难度等级
 */
export type Difficulty = "all" | "normal" | "ylg";

/**
 * 比赛类型 - 用于显示猜测结果
 * - M: Match - 完全匹配
 * - N: Near - 接近（同赛区或数值接近）
 * - D: Different - 不同
 */
// export type MatchType = "M" | "N" | "D";
export enum MatchType {
  Exact = "M",
  Near = "N",
  Different = "D",
  Greater = "G",
  Less = "L",
}

/**
 * 玩家角色
 */
export type PlayerRole = "AWPer" | "Rifler" | "Unknown";

/**
 * 玩家数据接口
 */
export interface Player {
  id: string | number;
  playerName: string;
  team: string;
  country: string;
  birthYear: number;
  /** 参加 major 比赛的次数 */
  majorsPlayed: number;
  role: PlayerRole;

  /** 小写玩家名（用于搜索） */
  lowerPlayerName: string;
  /** 搜索用的规范化名字 */
  filterPlayerName: string;
}

/**
 * 比较结果掩码
 */
export interface Mask {
  playerName: MatchType;
  team: MatchType;
  country: MatchType;
  age: MatchType;
  majorsPlayed: MatchType;
  role: MatchType;
}

/**
 * 猜测记录
 */
export interface Guess {
  guessId: string;
  playerName: string;
  team: string;
  country: string;
  age: number;
  majorMaps: number;
  role: string;
  mask: Mask;
}

/**
 * 比较结果（用于单机模式）
 */
export interface ComparisonResult {
  teamMatch: MatchType;
  countryMatch: MatchType;
  ageMatch: MatchType;
  majorMapsMatch: MatchType;
  roleMatch: MatchType;
}

/**
 * 游戏状态
 */
export enum GameState {
  Menu = "menu",
  Playing = "playing",
  Finished = "finished",
}

// ==================== 常量 ====================

/** 年龄接近的阈值（岁） */
export const BIRTH_YEAR_NEAR_THRESHOLD = 2;

/** Major 次数接近的阈值 */
export const MAJORS_NEAR_THRESHOLD = 3;

/** 赛区分组 */
export type Region = "Europe" | "CIS" | "Americas" | "APAC";

/** 国家到赛区的映射表 */
export const COUNTRY_REGIONS: Record<string, Region> = {
  // ==================== 欧洲赛区 ====================
  Denmark: "Europe",
  France: "Europe",
  Germany: "Europe",
  Sweden: "Europe",
  Norway: "Europe",
  Finland: "Europe",
  Poland: "Europe",
  Netherlands: "Europe",
  Belgium: "Europe",
  Spain: "Europe",
  Portugal: "Europe",
  Italy: "Europe",
  Switzerland: "Europe",
  Austria: "Europe",
  "Czech Republic": "Europe",
  Slovakia: "Europe",
  Hungary: "Europe",
  Romania: "Europe",
  Bulgaria: "Europe",
  Croatia: "Europe",
  Serbia: "Europe",
  Montenegro: "Europe",
  "Bosnia and Herzegovina": "Europe",
  Slovenia: "Europe",
  Estonia: "Europe",
  Latvia: "Europe",
  Lithuania: "Europe",
  Turkey: "Europe",
  UK: "Europe",
  "United Kingdom": "Europe",
  Ireland: "Europe",
  Iceland: "Europe",
  Greece: "Europe",
  Cyprus: "Europe",
  Malta: "Europe",
  Luxembourg: "Europe",
  Liechtenstein: "Europe",
  Monaco: "Europe",
  Andorra: "Europe",
  "San Marino": "Europe",
  "Vatican City": "Europe",

  // ==================== 独联体赛区 ====================
  Russia: "CIS",
  Ukraine: "CIS",
  Belarus: "CIS",
  Kazakhstan: "CIS",
  Uzbekistan: "CIS",
  Turkmenistan: "CIS",
  Kyrgyzstan: "CIS",
  Tajikistan: "CIS",
  Armenia: "CIS",
  Azerbaijan: "CIS",
  Georgia: "CIS",
  Moldova: "CIS",

  // ==================== 美洲赛区 ====================
  USA: "Americas",
  "United States": "Americas",
  Canada: "Americas",
  Brazil: "Americas",
  Argentina: "Americas",
  Chile: "Americas",
  Peru: "Americas",
  Colombia: "Americas",
  Mexico: "Americas",
  Uruguay: "Americas",
  Paraguay: "Americas",
  Bolivia: "Americas",
  Ecuador: "Americas",
  Venezuela: "Americas",
  Guyana: "Americas",
  Suriname: "Americas",
  "French Guiana": "Americas",
  Guatemala: "Americas",
  Belize: "Americas",
  "El Salvador": "Americas",
  Honduras: "Americas",
  Nicaragua: "Americas",
  "Costa Rica": "Americas",
  Panama: "Americas",
  Cuba: "Americas",
  Jamaica: "Americas",
  Haiti: "Americas",
  "Dominican Republic": "Americas",

  // ==================== 亚太赛区 ====================
  China: "APAC",
  Japan: "APAC",
  "South Korea": "APAC",
  Thailand: "APAC",
  Vietnam: "APAC",
  Singapore: "APAC",
  India: "APAC",
  Israel: "APAC",
  UAE: "APAC",
  "Saudi Arabia": "APAC",
  Egypt: "APAC",
  Iran: "APAC",
  Iraq: "APAC",
  Jordan: "APAC",
  Lebanon: "APAC",
  Syria: "APAC",
  Yemen: "APAC",
  Oman: "APAC",
  Qatar: "APAC",
  Bahrain: "APAC",
  Kuwait: "APAC",
  Pakistan: "APAC",
  Bangladesh: "APAC",
  "Sri Lanka": "APAC",
  Myanmar: "APAC",
  Cambodia: "APAC",
  Laos: "APAC",
  Malaysia: "APAC",
  Indonesia: "APAC",
  Philippines: "APAC",
  Brunei: "APAC",
  Maldives: "APAC",
  Nepal: "APAC",
  Bhutan: "APAC",
  Mongolia: "APAC",
  "North Korea": "APAC",
  Taiwan: "APAC",
  "Hong Kong": "APAC",
  Macau: "APAC",
  Australia: "APAC",
  "New Zealand": "APAC",
  Fiji: "APAC",
  "Papua New Guinea": "APAC",
  "Solomon Islands": "APAC",
  Vanuatu: "APAC",
  Samoa: "APAC",
  Tonga: "APAC",
  Kiribati: "APAC",
  Tuvalu: "APAC",
  Nauru: "APAC",
  Palau: "APAC",
  "Marshall Islands": "APAC",
  Micronesia: "APAC",

  // 特殊处理
  CIS: "CIS",
  Unknown: "APAC",
};

// ==================== 工具函数 ====================

/**
 * 获取国家所属的赛区
 * @param country - 国家名称
 * @returns 赛区
 */
export function getCountryRegion(country: string): Region {
  return COUNTRY_REGIONS[country] || "APAC";
}

/**
 * 检查数值是否在范围内
 * @param value - 要检查的值
 * @param min - 最小值（包含）
 * @param max - 最大值（包含）
 * @returns 是否在范围内
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * 计算年龄
 * @param birthYear - 出生年份
 * @returns 年龄
 */
export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

// ==================== 游戏核心逻辑 ====================

/**
 * 比较两个玩家猜测，返回匹配结果
 *
 * @param guessedPlayer - 猜测的玩家
 * @param answerPlayer - 答案玩家
 * @returns 匹配结果掩码
 */
export function compareGuess(
  guessedPlayer: Player,
  answerPlayer: Player
): Mask {
  const guessedAge = calculateAge(guessedPlayer.birthYear);
  const answerAge = calculateAge(answerPlayer.birthYear);
  const ageDiff = guessedAge - answerAge;
  const majorsDiff = guessedPlayer.majorsPlayed - answerPlayer.majorsPlayed;

  return {
    playerName:
      guessedPlayer.playerName === answerPlayer.playerName ? "M" : "D",
    team: guessedPlayer.team === answerPlayer.team ? "M" : "D",
    country:
      guessedPlayer.country === answerPlayer.country
        ? "M"
        : getCountryRegion(guessedPlayer.country) ===
            getCountryRegion(answerPlayer.country)
          ? "N"
          : "D",
    birthYear:
      guessedPlayer.birthYear === answerPlayer.birthYear
        ? "M"
        : Math.abs(ageDiff) <= BIRTH_YEAR_NEAR_THRESHOLD
          ? "N"
          : "D",
    majorsPlayed:
      guessedPlayer.majorsPlayed === answerPlayer.majorsPlayed
        ? "M"
        : Math.abs(majorsDiff) <= MAJORS_NEAR_THRESHOLD
          ? "N"
          : "D",
    role: guessedPlayer.role === answerPlayer.role ? "M" : "D",
  };
}

/**
 * 比较玩家属性（用于单机模式的详细结果）
 *
 * @param guessedPlayer - 猜测的玩家
 * @param answerPlayer - 答案玩家
 * @returns 比较结果
 */
export function comparePlayerAttributes(
  guessedPlayer: Player,
  answerPlayer: Player
): ComparisonResult {
  const guessedAge = calculateAge(guessedPlayer.birthYear);
  const answerAge = calculateAge(answerPlayer.birthYear);

  return {
    teamMatch: guessedPlayer.team === answerPlayer.team ? "M" : "D",
    countryMatch:
      guessedPlayer.country === answerPlayer.country
        ? "M"
        : getCountryRegion(guessedPlayer.country) ===
            getCountryRegion(answerPlayer.country)
          ? "N"
          : "D",
    ageMatch:
      guessedAge === answerAge
        ? "M"
        : inRange(guessedAge - answerAge, 0, 2)
          ? "N"
          : "D",
    majorMapsMatch:
      guessedPlayer.majorsPlayed === answerPlayer.majorsPlayed
        ? "M"
        : inRange(
              guessedPlayer.majorsPlayed - answerPlayer.majorsPlayed,
              0,
              MAJORS_NEAR_THRESHOLD
            )
          ? "N"
          : "D",
    roleMatch: guessedPlayer.role === answerPlayer.role ? "M" : "D",
  };
}

/**
 * 检查是否猜中
 *
 * @param guessedPlayer - 猜测的玩家
 * @param answerPlayer - 答案玩家
 * @returns 是否正确
 */
export function isCorrectGuess(
  guessedPlayer: Player,
  answerPlayer: Player
): boolean {
  return String(guessedPlayer.id) === String(answerPlayer.id);
}

/**
 * 根据玩家名查找玩家
 *
 * @param players - 玩家列表
 * @param name - 玩家名
 * @returns 找到的玩家或 undefined
 */
export function findPlayerByName(
  players: Player[],
  name: string
): Player | undefined {
  return players.find(p => p.playerName.toLowerCase() === name.toLowerCase());
}

/**
 * 从玩家列表中随机选择一个
 *
 * @param players - 玩家列表
 * @returns 随机玩家
 */
export function getRandomPlayer(players: Player[]): Player {
  return players[Math.floor(Math.random() * players.length)];
}

/**
 * 搜索玩家（模糊搜索）
 *
 * @param players - 玩家列表
 * @param query - 搜索关键词
 * @param limit - 返回结果数量限制
 * @returns 匹配的玩家列表
 */
export function searchPlayers(
  players: Player[],
  query: string,
  limit: number = 20
): Player[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();

  // 搜索匹配项并按匹配度排序
  const matchedPlayers = players
    .filter(p => {
      const playerNameLower = p.playerName.toLowerCase();
      return playerNameLower.includes(lowerQuery);
    })
    .map(p => {
      // 计算匹配分数：开头匹配分数更高
      if (p.filterPlayerName.startsWith(lowerQuery)) {
        const index = p.filterPlayerName.indexOf(lowerQuery);
        return { player: p, score: 2, index };
      } else {
        const startsWithScore = p.lowerPlayerName.startsWith(lowerQuery)
          ? 2
          : 1;
        const index = p.lowerPlayerName.indexOf(lowerQuery);
        return { player: p, score: startsWithScore, index };
      }
    })
    // 按分数降序，然后按索引升序
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    })
    .map(item => item.player)
    .slice(0, limit);

  return matchedPlayers;
}
