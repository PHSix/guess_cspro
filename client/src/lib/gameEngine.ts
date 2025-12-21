export interface Player {
  id: number;
  playerName: string;
  team: string;
  country: string;
  birthYear: number;
  /**
   * 参加major比赛的次数
   */
  major: number;
  role: "AWPer" | "Rifler" | "Unknown";

  lowerPlayerName: string;
  /**
   * 搜索时用的名字，替换一些常见的数字为小写字母
   */
  filterPlayerName: string;
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

// 赛区分组
type Region = "Europe" | "CIS" | "Americas" | "APAC";

const COUNTRY_REGIONS: Record<string, Region> = {
  // 欧洲赛区
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

  // 独联体赛区
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

  // 美洲赛区
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

  // 亚太赛区
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

  CIS: "CIS",
  Unknown: "APAC",
};

function getCountryRegion(country: string): Region {
  return COUNTRY_REGIONS[country] || "APAC";
}

let playersCache: Player[] | null = null;

/**
 * 初始化选手数据
 */
async function initializePlayers(): Promise<Player[]> {
  if (playersCache) return playersCache;

  try {
    const response = await fetch("/players_data_cleaned.json");
    const playersData = await response.json();

    playersCache = Object.entries(playersData).map((entry, index) => {
      const [key, data]: [string, any] = entry;
      return {
        id: index + 1,
        playerName: key,
        team: data.team || "Unknown",
        country: data.country || "Unknown",
        birthYear: data.birth_year || 2000,
        major: parseInt(data.majapp) || 0,
        role: data.role || "Unknown",

        lowerPlayerName: key.toLowerCase(),
        // 搜索时，替换一些常见的数字为小写字母
        filterPlayerName: key
          .toLowerCase()
          .replace("1", "i")
          .replace("0", "o")
          .replace("3", "e"),
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

  // 搜索匹配项并按匹配度排序
  const matchedPlayers = players
    .filter(p => {
      const playerNameLower = p.playerName.toLowerCase();
      // 检查是否匹配（包含匹配）
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
    // 赛区分组：同赛区显示 nearly，不同赛区显示 different
    countryMatch:
      guessedPlayer.country === answerPlayer.country
        ? MatchType.Exact
        : getCountryRegion(guessedPlayer.country) ===
            getCountryRegion(answerPlayer.country)
          ? MatchType.Near
          : MatchType.Different,
    ageMatch:
      guessedAge === answerAge
        ? MatchType.Exact
        : inRange(guessedAge - answerAge, 0, 2)
          ? MatchType.Less
          : inRange(guessedAge - answerAge, -2, 0)
            ? MatchType.Greater
            : MatchType.Different,
    majorMapsMatch:
      guessedPlayer.major === answerPlayer.major
        ? MatchType.Exact
        : inRange(guessedPlayer.major - answerPlayer.major, 0, 3)
          ? MatchType.Less
          : inRange(guessedPlayer.major - answerPlayer.major, -3, 0)
            ? MatchType.Greater
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
    majorMaps: guessedPlayer.major,
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
