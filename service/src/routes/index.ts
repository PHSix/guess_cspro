import { Hono } from "hono";
import type { Context } from "hono";
import { PendingSessionInfo, RoomManager } from "../managers/RoomManager";
import { SessionManager } from "../managers/SessionManager";
import {
  createRoomSchema,
  joinRoomSchema,
  readySchema,
  guessSchema,
  sessionIdSchema,
} from "../utils/validation";
import { logger } from "../utils/logger";

const roomManager = new RoomManager();
const sessionManager = new SessionManager();

// Set session manager in room manager for broadcasting
roomManager.setSessionManager(sessionManager);

const app = new Hono();

app.use(async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, X-Session-Id");
  await next();
});

// Health check endpoint
app.get("/alive", c => {
  logger.debug("Health check requested");
  return c.json({ alive: true }, 200);
});

app.post("/room/create", async c => {
  try {
    const body = await c.req.json();
    const parsed = createRoomSchema.parse(body);

    logger.info({
      msg: "POST /room/create",
      gamerId: parsed.gamerId,
      gamerName: parsed.gamerName,
      difficulty: parsed.difficulty,
    });

    const result = roomManager.createRoom(
      parsed.gamerId,
      parsed.gamerName,
      parsed.difficulty
    );

    return c.json(result);
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        msg: "POST /room/create failed",
        error: error.message,
      });
      return c.json({ success: false, message: error.message }, 400);
    }
    logger.error({ msg: "POST /room/create failed: unknown error" });
    return c.json({ success: false, message: "Invalid request" }, 400);
  }
});

app.post("/room/join", async c => {
  try {
    const body = await c.req.json();
    const parsed = joinRoomSchema.parse(body);

    logger.info({
      msg: "POST /room/join",
      roomId: parsed.roomId,
      gamerId: parsed.gamerId,
      gamerName: parsed.gamerName,
    });

    const result = roomManager.joinRoom(
      parsed.roomId,
      parsed.gamerId,
      parsed.gamerName
    );

    if ("success" in result && result.success === false) {
      logger.warn({
        msg: "POST /room/join failed",
        reason: result.message,
      });
      return c.json(result, 400);
    }

    return c.json(result);
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        msg: "POST /room/join failed",
        error: error.message,
      });
      return c.json({ success: false, message: error.message }, 400);
    }
    logger.error({ msg: "POST /room/join failed: unknown error" });
    return c.json({ success: false, message: "Invalid request" }, 400);
  }
});

