import { useEffect, useRef, useEffectEvent } from "react";
import { useOnlineStore } from "@/store/useOnlineStore";
import type { GamerInfo, Mask, MysteryPlayer, RoomStatus } from "@/types";
import { EsCustomEvent, EsCustomEventList } from "@shared/const";

class CustomEventSource extends EventSource {
  override addEventListener(
    type: "open" | "error",
    listener: (ev: Event) => void
  ): void;
  override addEventListener(
    type: "message",
    listener: (ev: MessageEvent<any>) => void
  ): void;
  override addEventListener(
    type: EsCustomEvent,
    listener: (ev: SSEEventData) => void
  ): void;
  override addEventListener(type: string, handler: any) {
    if (EsCustomEventList.includes(type)) {
      super.addEventListener(type, ev => {
        const data = JSON.parse(ev.data);
        console.log("recv", type, data);
        return handler(data);
      });
    } else {
      super.addEventListener(type, handler);
    }
  }
}

/**
 * SSE (Server-Sent Events) 连接 Hook
 * 用于建立和管理与游戏服务器的实时连接
 */

// ==================== 类型定义 ====================

/** 玩家信息（从服务端接收） */
interface ServerGamerInfo {
  gamerId: string;
  gamerName: string;
  ready: boolean;
  joinedAt: string; // ISO string
}

/** 房间状态信息 */
interface RoomStateInfo {
  gamers: ServerGamerInfo[];
  roomStatus: string;
}

/** SSE 事件数据类型 */
interface SSEEventData {
  gamerId?: string;
  gamerName?: string;
  ready?: boolean;
  guessId?: string;
  mask?: Mask;
  winner?: string | null;
  mysteryPlayer?: MysteryPlayer;
  roomId?: string;
  timestamp?: string; // for heartbeat
  gamers?: ServerGamerInfo[]; // for roomState
  roomStatus?: string; // for roomState
}

/**
 * SSE 连接管理 Hook
 *
 * 功能：
 * - 建立与服务器的 SSE 连接
 * - 监听并处理各种游戏事件
 * - 提供发送操作请求到服务器的方法
 */
