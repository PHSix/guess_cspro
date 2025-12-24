import type { Session } from "../models/Session";
import {
  SESSION_INACTIVE_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS,
  MAX_TOTAL_SESSIONS,
} from "../constants";
import { logger } from "../utils/logger";

export class SessionManager {
  private sessions: Map<string, Session>;
  private cleanupTimer: NodeJS.Timeout | null;

  constructor() {
    this.sessions = new Map();
    this.cleanupTimer = null;
    this.startCleanupTimer();
    logger.info("SessionManager initialized");
  }

  createSession(
    sessionId: string,
    gamerId: string,
    gamerName: string,
    roomId: string,
    response: unknown
  ): void {
    if (this.sessions.size >= MAX_TOTAL_SESSIONS) {
      logger.error({
        msg: "Create session failed: maximum sessions reached",
        currentCount: this.sessions.size,
        maxCount: MAX_TOTAL_SESSIONS,
      });
      throw new Error("Maximum sessions reached");
    }

    const session: Session = {
      sessionId,
      gamerId,
      gamerName,
      roomId,
      response: response as never,
      lastActive: new Date(),
    };
    this.sessions.set(sessionId, session);

    logger.info({
      msg: "Session created",
      sessionId,
      gamerId,
      gamerName,
      roomId,
      totalSessions: this.sessions.size,
    });
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.debug({ msg: "Get session: not found", sessionId });
    }
    return session || null;
  }

  removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        session.response.end();
      } catch (e) {
        logger.error({
          msg: "Error closing SSE connection",
          sessionId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      this.sessions.delete(sessionId);

      logger.info({
        msg: "Session removed",
        sessionId,
        gamerId: session.gamerId,
        remainingSessions: this.sessions.size,
      });
    } else {
      logger.debug({ msg: "Remove session: not found", sessionId });
    }
  }

  heartbeat(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = new Date();
      logger.debug({
        msg: "Session heartbeat",
        sessionId,
        gamerId: session.gamerId,
      });
    } else {
      logger.warn({ msg: "Heartbeat failed: session not found", sessionId });
    }
  }

  startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const now = new Date();
      const toRemove: string[] = [];

      this.sessions.forEach((session, sessionId) => {
        const inactiveTime = now.getTime() - session.lastActive.getTime();
        if (inactiveTime > SESSION_INACTIVE_TIMEOUT_MS) {
          toRemove.push(sessionId);
        }
      });

      if (toRemove.length > 0) {
        logger.info({
          msg: "Cleaning up inactive sessions",
          count: toRemove.length,
          sessionIds: toRemove,
        });

        toRemove.forEach(sessionId => {
          this.removeSession(sessionId);
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    logger.info({
      msg: "Session cleanup timer started",
      intervalMs: HEARTBEAT_INTERVAL_MS,
      timeoutMs: SESSION_INACTIVE_TIMEOUT_MS,
    });
  }

  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logger.info("Session cleanup timer stopped");
    }
  }

  getAllSessions(): Map<string, Session> {
    return new Map(this.sessions);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}