app.get("/sse/:sessionId", async c => {
  const sessionId = c.req.param("sessionId");

  logger.info({
    msg: "GET /sse/:sessionId - SSE connection request",
    sessionId,
  });

  if (!sessionId) {
    logger.warn({ msg: "SSE connection failed: missing sessionId" });
    return c.text("Invalid session ID", 400);
  }

  try {
    sessionIdSchema.parse(sessionId);
  } catch (error) {
    logger.warn({
      msg: "SSE connection failed: invalid sessionId format",
      sessionId,
    });
    return c.text("Invalid session ID", 400);
  }

  let pending: PendingSessionInfo | null = null;

  try {
    pending = roomManager.confirmJoin(sessionId);
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        msg: "SSE confirmJoin failed",
        sessionId,
        error: error.message,
      });
      return c.json({ success: false, message: error.message }, 401);
    }
    logger.error({ msg: "SSE confirmJoin failed: unknown error", sessionId });
    return c.json({ success: false, message: "Failed to join room" }, 500);
  }

  if (!pending) {
    logger.error({
      msg: "SSE connection failed: pending session not found",
      sessionId,
    });
    return c.json({ success: false, message: "Invalid session" }, 401);
  }

  // Create a streaming response for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Create a writable response object compatible with SessionManager
      const writableResponse = {
        end: () => {
          logger.info({ msg: "SSE response ended", sessionId });
          try {
            controller.close();
          } catch (e) {
            // Already closed
          }
        },
        write: (data: string) => {
          try {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            logger.warn({
              msg: "SSE write failed",
              sessionId,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        },
        writableEnded: false,
      };

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        sessionManager.createSession(
          sessionId,
          pending.gamerId,
          pending.gamerName,
          pending.roomId,
          writableResponse as never
        );

        // Get room info to send complete state
        const room = roomManager.getRoom(pending.roomId);

        // Send connected event with gamer info
        const connectEvent = `event: connected\ndata: ${JSON.stringify({
          gamerId: pending.gamerId,
          gamerName: pending.gamerName,
          roomId: pending.roomId,
        })}\n\n`;
        writableResponse.write(connectEvent);

        // Send current room state (all gamers in the room)
        if (room && room.gamers.size > 0) {
          const gamersList = Array.from(room.gamers.values()).map(g => ({
            gamerId: g.gamerId,
            gamerName: g.gamerName,
            ready: g.ready,
            joinedAt: g.joinedAt.toISOString(),
          }));

          const roomStateEvent = `event: roomState\ndata: ${JSON.stringify({
            gamers: gamersList,
            roomStatus: room.status,
          })}\n\n`;
          writableResponse.write(roomStateEvent);

          logger.info({
            msg: "SSE connection established - sent room state",
            sessionId,
            gamerId: pending.gamerId,
            roomId: pending.roomId,
            gamersCount: gamersList.length,
          });
        } else {
          logger.info({
            msg: "SSE connection established - empty room",
            sessionId,
            gamerId: pending.gamerId,
            roomId: pending.roomId,
          });
        }

        // Broadcast to other gamers in the room that a new gamer joined
        roomManager.broadcastToRoom(pending.roomId, "gamerJoined", {
          gamerId: pending.gamerId,
          gamerName: pending.gamerName,
        });
      } else {
        logger.info({
          msg: "SSE connection already exists",
          sessionId,
        });
      }

      // Keep the connection alive with proper heartbeat event
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeatEvent = `event: heartbeat\ndata: ${JSON.stringify({
            timestamp: new Date().toISOString(),
          })}\n\n`;
          writableResponse.write(heartbeatEvent);
        } catch (e) {
          logger.warn({
            msg: "SSE heartbeat failed, closing connection",
            sessionId,
            error: e instanceof Error ? e.message : String(e),
          });
          clearInterval(heartbeatInterval);
          writableResponse.writableEnded = true;
          try {
            controller.close();
          } catch (e) {
            // Already closed
          }
        }
      }, 30000);

      // Cleanup on connection close
      // Note: We can't detect client disconnect with ReadableStream in Hono
      // The SessionManager's timeout will handle inactive sessions
      logger.debug({
        msg: "SSE heartbeat started",
        sessionId,
        intervalMs: 30000,
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
});

const requireAuth = async (
  c: Context,
  next: () => Promise<void>
): Promise<Response | void> => {
  const sessionId = c.req.header("X-Session-Id");
  if (!sessionId) {
    logger.warn({
      msg: "requireAuth: missing X-Session-Id header",
      path: c.req.path,
    });
    return c.json({ success: false, message: "Session ID required" }, 401);
  }

  try {
    sessionIdSchema.parse(sessionId);
  } catch (error) {
    logger.warn({
      msg: "requireAuth: invalid sessionId format",
      sessionId,
      path: c.req.path,
    });
    return c.json({ success: false, message: "Invalid session ID" }, 401);
  }

  const session = sessionManager.getSession(sessionId);
  if (!session) {
    logger.warn({
      msg: "requireAuth: session not found",
      sessionId,
      path: c.req.path,
    });
    return c.json({ success: false, message: "Session not found" }, 401);
  }

  await next();
};

app.use("/room/*", requireAuth);

app.post("/room/ready", async c => {
  const sessionId = c.req.header("X-Session-Id")!;

  try {
    const session = sessionManager.getSession(sessionId);
    if (!session || !session.roomId) {
      return c.json({ success: false, message: "Invalid session" }, 401);
    }

    const body = await c.req.json();
    const parsed = readySchema.parse(body);

    logger.info({
      msg: "POST /room/ready",
      roomId: session.roomId,
      gamerId: session.gamerId,
      ready: parsed.ready,
    });

    const allReady = roomManager.setReady(
      session.roomId,
      session.gamerId,
      parsed.ready
    );

    roomManager.broadcastToRoom(session.roomId, "readyUpdate", {
      gamerId: session.gamerId,
      ready: parsed.ready,
    });

    if (allReady) {
      logger.info({
        msg: "All gamers ready",
        roomId: session.roomId,
      });
      roomManager.broadcastToRoom(session.roomId, "allReady", {});
    }

    return c.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        msg: "POST /room/ready failed",
        error: error.message,
      });
      return c.json({ success: false, message: "Invalid request" }, 400);
    }
    logger.error({ msg: "POST /room/ready failed: unknown error" });
    return c.json({ success: false, message: "Invalid request" }, 400);
  }
});

