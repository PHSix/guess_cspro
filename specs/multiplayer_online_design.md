# Online Room Game Feature Specification

## 1. Overview

### 1.1 Project Background

This specification document outlines the requirements and design for adding an online room playing feature to a web-based mini-game. The game is a CS2 professional player guessing game where multiple gamers (up to 3) in a room guess a mystery professional player ID randomly or based on historical results until someone guesses correctly or all guessing opportunities (8 per gamer) are exhausted. The system does not involve user login or database storage; all gamer identities (gamerId) are generated and maintained on the client-side. The server maintains in-memory room and session states, supporting up to 100 online gamers (total sessions). Communication uses streamable HTTP: clients send gamer actions via POST requests, and the server broadcasts events and updates via SSE (Server-Sent Events).

Key changes and clarifications:

- Integrate game-specific logic: mystery player generation, guess processing, opportunity limits, game status categories, guess result masks (D/N/M).
- Mask logic: country supports 'N' (near) state, similar to birthYear and majorsPlayed. playerName and team only support 'M'/'D'. Comparison algorithm is assumed to be implemented on the server.
- Gamer departure includes active /room/leave and passive disconnection (e.g., browser close), without reconnection mechanisms.
- Rooms created via /room/create require host SSE connection to activate, preventing memory attacks.
- Add gamerName parameter to /room/create and /room/join, stored in memory.
- SSE connections use server-generated sessionId; POST actions carry sessionId in headers.
- Room joining requires successful SSE connection; use timeout validation in between.
- Add client request interface validation using Zod or similar for input parameters.

### 1.2 Key Requirements

- **No Login Mechanism**: gamerId generated and stored locally on client (e.g., via localStorage). gamerName input by user.
- **Room Flow**:
  - Host creates room (with gamerName), gets sessionId, connects SSE to activate room.
  - Gamers join room (with gamerName), get sessionId, connect SSE to confirm join.
  - Host waits for gamers to ready; starts game when all ready.
  - On game start, server randomly generates mystery player (from hardcoded list).
  - During game, gamers guess player IDs; server processes guesses, generates result masks, broadcasts to all. Each gamer has 8 guesses.
  - Game ends if someone guesses correctly (ID match) or all guesses exhausted; broadcast end status and mystery player.
- **Game Status Categories** (extend Room.status):
  - 'pending': Pending activation (post-create, pre-SSE).
  - 'waiting': Activated but not started, waiting for readies.
  - 'ready': All gamers ready, host can start.
  - 'inProgress': Game in progress.
  - 'ended': Game ended (correct guess or guesses exhausted).
- **Guess Logic**:
  - Each guess: Send player ID; server compares to mystery, generates mask { playerName: 'D'|'M', team: 'D'|'M', country: 'D'|'N'|'M', birthYear: 'D'|'N'|'M', majorsPlayed: 'D'|'N'|'M' }.
    - M: Exact match.
    - N: Near (e.g., birthYear diff 1-2 years, majorsPlayed diff 1-2; country near per implemented algorithm; no N for playerName/team).
    - D: Difference.
  - Update remaining guesses; check for game end.
- **Limits**:
  - Max 3 gamers per room.
  - Global max 100 online gamers (sessions).
  - 8 guesses per gamer.
- **Technical Constraints**:
  - Server: No database, in-memory only. Mystery player data hardcoded (array of players, random select).
  - No WebSocket/Socket.io; use SSE for downstream, POST for upstream.
- **Assumptions**:
  - Server: Node.js + Hono.
  - Client: JavaScript (browser).
  - Player data: Static array on server, e.g., [{ id: '1', playerName: 's1mple', team: 'NaVi', country: 'Ukraine', birthYear: 1997, majorsPlayed: 20 }, ...].
  - Comparison algorithm: Already implemented for country 'N'; no details needed.

### 1.3 System Architecture

- **Client**: Browser-side; generates gamerId, inputs gamerName, handles UI, sends POST (with sessionId header), listens to SSE.
- **Server**: Node.js server; manages RoomManager and SessionManager; processes requests, pushes SSE events. Uses sessionId for auth/connection.
- **Communication**:
  - Upstream: HTTP POST JSON, header with sessionId.
  - Downstream: SSE event stream (text/event-stream).
- **Security**: Server-generated sessionId (UUID) for tamper prevention. Timeout to prevent memory abuse. Rate limiting for DoS. Zod for input validation.

### 1.4 Recommended Tech Stack and Frameworks

- **Server**: Node.js (runtime), TypeScript (language for type safety), Hono.js (web framework for routing/middleware).
- **Key Libraries**:
  - Zod: For API input validation; define schemas and parse request bodies.
  - uuid: For generating roomId and sessionId.
  - Others: No external DB; use built-in Map/Object for in-memory. For Node.js support in Hono, use @hono/node-server.
