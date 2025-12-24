import { Player } from "@shared/gameEngine";
import { customCreate } from "./util";

interface ModePlayerList {
  ylg: string[];
  normal: string[];
}

interface PlayerStore {
  // 状态
  allPlayers: Player[];
  modePlayerList: ModePlayerList;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // 操作
  initializeData: () => Promise<void>;
  getPlayersByMode: (mode: "all" | "normal" | "ylg") => Player[];
  clearError: () => void;
}

export const usePlayerStore = customCreate<PlayerStore>((set, get) => ({
  // 初始状态
  allPlayers: [],
  modePlayerList: { ylg: [], normal: [] },
  isLoading: false,
  error: null,
  isInitialized: false,

  // 初始化数据
  initializeData: async () => {
    const { isLoading, isInitialized } = get();

    // 如果正在加载或已经初始化，则跳过
    if (isLoading || isInitialized) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // 并行加载两个文件
      const [playersResponse, modeListResponse] = await Promise.all([
        fetch("/all_players_data.json"),
        fetch("/mode_player_list.json"),
      ]);

      if (!playersResponse.ok) {
        throw new Error("Failed to load players data");
      }
      if (!modeListResponse.ok) {
        throw new Error("Failed to load mode player list");
      }

      const [playersData, modeListData] = await Promise.all([
        playersResponse.json(),
        modeListResponse.json(),
      ]);

      // 转换为Player对象
      const allPlayers: Player[] = Object.entries(playersData).map(
        ([key, data]: [string, any], index) => ({
          id: index + 1,
          proId: key,
          team: data.team || "Unknown",
          country: data.country || "Unknown",
          birthYear: data.birth_year || 2000,
          majorsPlayed: data.majorsPlayed || 0,
          role: data.role || "Unknown",
          avatar: data.avatar || "",
          lowerProId: key.toLowerCase(),
          filterProId: key
            .toLowerCase()
            .replace("1", "i")
            .replace("0", "o")
            .replace("3", "e"),
        })
      );

      set({
        allPlayers,
        modePlayerList: modeListData,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      console.error("Failed to initialize player data:", error);
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  // 根据模式获取玩家
  getPlayersByMode: (mode: "all" | "normal" | "ylg") => {
    const { allPlayers, modePlayerList } = get();

    if (mode === "all") {
      return allPlayers;
    }

    const allowedProIds = modePlayerList[mode] || [];
    return allPlayers.filter(player => allowedProIds.includes(player.proId));
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },
}));
