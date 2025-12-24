/**
 * 房间管理器
 * 负责创建、管理、销毁游戏房间，处理玩家加入、游戏流程等
 */

import type { Room } from "../models/Room";
import type { GamerState, Player } from "../models/PlayerData";
import type { SessionManager } from "./SessionManager";
import { v4 as uuidv4 } from "uuid";
import type { Difficulty } from "@guess-cspro/shared";
import { compareGuess } from "@guess-cspro/shared";
import type { SSEEventDataSet, SSEEventName } from "@guess-cspro/shared";
import { getRandomPlayer, findPlayerByName } from "../models/playerDataLoader";
import {
  GUESSES_PER_GAMER,
  MAX_GAMERS_PER_ROOM,
  PENDING_TIMEOUT_MS,
} from "../constants";
import { logger } from "../utils/logger";

/** 待确认会话信息 */
export interface PendingSessionInfo {
  roomId: string;
  gamerId: string;
  gamerName: string;
  timeout: NodeJS.Timeout;
}

/** 创建房间结果 */
interface CreateRoomResult {
  roomId: string;
  sessionId: string;
}

/** 加入房间结果 */
interface JoinRoomResult {
  sessionId: string;
}

export class RoomManager {
  /** 所有房间 */
  private rooms: Map<string, Room>;
  /** 待确认的会话 */
  private pendingSessions: Map<string, PendingSessionInfo>;
  /** Session管理器（依赖注入） */
  private sessionManager?: SessionManager;

  constructor() {
    this.rooms = new Map();
    this.pendingSessions = new Map();
  }

  /**
   * 设置 SessionManager
   * @param sessionManager - SessionManager 实例
   */
  setSessionManager(sessionManager: SessionManager): void {
    this.sessionManager = sessionManager;
  }

  /**
   * 创建新房间
   *
   * @param gamerId - 创建者ID
   * @param gamerName - 创建者名称
   * @param difficulty - 游戏难度
   * @returns 房间ID和会话ID
   */
  createRoom(
    gamerId: string,
    gamerName: string,
    difficulty: string = "all"
  ): CreateRoomResult {
    const roomId = uuidv4();
    const sessionId = uuidv4();

    logger.info({
      msg: "Creating room",
      roomId,
      sessionId,
      gamerId,
      gamerName,
      difficulty,
    });

    // 设置待确认会话超时
    const timeout = setTimeout(() => {
      logger.warn({
        msg: "Room pending session timeout, deleting room",
        roomId,
        sessionId,
      });
      this.pendingSessions.delete(sessionId);
      this.rooms.delete(roomId);
    }, PENDING_TIMEOUT_MS);

    this.pendingSessions.set(sessionId, {
      roomId,
      gamerId,
      gamerName,
      timeout,
    });

    const room: Room = {
      roomId,
      hostGamerId: gamerId,
      gamers: new Map(),
      status: "pending",
      difficulty,
      mysteryPlayer: null,
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);

    logger.info({
      msg: "Room created successfully",
      roomId,
      sessionId,
      roomCount: this.rooms.size,
    });

    return { roomId, sessionId };
  }

  /**
   * 获取待确认会话信息
   * @param sessionId - 会话ID
   * @returns 会话信息或null
   */
  getPendingSession(sessionId: string): PendingSessionInfo | null {
    return this.pendingSessions.get(sessionId) || null;
  }

  /**
   * 加入房间
   *
   * @param roomId - 房间ID
   * @param gamerId - 玩家ID
   * @param gamerName - 玩家名称
   * @returns 会话ID或错误信息
   */
  joinRoom(
    roomId: string,
    gamerId: string,
    gamerName: string
  ): JoinRoomResult | { success: false; message: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn({ msg: "Join room failed: room not found", roomId, gamerId });
      return { success: false, message: "Room not found" };
    }

    if (room.status !== "waiting" && room.status !== "pending") {
      logger.warn({
        msg: "Join room failed: room not available",
        roomId,
        gamerId,
        roomStatus: room.status,
      });
      return { success: false, message: "Room is not available" };
    }

    if (room.gamers.size >= MAX_GAMERS_PER_ROOM) {
      logger.warn({
        msg: "Join room failed: room is full",
        roomId,
        gamerId,
        currentPlayers: room.gamers.size,
        maxPlayers: MAX_GAMERS_PER_ROOM,
      });
      return { success: false, message: "Room is full" };
    }

    if (room.gamers.has(gamerId)) {
      logger.warn({
        msg: "Join room failed: already in room",
        roomId,
        gamerId,
      });
      return { success: false, message: "Already in room" };
    }

    const sessionId = uuidv4();

    logger.info({
      msg: "Gamer joining room",
      roomId,
      sessionId,
      gamerId,
      gamerName,
    });

    // 设置待确认会话超时
    const timeout = setTimeout(() => {
      logger.warn({
        msg: "Join pending session timeout, cleaning up",
        sessionId,
        roomId,
      });
      this.pendingSessions.delete(sessionId);
    }, PENDING_TIMEOUT_MS);