- **Dev Suggestions**: Use ts-node or tsconfig.json for TS compilation. Dependencies: `npm install hono @hono/node-server zod uuid`. For production, use pm2 for process management. Code structure: src/index.ts entry, src/managers/ for RoomManager/SessionManager, src/models/ for Room/Session, src/routes/ for API routes.

## 2. Server Design

Server implemented with Node.js + Hono. Core modules: Room, Session, RoomManager, SessionManager. Data in memory (Maps). Use TypeScript for types.

### 2.1 Core Entities

#### 2.1.1 Room

- **Description**: Represents a game room; manages state, gamer list, mystery player, progress.
- **Properties** (TypeScript types):
  - `roomId`: string - Unique ID (server-generated UUID).
  - `hostGamerId`: string - Host gamerId.
  - `gamers`: Map<string, GamerState> - gamerId to state (max 3).
    - GamerState: { gamerName: string, ready: boolean, joinedAt: Date, guessesLeft: number = 8, guesses: Array<{ guessId: string, mask: Mask }> }.
  - `status`: 'pending' | 'waiting' | 'ready' | 'inProgress' | 'ended'.
  - `mysteryPlayer`: MysteryPlayer | null - Start-generated.
    - MysteryPlayer: { id: string, playerName: string, team: string, country: string, birthYear: number, majorsPlayed: number }.
    - Mask: { playerName: 'D'|'M', team: 'D'|'M', country: 'D'|'N'|'M', birthYear: 'D'|'N'|'M', majorsPlayed: 'D'|'N'|'M' }.
  - `createdAt`: Date.
- **Methods**:
  - `addGamer(gamerId: string, gamerName: string)`: Add gamer; set host if first. Check limits, activation.
  - `removeGamer(gamerId: string)`: Remove; disband if host leaves.
  - `setReady(gamerId: string, ready: boolean)`: Update ready; set 'ready' if all.
  - `startGame()`: Host-only; generate mysteryPlayer, set 'inProgress'.
  - `processGuess(gamerId: string, guessId: string)`: Compare, generate mask (use impl algo), decrement guessesLeft, add to guesses. Check win/exhaust; end if so. Return mask.
  - `broadcastEvent(event: string, data: any)`: Push SSE to room gamers via Sessions.
  - `activate()`: Host SSE connect; set 'waiting' from 'pending'.

#### 2.1.2 Session

- **Description**: Represents gamer-server connection (SSE stream). One per gamer.
- **Properties** (TypeScript types):
  - `sessionId`: string - Server-generated UUID.
  - `gamerId`: string.
  - `gamerName`: string.
  - `roomId`: string | null.
  - `response`: http.ServerResponse - For SSE pushes.
  - `lastActive`: Date - Heartbeat tracking.
