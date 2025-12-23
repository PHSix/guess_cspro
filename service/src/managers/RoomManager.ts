import type { Room } from "../models/Room";
import type { GamerState } from "../models/PlayerData";
import type { MysteryPlayer } from "../models/PlayerData";
import type { SessionManager } from "./SessionManager";
import { v4 as uuidv4 } from "uuid";
import { compareGuess } from "../utils/comparison";
import {
  findPlayerByName,
  getMysteryPlayers,
} from "../models/playerDataLoader";
import {
  GUESSES_PER_GAMER,
  MAX_GAMERS_PER_ROOM,
  PENDING_TIMEOUT_MS,
} from "../constants";

interface PendingSessionInfo {
  roomId: string;
  gamerId: string;
  gamerName: string;
  timeout: NodeJS.Timeout;
}

interface CreateRoomResult {
  roomId: string;
  sessionId: string;
}

interface JoinRoomResult {
  sessionId: string;
}

export class RoomManager {
  private rooms: Map<string, Room>;
  private pendingSessions: Map<string, PendingSessionInfo>;
  private sessionManager?: SessionManager;

  constructor() {
    this.rooms = new Map();
    this.pendingSessions = new Map();
  }

  setSessionManager(sessionManager: SessionManager): void {
    this.sessionManager = sessionManager;
  }

  createRoom(gamerId: string, gamerName: string): CreateRoomResult {
    const roomId = uuidv4();
    const sessionId = uuidv4();

    const timeout = setTimeout(() => {
      console.log(`Room ${roomId} pending session timeout, deleting`);
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
      mysteryPlayer: null,
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);

    return { roomId, sessionId };
  }

  getPendingSession(sessionId: string): PendingSessionInfo | null {
    return this.pendingSessions.get(sessionId) || null;
  }

  joinRoom(
    roomId: string,
    gamerId: string,
    gamerName: string
  ): JoinRoomResult | { success: false; message: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    if (room.status !== "waiting" && room.status !== "pending") {
      return { success: false, message: "Room is not available" };
    }

    if (room.gamers.size >= MAX_GAMERS_PER_ROOM) {
      return { success: false, message: "Room is full" };
    }

    if (room.gamers.has(gamerId)) {
      return { success: false, message: "Already in room" };
    }

    const sessionId = uuidv4();

    const timeout = setTimeout(() => {
      console.log(`Pending session ${sessionId} timeout, cleaning up`);
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

  confirmJoin(sessionId: string): void {
    const pending = this.pendingSessions.get(sessionId);
    if (!pending) {
      throw new Error("Invalid or expired session");
    }

    clearTimeout(pending.timeout);
    this.pendingSessions.delete(sessionId);

    const room = this.rooms.get(pending.roomId);
    if (!room) {
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

    if (room.status === "pending") {
      room.status = "waiting";
    }
  }

  getRoom(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.status === "ended") return null;
    return room;
  }

  removeGamer(roomId: string, gamerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.gamers.delete(gamerId);

    if (room.gamers.size === 0) {
      this.deleteRoom(roomId);
    } else if (gamerId === room.hostGamerId) {
      this.deleteRoom(roomId);
    }
  }

  setReady(roomId: string, gamerId: string, ready: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const gamer = room.gamers.get(gamerId);
    if (!gamer) return false;

    gamer.ready = ready;

    const allReady = Array.from(room.gamers.values()).every(g => g.ready);
    if (allReady) {
      room.status = "ready";
      return true;
    }

    return false;
  }

  startGame(roomId: string): MysteryPlayer | null {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== "ready") {
      throw new Error("Cannot start game");
    }

    const players = getMysteryPlayers();
    const randomPlayerName =
      players[Math.floor(Math.random() * players.length)].playerName;
    const mysteryPlayer = findPlayerByName(randomPlayerName);

    if (!mysteryPlayer) {
      throw new Error("Failed to generate mystery player");
    }

    room.mysteryPlayer = mysteryPlayer;
    room.status = "inProgress";
    room.startedAt = new Date();

    return mysteryPlayer;
  }

  processGuess(roomId: string, gamerId: string, guessId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== "inProgress") {
      throw new Error("Game not in progress");
    }

    if (!room.mysteryPlayer) {
      throw new Error("Mystery player not set");
    }

    const gamer = room.gamers.get(gamerId);
    if (!gamer || gamer.guessesLeft <= 0) {
      throw new Error("No guesses left");
    }

    const guessedPlayer = findPlayerByName(guessId);
    if (!guessedPlayer) {
      throw new Error("Player not found");
    }

    const mask = compareGuess(guessedPlayer, room.mysteryPlayer);

    gamer.guessesLeft--;
    gamer.guesses.push({
      guessId: guessedPlayer.playerName,
      mask,
    });

    const isCorrect = guessedPlayer.id === room.mysteryPlayer.id;

    if (isCorrect) {
      room.status = "ended";
    }

    const allGuessesExhausted = Array.from(room.gamers.values()).every(
      g => g.guessesLeft === 0
    );

    if (allGuessesExhausted && !isCorrect) {
      room.status = "ended";
    }

    return {
      mask,
      guessesLeft: gamer.guessesLeft,
      isCorrect,
      isEnded: room.status === "ended",
    };
  }

  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.gamers.forEach((_, gamerId) => {
        const pendingKeys = Array.from(this.pendingSessions.entries());
        pendingKeys.forEach(([sessionId, pending]) => {
          if (pending.gamerId === gamerId) {
            clearTimeout(pending.timeout);
            this.pendingSessions.delete(sessionId);
          }
        });
      });
    }
    this.rooms.delete(roomId);
  }

  broadcastToRoom(roomId: string, event: string, data: unknown): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (!this.sessionManager) {
      console.error("SessionManager not set in RoomManager");
      return;
    }

    const eventString = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const allSessions = this.sessionManager.getAllSessions();

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
            } catch (e) {
              console.error(`Failed to send SSE to ${sessionId}:`, e);
            }
          }
        }
      }
    });
  }

  getAllRooms(): Map<string, Room> {
    return new Map(this.rooms);
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}
