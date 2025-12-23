import { Hono } from "hono";
import type { Context } from "hono";
import type { ServerResponse } from "node:http";
import { RoomManager } from "../managers/RoomManager";
import { SessionManager } from "../managers/SessionManager";
import {
  createRoomSchema,
  joinRoomSchema,
  readySchema,
  guessSchema,
  sessionIdSchema,
} from "../utils/validation";

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
  return c.json({ alive: true }, 200);
});

app.post("/room/create", async c => {
  try {
    const body = await c.req.json();
    const parsed = createRoomSchema.parse(body);

    const result = roomManager.createRoom(
      parsed.gamerId,
      parsed.gamerName,
      parsed.difficulty
    );

    return c.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ success: false, message: error.message }, 400);
    }
    return c.json({ success: false, message: "Invalid request" }, 400);
  }
});

app.post("/room/join", async c => {
  try {
    const body = await c.req.json();
    const parsed = joinRoomSchema.parse(body);

    const result = roomManager.joinRoom(
      parsed.roomId,
      parsed.gamerId,
      parsed.gamerName
    );

    if ("success" in result && result.success === false) {
      return c.json(result, 400);
    }

    return c.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ success: false, message: error.message }, 400);
    }
    return c.json({ success: false, message: "Invalid request" }, 400);
  }
});

app.get("/sse/:sessionId", async c => {
  const sessionId = c.req.param("sessionId");

  if (!sessionId) {
    return c.text("Invalid session ID", 400);
  }

  try {
    sessionIdSchema.parse(sessionId);
  } catch (error) {
    return c.text("Invalid session ID", 400);
  }

  try {
    roomManager.confirmJoin(sessionId);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ success: false, message: error.message }, 401);
    }
    return c.json({ success: false, message: "Failed to join room" }, 500);
  }

  const pending = roomManager.getPendingSession(sessionId);

  if (!pending) {
    return c.json({ success: false, message: "Invalid session" }, 401);
  }

  // Create a streaming response for SSE
  const stream = new ReadableStream({
    start(controller) {
      const res = c.req.raw as unknown as ServerResponse;

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        sessionManager.createSession(
          sessionId,
          pending.gamerId,
          pending.gamerName,
          pending.roomId,
          res
        );

        const connectEvent = `event: connected\ndata: ${JSON.stringify({
          gamerId: pending.gamerId,
          gamerName: pending.gamerName,
        })}\n\n`;
        res.write(connectEvent);
      }

      // Keep the connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          res.write(": heartbeat\n\n");
        } catch (e) {
          clearInterval(heartbeatInterval);
          controller.close();
        }
      }, 30000);

      // Cleanup on connection close
      res.on("close", () => {
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

const requireAuth = async (
  c: Context,
  next: () => Promise<void>
): Promise<Response | void> => {
  const sessionId = c.req.header("X-Session-Id");
  if (!sessionId) {
    return c.json({ success: false, message: "Session ID required" }, 401);
  }

  try {
    sessionIdSchema.parse(sessionId);
  } catch (error) {
    return c.json({ success: false, message: "Invalid session ID" }, 401);
  }

  const session = sessionManager.getSession(sessionId);
  if (!session) {
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
      roomManager.broadcastToRoom(session.roomId, "allReady", {});
    }

    return c.json({ success: true });
  } catch (error) {
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
      return c.json({ success: false, message: "Not the host" }, 403);
    }

    roomManager.startGame(session.roomId);

    roomManager.broadcastToRoom(session.roomId, "gameStarted", {
      status: "inProgress",
    });

    return c.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ success: false, message: error.message }, 400);
    }
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
        roomManager.broadcastToRoom(session.roomId, "gameEnded", {
          status: "ended",
          winner: result.isCorrect ? session.gamerId : undefined,
          mysteryPlayer: room.mysteryPlayer,
        });
      }
    }

    return c.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ success: false, message: error.message }, 400);
    }
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
    return c.json({ success: false, message: "Invalid session ID" }, 400);
  }
});

export { app, roomManager, sessionManager };