- **Methods**:
  - `sendEvent(event: string, data: any)`: Write SSE (format: `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).
  - `close()`: Close connection.
  - Handle close: res.on('close', () => removeSession, handle disconnect as removeGamer).

### 2.2 Managers

#### 2.2.1 RoomManager

- **Description**: Global room manager.
- **Properties** (TypeScript types):
  - `rooms`: Map<string, Room>.
  - `pendingSessions`: Map<string, { roomId: string, gamerId: string, gamerName: string, timeout: NodeJS.Timeout }>.
  - `playerData`: Array<MysteryPlayer> - Hardcoded list.
- **Methods**:
  - `createRoom(gamerId: string, gamerName: string)`: Create 'pending' room, gen sessionId, add to pending. 10s timeout delete. Check global limit. Return { roomId, sessionId }.
  - `getRoom(roomId: string)`: Get room (check active).
  - `joinRoom(roomId: string, gamerId: string, gamerName: string)`: Gen sessionId, add to pending (10s timeout). Return { sessionId }. Require existing/active room.
  - `confirmJoin(sessionId: string)`: Remove from pending, create Session, addGamer. Activate if create. Broadcast 'gamerJoined' with gamerName.
  - `deleteRoom(roomId: string)`: Delete, notify gamers.
  - `broadcastToRoom(roomId: string, event: string, data: any)`: Use Room.broadcastEvent.

#### 2.2.2 SessionManager

- **Description**: Global session manager.
- **Properties** (TypeScript types):
  - `sessions`: Map<string, Session>.
- **Methods**:
  - `createSession(sessionId: string, gamerId: string, gamerName: string, roomId: string, res: http.ServerResponse)`: Create, check limit, update lastActive.
  - `getSession(sessionId: string)`: Get.
  - `removeSession(sessionId: string)`: Remove, close, removeGamer if in room, broadcast 'gamerLeft'.
  - `heartbeat(sessionId: string)`: Update lastActive.
  - Timer (every 30s): Check lastActive, remove if >5min.

### 2.3 API Endpoints

JSON format. POSTs require 'X-Session-Id' header. Use Zod schemas in middleware for body validation (parse with z.parse(); 400 on fail). Use Hono's context (c) for req/res handling.

- **POST /room/create**
  - Request: { gamerId: string, gamerName: string } (Zod: z.object({ gamerId: z.string().uuid(), gamerName: z.string().min(1).max(50) }))
  - Response: { roomId: string, sessionId: string }
  - Logic: Validate, createRoom, 10s timeout.

- **POST /room/join**
  - Request: { gamerId: string, gamerName: string, roomId: string } (Zod: z.object({ gamerId: z.string().uuid(), gamerName: z.string().min(1).max(50), roomId: z.string().uuid() }))
  - Response: { sessionId: string } or { success: false, message: string }
  - Logic: Validate, check room active, joinRoom, 10s timeout.

- **GET /sse/:sessionId**
  - Description: SSE endpoint.
  - Logic: Validate param (z.string().uuid()), confirmJoin if pending, set SSE headers, keep open. Send 'connected'. Listen res.close for disconnect.

- **POST /room/ready**
  - Request: { ready: boolean } (Zod: z.object({ ready: z.boolean() })) (header: sessionId)
  - Response: { success: boolean }
  - Logic: Validate header/body, update ready, broadcast 'allReady' if all.

- **POST /room/start**
  - Request: {} (header: sessionId) (no body Zod, header z.string().uuid())
  - Response: { success: boolean }
  - Logic: Validate, host & 'ready', startGame, broadcast 'gameStarted'.

- **POST /room/action**
  - Request: { guess: string } (Zod: z.object({ guess: z.string().min(1) })) (header: sessionId)
  - Response: { success: boolean }
  - Logic: Validate, 'inProgress', processGuess, broadcast 'guessResult' { gamerId, guessId, mask, guessesLeft, status }. If end, 'gameEnded' { winner?, mysteryPlayer }.

- **POST /room/leave**
  - Request: {} (header: sessionId)
  - Response: { success: boolean }
  - Logic: Validate, removeGamer, removeSession, broadcast 'gamerLeft'. Delete if empty.

- **POST /room/heartbeat**
  - Request: {} (header: sessionId)
  - Response: { success: boolean }
  - Logic: Validate, update lastActive.

### 2.4 Event Types (SSE)

- connected: { gamerId, gamerName }
- gamerJoined: { gamerId, gamerName }
- gamerLeft: { gamerId }
- readyUpdate: { gamerId, ready }
- allReady: {}
- gameStarted: { status: 'inProgress' }
- guessResult: { gamerId, guessId, mask: Mask, guessesLeft: number }
- gameEnded: { status: 'ended', winner?: string, mysteryPlayer: MysteryPlayer }
- roomEnded: {}

### 2.5 Additional Logic

- **Disconnect Handling**: res.close triggers removeSession (like /room/leave).
- **Timeout**: pendingSessions use setTimeout(10000, delete).
- **Mystery Generation**: startGame random from playerData.
- **Mask Calculation**: Use implemented algo (birthYear N |diff|<=2, etc.; country N per algo; strings M/D).
- **Input Validation**: Hono middleware for Zod; 400 with error details.
- **Error Handling**: 401 invalid sessionId, 404 inactive room, 400 no guesses left.
- **Cleanup**: SessionManager timer for inactive.

## 3. Client Design

Client in pure JavaScript (or React/Vue), browser.

### 3.1 GamerId and Name Management

- gamerId: Generate/store UUID in localStorage.
- gamerName: User input, send in create/join.

### 3.2 UI Flow

- Home: Input gamerName, create room or join with roomId.
- Room: Show gamer list (with names), ready button, start button (host, when ready).
- Game: Input guess ID, send /room/action; show guesses (masks incl. country N), remaining, status. On end, show mystery and winner.

### 3.3 Communication Implementation

- **Create/Join Flow**:
  - POST, get { roomId?, sessionId }.
  - Connect SSE: new EventSource(`/sse/${sessionId}`).
  - onmessage: Parse { event, data }, update UI (e.g., guessResult render mask).

- **SSE Listener**:

  ```javascript
  const eventSource = new EventSource(`/sse/${sessionId}`);
  eventSource.onmessage = e => {
    const { event, data } = JSON.parse(e.data);
    // Handle UI updates
  };
  eventSource.onerror = () => {
    /* Show disconnect, no reconnect */
  };
  ```

- **POST Send**:

  ```javascript
  async function sendPost(url, data) {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionId,
      },
      body: JSON.stringify(data),
    });
  }
  ```

- **Heartbeat**: setInterval(() => sendPost('/room/heartbeat', {}), 30000);

### 3.4 Exception Handling

- SSE Disconnect: Show "Connection lost", no auto-reconnect.
- Timeout: Handle server errors if SSE fails.
- Browser Close: Auto-disconnect.
- Input Errors: Handle 400 from Zod, show messages.

## 4. Implementation Notes

- **Performance**: Low memory, timeouts prevent abuse.
- **Scalability**: Add Redis later for memory.
- **Testing**: Cover timeouts, disconnects, guesses, masks (incl. country N), ends, Zod fails.
- **Deployment**: Support keep-alive. Compile TS, run Node.js.