    this.pendingSessions.set(sessionId, {
      roomId,
      gamerId,
      gamerName,
      timeout,
    });

    return { sessionId };
  }

  /**
   * 确认加入房间
   *
   * @param sessionId - 会话ID
   * @throws Error 如果会话无效或过期
   */
  confirmJoin(sessionId: string): PendingSessionInfo {
    const pending = this.pendingSessions.get(sessionId);
    if (!pending) {
      logger.error({
        msg: "Confirm join failed: invalid or expired session",
        sessionId,
      });
      throw new Error("Invalid or expired session");
    }

    clearTimeout(pending.timeout);
    this.pendingSessions.delete(sessionId);

    const room = this.rooms.get(pending.roomId);
    if (!room) {
      logger.error({
        msg: "Confirm join failed: room not found",
        sessionId,
        roomId: pending.roomId,
      });
      throw new Error("Room not found");
    }

    const gamer: GamerState = {
      gamerId: pending.gamerId,
      gamerName: pending.gamerName,
      ready: false,
      joinedAt: new Date(),
      guessesLeft: GUESSES_PER_GAMER,
      guesses: [],
    };

    room.gamers.set(pending.gamerId, gamer);

    logger.info({
      msg: "Gamer confirmed join",
      roomId: pending.roomId,
      gamerId: pending.gamerId,
      gamerName: pending.gamerName,
      playerCount: room.gamers.size,
    });

    // 第一个玩家确认后，房间状态变为 waiting
    if (room.status === "pending") {
      room.status = "waiting";
      logger.info({
        msg: "Room status changed to waiting",
        roomId: pending.roomId,
      });
    }

    // 因为上面删除了pendingSessions中的对应值，所以这里返回pendingSessions中的值
    return pending;
  }

  /**
   * 获取房间信息
   *
   * @param roomId - 房间ID
   * @returns 房间信息或null
   */
  getRoom(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.status === "ended") return null;
    return room;
  }

  /**
   * 移除玩家
   *
   * @param roomId - 房间ID
   * @param gamerId - 玩家ID
   */
  removeGamer(roomId: string, gamerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn({
        msg: "Remove gamer failed: room not found",
        roomId,
        gamerId,
      });
      return;
    }

    room.gamers.delete(gamerId);

    logger.info({
      msg: "Gamer removed from room",
      roomId,
      gamerId,
      remainingPlayers: room.gamers.size,
    });

    // 如果房间空了或房主离开，删除房间
    if (room.gamers.size === 0) {
      logger.info({ msg: "Room empty, deleting", roomId });
      this.deleteRoom(roomId);
    } else if (gamerId === room.hostGamerId) {
      logger.info({
        msg: "Host left, deleting room",
        roomId,
        hostGamerId: gamerId,
      });
      this.deleteRoom(roomId);
    }
  }

  /**
   * 设置玩家准备状态
   *
   * @param roomId - 房间ID
   * @param gamerId - 玩家ID
   * @param ready - 是否准备
   * @returns 是否所有玩家都准备好了
   */
  setReady(roomId: string, gamerId: string, ready: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn({ msg: "Set ready failed: room not found", roomId, gamerId });
      return false;
    }

    const gamer = room.gamers.get(gamerId);
    if (!gamer) {
      logger.warn({
        msg: "Set ready failed: gamer not found",
        roomId,
        gamerId,
      });
      return false;
    }

    gamer.ready = ready;

    logger.info({
      msg: "Gamer ready status updated",
      roomId,
      gamerId,
      ready,
    });

    const allReady = Array.from(room.gamers.values()).every(g => g.ready);
    if (allReady) {
      room.status = "ready";
      logger.info({
        msg: "All gamers ready, room status changed to ready",
        roomId,
      });
      return true;
    }

    return false;
  }

  /**
   * 开始游戏
   *
   * @param roomId - 房间ID
   * @returns 神秘玩家信息
   * @throws Error 如果无法开始游戏
   */
  startGame(roomId: string): Player {
    const room = this.rooms.get(roomId);
    if (
      !room ||
      (room.status !== "ready" &&
        // 如果存在既不是房主也不是准备好的人，则不能开始游戏
        Array.from(room.gamers.values()).some(
          it => it.gamerId !== room.hostGamerId && !it.ready
        ))
    ) {
      logger.error({
        msg: "Start game failed: invalid room state",
        roomId,
        roomStatus: room?.status,
      });
      throw new Error("Cannot start game");
    }

    // 根据房间难度选择神秘玩家
    const difficulty = (room.difficulty || "all") as Difficulty;
    const mysteryPlayer = getRandomPlayer(difficulty);

    room.mysteryPlayer = mysteryPlayer;
    room.status = "inProgress";
    room.startedAt = new Date();

    logger.info({
      msg: "Game started",
      roomId,
      difficulty,
      mysteryPlayer: mysteryPlayer.proId,
      playerCount: room.gamers.size,
    });

    return mysteryPlayer;
  }

  /**
   * 处理玩家猜测
   *
   * @param roomId - 房间ID
   * @param gamerId - 玩家ID
   * @param guessId - 猜测的玩家ID
   * @returns 猜测结果
   * @throws Error 如果游戏未进行或猜测无效
   */
  processGuess(roomId: string, gamerId: string, guessId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== "inProgress") {
      logger.error({
        msg: "Process guess failed: game not in progress",
        roomId,
        gamerId,
        guessId,
      });
      throw new Error("Game not in progress");
    }

    if (!room.mysteryPlayer) {
      logger.error({
        msg: "Process guess failed: mystery player not set",
        roomId,
      });
      throw new Error("Mystery player not set");
    }

    const gamer = room.gamers.get(gamerId);
    if (!gamer || gamer.guessesLeft <= 0) {
      logger.error({
        msg: "Process guess failed: no guesses left",
        roomId,
        gamerId,
        guessesLeft: gamer?.guessesLeft,
      });
      throw new Error("No guesses left");
    }

    const guessedPlayer = findPlayerByName(
      guessId,
      room.difficulty as Difficulty
    );
    if (!guessedPlayer) {
      logger.error({
        msg: "Process guess failed: player not found",
        roomId,
        gamerId,
        guessId,
      });
      throw new Error("Player not found");
    }

    const mask = compareGuess(guessedPlayer, room.mysteryPlayer);

    gamer.guessesLeft--;
    gamer.guesses.push({
      guessId: guessedPlayer.proId,
      mask,
    });

    const isCorrect = guessedPlayer.id === room.mysteryPlayer.id;

    logger.info({
      msg: "Guess processed",
      roomId,
      gamerId,
      guessId,
      isCorrect,
      guessesLeft: gamer.guessesLeft,
    });

    if (isCorrect) {
      room.status = "ended";
      logger.info({
        msg: "Game ended - correct guess",
        roomId,
        winner: gamerId,
      });
    }

    const allGuessesExhausted = Array.from(room.gamers.values()).every(
      g => g.guessesLeft === 0
    );

    if (allGuessesExhausted && !isCorrect) {
      room.status = "ended";
      logger.info({
        msg: "Game ended - all guesses exhausted",
        roomId,
      });
    }

    return {
      mask,
      guessesLeft: gamer.guessesLeft,
      isCorrect,
      isEnded: room.status === "ended",
    };
  }

  /**
   * 删除房间
   *
   * @param roomId - 房间ID
   */
  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      logger.info({
        msg: "Deleting room",
        roomId,
        playerCount: room.gamers.size,
      });

      // 清理所有相关待确认会话
      room.gamers.forEach((_, gamerId) => {
        const pendingKeys = Array.from(this.pendingSessions.entries());
        pendingKeys.forEach(([sessionId, pending]) => {
          if (pending.gamerId === gamerId) {
            clearTimeout(pending.timeout);
            this.pendingSessions.delete(sessionId);
          }
        });
      });
    } else {
      logger.warn({ msg: "Delete room failed: room not found", roomId });
    }
    this.rooms.delete(roomId);
  }

  /**
   * 向房间内所有玩家广播消息
   *
   * @param roomId - 房间ID
   * @param event - 事件名称 (SSEEventName)
   * @param data - 事件数据 (根据事件类型强类型)
   */
  broadcastToRoom<T extends SSEEventName>(
    roomId: string,
    event: T,
    data: SSEEventDataSet[T]
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn({
        msg: "Broadcast failed: room not found",
        roomId,
        event,
      });
      return;
    }

    if (!this.sessionManager) {
      logger.error("SessionManager not set in RoomManager");
      return;
    }

    const eventString = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const allSessions = this.sessionManager.getAllSessions();

    let successCount = 0;
    let failCount = 0;

    room.gamers.forEach(gamer => {
      for (const [sessionId, session] of allSessions) {
        if (session.gamerId === gamer.gamerId && session.roomId === roomId) {
          const res = session.response as unknown as {
            writableEnded: boolean;
            write: (data: string) => void;
          };
          if (!res.writableEnded) {
            try {
              res.write(eventString);
              successCount++;
            } catch (e) {
              failCount++;
              logger.error({
                msg: "Failed to send SSE event",
                sessionId,
                roomId,
                event,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }
        }
      }
    });

    logger.debug({
      msg: "Broadcast event to room",
      roomId,
      event,
      successCount,
      failCount,
    });
  }

  /**
   * 获取所有房间
   * @returns 房间Map的副本
   */
  getAllRooms(): Map<string, Room> {
    return new Map(this.rooms);
  }

  /**
   * 获取房间数量
   * @returns 房间数量
   */
  getRoomCount(): number {
    return this.rooms.size;
  }
}