export function useSSEConnection() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionId = useOnlineStore(state => state.sessionId);
  const {
    setSSEConnected,
    setSSEError,
    setRoomId,
    updateGamerList,
    updateRoomStatus,
    addGuess,
    setWinner,
    setMysteryPlayer,
    reset,
  } = useOnlineStore();

  useEffect(() => {
    // 清理函数：关闭 SSE 连接
    const cleanup = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    // 如果没有 sessionId，不建立连接
    if (!sessionId) {
      return cleanup;
    }

    try {
      // 创建 SSE 连接
      const es = new CustomEventSource(`/api/sse/${sessionId}`);
      eventSourceRef.current = es;

      // ==================== 事件处理器 ====================

      // 连接成功时的回调
      es.addEventListener("open", () => {
        setSSEConnected(true);
        setSSEError(null);
      });

      // 连接错误时的回调
      es.addEventListener("error", () => {
        setSSEConnected(false);
        setSSEError("Connection lost");
      });

      // 处理连接成功事件
      es.addEventListener(EsCustomEvent.CONNECTED, (data: SSEEventData) => {
        // Set room info from connected event
        if (data.roomId) {
          setRoomId(data.roomId);
        }
        setSSEConnected(true);
      });

      // 处理房间状态更新事件
      es.addEventListener(EsCustomEvent.ROOM_STATE, (data: SSEEventData) => {
        if (!data.gamers) return;

        const gamers: GamerInfo[] = data.gamers.map(g => ({
          gamerId: g.gamerId,
          gamerName: g.gamerName,
          ready: g.ready,
          joinedAt: new Date(g.joinedAt),
          guessesLeft: 8,
          guesses: [],
        }));

        updateGamerList(gamers);

        // Update room status (with type assertion)
        const roomStatus = data.roomStatus;
        const validStatusList: RoomStatus[] = [
          "pending",
          "waiting",
          "ready",
          "inProgress",
          "ended",
        ];
        if (roomStatus && roomStatus in validStatusList) {
          updateRoomStatus(roomStatus as RoomStatus);
        }
      });

      // 处理心跳事件
      es.addEventListener(EsCustomEvent.HEARTBEAT, () => {
        // Heartbeat received, connection is alive
        setSSEConnected(true);
      });

      // 处理玩家加入房间事件
      es.addEventListener(EsCustomEvent.GAMER_JOINED, (data: SSEEventData) => {
        console.log("gamerJoined");
        const state = useOnlineStore.getState();

        if (!data.gamerId || !data.gamerName) return;

        // Check if gamer already exists
        if (state.gamers.some(g => g.gamerId === data.gamerId)) {
          return;
        }

        const newGamer: GamerInfo = {
          gamerId: data.gamerId,
          gamerName: data.gamerName,
          ready: false,
          joinedAt: new Date(),
          guessesLeft: 8,
          guesses: [],
        };

        updateGamerList([...state.gamers, newGamer]);
      });

      // 处理玩家离开房间事件
      es.addEventListener(EsCustomEvent.GAMER_LEFT, (data: SSEEventData) => {
        const state = useOnlineStore.getState();

        if (!data.gamerId) return;

        const updatedGamers = state.gamers.filter(
          (g: GamerInfo) => g.gamerId !== data.gamerId
        );

        updateGamerList(updatedGamers);
      });

      // 处理玩家准备状态更新事件
      es.addEventListener(EsCustomEvent.READY_UPDATE, (data: SSEEventData) => {
        const state = useOnlineStore.getState();

        if (!data.gamerId || data.ready === undefined) return;

        const readyValue: boolean = data.ready;

        const updatedGamers = state.gamers.map((g: GamerInfo) =>
          g.gamerId === data.gamerId ? { ...g, ready: readyValue } : g
        );

        updateGamerList(updatedGamers);
      });

      // 处理所有玩家准备就绪事件
      es.addEventListener(EsCustomEvent.ALL_READY, () => {
        updateRoomStatus("ready");
      });

      // 处理游戏开始事件
      es.addEventListener(EsCustomEvent.GAME_STARTED, () => {
        updateRoomStatus("inProgress");
      });

      // 处理玩家猜测结果事件
      es.addEventListener(EsCustomEvent.GUESS_RESULT, (data: SSEEventData) => {
        if (!data.gamerId || !data.guessId || !data.mask) return;

        addGuess(data.gamerId, {
          guessId: data.guessId,
          playerName: data.guessId,
          team: "",
          country: "",
          age: 0,
          majorMaps: 0,
          role: "",
          mask: data.mask,
        });
      });

      // 处理游戏结束事件
      es.addEventListener(EsCustomEvent.GAME_ENDED, (data: SSEEventData) => {
        setWinner(data.winner || null);

        if (data.mysteryPlayer) {
          setMysteryPlayer(data.mysteryPlayer);
        }

        updateRoomStatus("ended");
      });

      // 处理房间关闭事件
      es.addEventListener(EsCustomEvent.ROOM_ENDED, () => {
        reset();
      });

      // 组件卸载时清理连接
      return cleanup;
    } catch (error) {
      console.error("Failed to connect SSE:", error);
      setSSEError(error instanceof Error ? error.message : "Unknown error");

      return cleanup;
    }
  }, [sessionId]);

  /**
   * 发送操作请求到服务器
   *
   * @param endpoint - API 端点（如 "/room/start"）
   * @param data - 请求数据
   * @returns Promise<any> 服务器响应
   * @throws Error 如果未连接到房间或请求失败
   */
  const sendAction = useEffectEvent(async (endpoint: string, data: unknown) => {
    const sessionId = useOnlineStore.getState().sessionId;

    if (!sessionId) {
      throw new Error("Not connected to room");
    }

    const response = await fetch(`/api${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Request failed");
    }

    return response.json();
  });

  // 返回游戏状态和操作方法
  return {
    gamers: useOnlineStore(state => state.gamers),
    guesses: useOnlineStore(state => state.guesses),
    roomStatus: useOnlineStore(state => state.roomStatus),
    mysteryPlayer: useOnlineStore(state => state.mysteryPlayer),
    winner: useOnlineStore(state => state.winner),
    myGamerId: useOnlineStore(state => state.gamerId),
    isSSEConnected: useOnlineStore(state => state.isSSEConnected),
    sendAction,
  };
}
