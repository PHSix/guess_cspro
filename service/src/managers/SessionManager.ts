import type { Session } from "../models/Session";
import {
  SESSION_INACTIVE_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS,
} from "../constants";

export class SessionManager {
  private sessions: Map<string, Session>;
  private cleanupTimer: NodeJS.Timeout | null;

  constructor() {
    this.sessions = new Map();
    this.cleanupTimer = null;
    this.startCleanupTimer();
  }

  createSession(
    sessionId: string,
    gamerId: string,
    gamerName: string,
    roomId: string,
    response: unknown
  ): void {
    if (this.sessions.size >= 100) {
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
  }

  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        session.response.end();
      } catch (e) {
        console.error("Error closing SSE connection:", e);
      }
      this.sessions.delete(sessionId);
    }
  }

  heartbeat(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = new Date();
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

      toRemove.forEach(sessionId => {
        console.log(`Removing inactive session: ${sessionId}`);
        this.removeSession(sessionId);
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  getAllSessions(): Map<string, Session> {
    return new Map(this.sessions);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}
