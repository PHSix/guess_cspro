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
 * - G: Greater - 大于
 * - L: Less - 小于
 */
export enum MaskType {
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
  proId: string;
  team: string;
  country: string;
  birthYear: number;
  /** 参加 major 比赛的次数 */
  majorsPlayed: number;
  role: PlayerRole;

  /** 小写玩家名（用于搜索） */
  lowerProId: string;
  /** 搜索用的规范化名字 */
  filterProId: string;
}

/**
 * 比较结果掩码
 */
export interface Mask {
  guessId: MaskType;
  team: MaskType;
  country: MaskType;
  age: MaskType;
  majorsPlayed: MaskType;
  role: MaskType;
}

/**
 * 猜测记录
 */
export interface Guess {
  guessId: string;
  team: string;
  country: string;
  age: number;
  majorMaps: number;
  role: string;
  mask: Mask;
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

  return {
    guessId:
      guessedPlayer.proId === answerPlayer.proId
        ? MaskType.Exact
        : MaskType.Different,
    team:
      guessedPlayer.team === answerPlayer.team
        ? MaskType.Exact
        : MaskType.Different,
    // 赛区分组：同赛区显示 nearly，不同赛区显示 different
    country:
      guessedPlayer.country === answerPlayer.country
        ? MaskType.Exact
        : getCountryRegion(guessedPlayer.country) ===
            getCountryRegion(answerPlayer.country)
          ? MaskType.Near
          : MaskType.Different,
    age:
      guessedAge === answerAge
        ? MaskType.Exact
        : inRange(guessedAge - answerAge, 0, 2)
          ? MaskType.Less
          : inRange(guessedAge - answerAge, -2, 0)
            ? MaskType.Greater
            : MaskType.Different,
    majorsPlayed:
      guessedPlayer.majorsPlayed === answerPlayer.majorsPlayed
        ? MaskType.Exact
        : inRange(guessedPlayer.majorsPlayed - answerPlayer.majorsPlayed, 0, 3)
          ? MaskType.Less
          : inRange(
                guessedPlayer.majorsPlayed - answerPlayer.majorsPlayed,
                -3,
                0
              )
            ? MaskType.Greater
            : MaskType.Different,
    role:
      guessedPlayer.role === answerPlayer.role
        ? MaskType.Exact
        : MaskType.Different,
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
  return players.find(p => p.proId.toLowerCase() === name.toLowerCase());
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