app.post("/room/start", async c => {
  const sessionId = c.req.header("X-Session-Id")!;

  try {
    const session = sessionManager.getSession(sessionId);
    if (!session || !session.roomId) {
      return c.json({ success: false, message: "Invalid session" }, 401);
    }

    const room = roomManager.getRoom(session.roomId);
    if (!room) {
      return c.json({ success: false, message: "Room not found" }, 404);
    }

    if (room.hostGamerId !== session.gamerId) {
      logger.warn({
        msg: "POST /room/start failed: not the host",
        roomId: session.roomId,
        requesterGamerId: session.gamerId,
        hostGamerId: room.hostGamerId,
      });
      return c.json({ success: false, message: "Not the host" }, 403);
    }

    logger.info({
      msg: "POST /room/start",
      roomId: session.roomId,
      hostGamerId: session.gamerId,
    });

    roomManager.startGame(session.roomId);

    roomManager.broadcastToRoom(session.roomId, "gameStarted", {
      status: "inProgress",
    });

    return c.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        msg: "POST /room/start failed",
        error: error.message,
      });
      return c.json({ success: false, message: error.message }, 400);
    }
    logger.error({ msg: "POST /room/start failed: unknown error" });
    return c.json({ success: false, message: "Failed to start game" }, 500);
  }
});

app.post("/room/action", async c => {
  const sessionId = c.req.header("X-Session-Id")!;

  try {
    const session = sessionManager.getSession(sessionId);
    if (!session || !session.roomId) {
      return c.json({ success: false, message: "Invalid session" }, 401);
    }

    const body = await c.req.json();
    const parsed = guessSchema.parse(body);

    logger.info({
      msg: "POST /room/action (guess)",
      roomId: session.roomId,
      gamerId: session.gamerId,
      guess: parsed.guess,
    });

    const result = roomManager.processGuess(
      session.roomId,
      session.gamerId,
      parsed.guess
    );

    roomManager.broadcastToRoom(session.roomId, "guessResult", {
      gamerId: session.gamerId,
      guessId: parsed.guess,
      mask: result.mask,
      guessesLeft: result.guessesLeft,
    });

    if (result.isEnded) {
      const room = roomManager.getRoom(session.roomId);
      if (room && room.mysteryPlayer) {
        logger.info({
          msg: "Game ended",
          roomId: session.roomId,
          winner: result.isCorrect ? session.gamerId : undefined,
        });
        roomManager.broadcastToRoom(session.roomId, "gameEnded", {
          status: "ended",
          winner: result.isCorrect ? session.gamerId : undefined,
          mysteryPlayer: {
            ...room.mysteryPlayer,
            playerName: room.mysteryPlayer.proId,
          },
        });
      }
    }

    return c.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        msg: "POST /room/action failed",
        error: error.message,
      });
      return c.json({ success: false, message: error.message }, 400);
    }
    logger.error({ msg: "POST /room/action failed: unknown error" });
    return c.json({ success: false, message: "Failed to process guess" }, 500);
  }
});

app.post("/room/leave", async c => {
  const sessionId = c.req.header("X-Session-Id")!;

  try {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return c.json({ success: false, message: "Invalid session" }, 401);
    }

    logger.info({
      msg: "POST /room/leave",
      roomId: session.roomId,
      gamerId: session.gamerId,
    });

    const roomId = session.roomId;
    if (roomId) {
      roomManager.removeGamer(roomId, session.gamerId);
    }
    sessionManager.removeSession(sessionId);

    if (roomId) {
      roomManager.broadcastToRoom(roomId, "gamerLeft", {
        gamerId: session.gamerId,
      });
    }

    return c.json({ success: true });
  } catch (error) {
    logger.error({
      msg: "POST /room/leave failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ success: false, message: "Failed to leave room" }, 500);
  }
});

app.post("/room/heartbeat", async c => {
  const sessionId = c.req.header("X-Session-Id")!;

  try {
    sessionIdSchema.parse(sessionId);
    sessionManager.heartbeat(sessionId);
    return c.json({ success: true });
  } catch (error) {
    logger.error({
      msg: "POST /room/heartbeat failed",
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ success: false, message: "Invalid session ID" }, 400);
  }
});

export { app, roomManager, sessionManager };
