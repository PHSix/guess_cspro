import { useEffect, useRef, useEffectEvent } from "react";
import { useMultiplayerStore } from "@/store/useMultiplayerStore.js";
import type { GamerInfo, Mask, MysteryPlayer } from "@/types/multiplayer.js";

/**
 * SSE (Server-Sent Events) 连接 Hook
 * 用于建立和管理与游戏服务器的实时连接
 */

// ==================== 类型定义 ====================

/** SSE 事件数据类型 */
interface SSEEventData {
  gamerId?: string;
  gamerName?: string;
  ready?: boolean;
  guessId?: string;
  mask?: Mask;
  winner?: string | null;
  mysteryPlayer?: MysteryPlayer;
}

// ==================== 事件处理器 ====================

/**
 * 处理连接成功事件
 */
function handleConnected(): void {
  useMultiplayerStore.getState().setSSEConnected(true);
}

/**
 * 处理玩家加入房间事件
 */
function handleGamerJoined(data: SSEEventData): void {
  const state = useMultiplayerStore.getState();

  if (!data.gamerId || !data.gamerName) return;

  const newGamer: GamerInfo = {
    gamerId: data.gamerId,
    gamerName: data.gamerName,
    ready: false,
    joinedAt: new Date(),
    guessesLeft: 8,
    guesses: [],
  };

  useMultiplayerStore.getState().updateGamerList([...state.gamers, newGamer]);
}

/**
 * 处理玩家离开房间事件
 */
function handleGamerLeft(data: SSEEventData): void {
  const state = useMultiplayerStore.getState();

  if (!data.gamerId) return;

  const updatedGamers = state.gamers.filter(
    (g: GamerInfo) => g.gamerId !== data.gamerId
  );

  useMultiplayerStore.getState().updateGamerList(updatedGamers);
}

/**
 * 处理玩家准备状态更新事件
 */
function handleReadyUpdate(data: SSEEventData): void {
  const state = useMultiplayerStore.getState();

  if (!data.gamerId || data.ready === undefined) return;

  const readyValue: boolean = data.ready;

  const updatedGamers = state.gamers.map((g: GamerInfo) =>
    g.gamerId === data.gamerId ? { ...g, ready: readyValue } : g
  );

  useMultiplayerStore.getState().updateGamerList(updatedGamers);
}

/**
 * 处理所有玩家准备就绪事件
 */
function handleAllReady(): void {
  useMultiplayerStore.getState().updateRoomStatus("ready");
}

/**
 * 处理游戏开始事件
 */
function handleGameStarted(): void {
  useMultiplayerStore.getState().updateRoomStatus("inProgress");
}

/**
 * 处理玩家猜测结果事件
 */
function handleGuessResult(data: SSEEventData): void {
  if (!data.gamerId || !data.guessId || !data.mask) return;

  useMultiplayerStore.getState().addGuess(data.gamerId, {
    guessId: data.guessId,
    playerName: data.guessId,
    team: "",
    country: "",
    age: 0,
    majorMaps: 0,
    role: "",
    mask: data.mask,
  });
}

/**
 * 处理游戏结束事件
 */
function handleGameEnded(data: SSEEventData): void {
  useMultiplayerStore.getState().setWinner(data.winner || null);

  if (data.mysteryPlayer) {
    useMultiplayerStore.getState().setMysteryPlayer(data.mysteryPlayer);
  }

  useMultiplayerStore.getState().updateRoomStatus("ended");
}

/**
 * 处理房间关闭事件
 */
function handleRoomEnded(): void {
  useMultiplayerStore.getState().reset();
}

/** 事件名称到处理器的映射表 */
const EVENT_HANDLERS: Record<string, (data: SSEEventData) => void> = {
  connected: handleConnected,
  gamerJoined: handleGamerJoined,
  gamerLeft: handleGamerLeft,
  readyUpdate: handleReadyUpdate,
  allReady: handleAllReady,
  gameStarted: handleGameStarted,
  guessResult: handleGuessResult,
  gameEnded: handleGameEnded,
  roomEnded: handleRoomEnded,
};

// ==================== 主 Hook ====================

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

  useEffect(() => {
    // 清理函数：关闭 SSE 连接
    const cleanup = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const sessionId = useMultiplayerStore.getState().sessionId;

    // 如果没有 sessionId，不建立连接
    if (!sessionId) {
      return cleanup;
    }

    try {
      // 创建 SSE 连接
      const eventSource = new EventSource(`/api/sse/${sessionId}`);
      eventSourceRef.current = eventSource;

      // 连接成功时的回调
      eventSource.onopen = () => {
        useMultiplayerStore.getState().setSSEConnected(true);
        useMultiplayerStore.getState().setSSEError(null);
      };

      // 连接错误时的回调
      eventSource.onerror = () => {
        useMultiplayerStore.getState().setSSEConnected(false);
        useMultiplayerStore.getState().setSSEError("Connection lost");
      };

      // 统一的消息处理函数
      const handleMessage = (eventName: string, messageEvent: MessageEvent) => {
        const parsed = JSON.parse(messageEvent.data) as SSEEventData;
        const handler = EVENT_HANDLERS[eventName];

        if (handler) {
          handler(parsed);
        }
      };

      // 注册所有事件监听器
      Object.keys(EVENT_HANDLERS).forEach(eventName => {
        eventSource.addEventListener(eventName, (e: MessageEvent) =>
          handleMessage(eventName, e)
        );
      });

      // 组件卸载时清理连接
      return cleanup;
    } catch (error) {
      console.error("Failed to connect SSE:", error);
      useMultiplayerStore
        .getState()
        .setSSEError(error instanceof Error ? error.message : "Unknown error");

      return cleanup;
    }
  }, []);

  /**
   * 发送操作请求到服务器
   *
   * @param endpoint - API 端点（如 "/room/start"）
   * @param data - 请求数据
   * @returns Promise<any> 服务器响应
   * @throws Error 如果未连接到房间或请求失败
   */
  const sendAction = useEffectEvent(async (endpoint: string, data: unknown) => {
    const sessionId = useMultiplayerStore.getState().sessionId;

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
    gamers: useMultiplayerStore(state => state.gamers),
    guesses: useMultiplayerStore(state => state.guesses),
    roomStatus: useMultiplayerStore(state => state.roomStatus),
    mysteryPlayer: useMultiplayerStore(state => state.mysteryPlayer),
    winner: useMultiplayerStore(state => state.winner),
    myGamerId: useMultiplayerStore(state => state.gamerId),
    isSSEConnected: useMultiplayerStore(state => state.isSSEConnected),
    sendAction,
  };
}
