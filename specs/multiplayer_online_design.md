# Online Room Game Feature Specification

## 1. Overview

### 1.1 Project Background

This specification document outlines the requirements and design for adding an online room playing feature to a web-based mini-game. The game is a CS2 professional player guessing game where multiple gamers (up to 3) in a room guess a mystery professional player ID randomly or based on historical results until someone guesses correctly or all guessing opportunities (8 per gamer) are exhausted. The system does not involve user login or database storage; all gamer identities (gamerId) are generated and maintained on the client-side. The server maintains in-memory room and session states, supporting up to 100 online gamers (total sessions). Communication uses streamable HTTP: clients send gamer actions via POST requests, and the server broadcasts events and updates via SSE (Server-Sent Events).

**Implementation Status**: This feature has been implemented and is available on the `feature-online` branch.

Key changes and clarifications:

- Integrate game-specific logic: mystery player generation, guess processing, opportunity limits, game status categories, guess result masks (D/N/M/G/L).
- Mask logic: country supports 'N' (near) state, similar to birthYear and majorsPlayed. playerName and team only support 'M'/'D'. Comparison algorithm is implemented in shared/gameEngine.ts.
- Gamer departure includes active /room/leave and passive disconnection (e.g., browser close), without reconnection mechanisms.
- Rooms created via /room/create require host SSE connection to activate, preventing memory attacks.
- Add gamerName parameter to /room/create and /room/join, stored in memory.
- SSE connections use server-generated sessionId; POST actions carry sessionId in headers.
- Room joining requires successful SSE connection; use timeout validation in between (60 seconds).
- Add client request interface validation using Zod for input parameters.
- **Note**: All API endpoints use `/api/...` prefix for proper routing through Vite proxy in development.

### 1.2 Key Requirements

- **No Login Mechanism**: gamerId generated and stored locally on client (via localStorage with key `gamerId`). gamerName managed through settings page.
- **Room Flow**:
  - Host creates room (with gamerName and difficulty), gets sessionId, connects SSE to activate room.
  - Gamers join room (with gamerName and roomId), get sessionId, connect SSE to confirm join.
  - Host can start game at any time (even alone); non-host gamers show ready status.
  - On game start, server randomly generates mystery player from filtered list based on difficulty.
  - During game, gamers guess player IDs (using proId); server processes guesses via shared/gameEngine.ts, generates result masks, broadcasts to all. Each gamer has 8 guesses.
  - Game ends if someone guesses correctly (ID match) or all guesses exhausted; broadcast end status and mystery player.
- **Game Status Categories** (extend Room.status):
  - 'pending': Pending activation (post-create, pre-SSE).
  - 'waiting': Activated but not started, waiting for gamers.
  - 'ready': All non-host gamers ready, host can start.
  - 'inProgress': Game in progress.
  - 'ended': Game ended (correct guess or guesses exhausted).
- **Guess Logic** (shared/gameEngine.ts:compareGuess):
  - Each guess: Send player proId; server compares to mystery, generates mask with MatchType enum.
  - MatchType values: 'M' (Exact), 'N' (Near), 'D' (Different), 'G' (Greater), 'L' (Less).
  - playerName: M if proId matches, else D.
  - team: M if exact match, else D.
  - country: M if exact, N if same region (Europe/CIS/Americas/APAC), else D.
  - age: M if exact, L/G if within 2 years, else D.
  - majorsPlayed: M if exact, L/G if within 3, else D.
  - role: M if exact, else D.
  - Update remaining guesses; check for game end.
- **Limits**:
  - Max 3 gamers per room.
  - Global max 100 online gamers (sessions).
  - 8 guesses per gamer.
- **Technical Constraints**:
  - Server: No database, in-memory only. Player data loaded from JSON file with difficulty filtering.
  - No WebSocket/Socket.io; use SSE for downstream, POST for upstream.
- **Assumptions**:
  - Server: Node.js + Hono (@hono/node-server).
  - Client: React (browser).
  - Player data: Shared between frontend and backend via @guess-cspro/shared package.
  - Comparison algorithm: Implemented in shared/gameEngine.ts with compareGuess function.

### 1.3 System Architecture

- **Client (React)**: Browser-side; generates gamerId, manages gamerName through settings, handles UI, sends POST (with sessionId header), listens to SSE. Uses Zustand (useOnlineStore) for state management.
- **Server (Node.js + Hono)**: Manages RoomManager and SessionManager; processes requests, pushes SSE events. Uses sessionId for auth/connection.
- **Shared Code**: @guess-cspro/shared package contains game logic (compareGuess), types (Player, Mask, MatchType), and constants.
- **Communication**:
  - Upstream: HTTP POST JSON with X-Session-Id header to /api/room/\* endpoints.
  - Downstream: SSE event stream from /api/sse/:sessionId.
- **Security**: Server-generated sessionId (UUID via uuid v4) for tamper prevention. 60-second timeout to prevent memory abuse. Zod for input validation.
- **Development**: Vite proxy forwards /api/\* requests to backend server (port 3001) during development.

### 1.4 Recommended Tech Stack and Frameworks (Implemented)

- **Server**: Node.js + TypeScript, Hono.js with @hono/node-server.
- **Client**: React 19 + TypeScript, Zustand for state, Wouter for routing, custom useSSEConnection hook.
- **Shared**: @guess-cspro/shared workspace package with gameEngine.ts.
- **Key Libraries**:
  - Zod: For API input validation (schemas defined in service/src/utils/validation.ts).
  - uuid: For generating roomId and sessionId.
  - hono: Web framework with @hono/node-server for Node.js runtime.
- **Project Structure**:
  - `service/` - Backend server (RoomManager, SessionManager, routes, models).
  - `app/` - Frontend React app (pages, components, stores).
  - `shared/` - Shared types and game logic.
  - `pnpm-workspace.yaml` - Monorepo configuration.

## 2. Server Design

Server implemented with Node.js + Hono. Core modules: Room, Session, RoomManager, SessionManager. Data in memory (Maps). Use TypeScript for types.

### 2.1 Core Entities

#### 2.1.1 Room

- **Description**: Represents a game room; manages state, gamer list, mystery player, progress.
- **Properties** (TypeScript types from service/src/models/Room.ts):
  - `roomId`: string - Unique ID (server-generated UUID).
  - `hostGamerId`: string - Host gamerId.
  - `gamers`: Map<string, GamerState> - gamerId to state (max 3).
    - GamerState: { gamerId: string, gamerName: string, ready: boolean, joinedAt: Date, guessesLeft: number = 8, guesses: Array<{ guessId: string, mask: Mask }> }.
  - `status`: 'pending' | 'waiting' | 'ready' | 'inProgress' | 'ended'.
  - `difficulty`: 'all' | 'normal' | 'ylg' - Game difficulty mode.
  - `mysteryPlayer`: Player | null - Start-generated from filtered player list.
  - `createdAt`: Date.
  - `startedAt`: Date | undefined.
- **Implementation Notes**:
  - Player data loaded from service/src/data/all_players_data.json via playerDataLoader.
  - Difficulty filtering applied via mode_player_list.json configuration.
  - Mask generated using shared/gameEngine.ts compareGuess function.

#### 2.1.2 Session

- **Description**: Represents gamer-server connection (SSE stream). One per gamer.
- **Properties** (TypeScript types from service/src/models/Session.ts):
  - `sessionId`: string - Server-generated UUID.
  - `gamerId`: string.
  - `gamerName`: string.
  - `roomId`: string | null.
  - `response`: Response-like object with write/end methods for SSE pushes.
  - `lastActive`: Date - Heartbeat tracking (30s intervals).
- **Implementation Notes**:
  - Uses ReadableStream for SSE in Hono environment.
  - Automatic cleanup after 5 minutes of inactivity.

### 2.2 Managers

#### 2.2.1 RoomManager (service/src/managers/RoomManager.ts)

- **Description**: Global room manager.
- **Properties**:
  - `rooms`: Map<string, Room>.
  - `pendingSessions`: Map<string, PendingSessionInfo> with 60s timeout.
  - `sessionManager`: SessionManager - Dependency injection for broadcasting.
- **Key Methods**:
  - `createRoom(gamerId: string, gamerName: string, difficulty: string)`: Create 'pending' room, gen sessionId, add to pending. Return { roomId, sessionId }.
  - `joinRoom(roomId: string, gamerId: string, gamerName: string)`: Gen sessionId, add to pending (60s timeout). Return { sessionId } or error.
  - `confirmJoin(sessionId: string)`: Remove from pending, add gamer to room. Broadcast 'gamerJoined'. Set room status to 'waiting' if first gamer.
  - `startGame(roomId: string)`: Host can start anytime. Generate mystery player based on difficulty, set 'inProgress'.
  - `processGuess(roomId: string, gamerId: string, guessId: string)`: Use shared compareGuess. Handle game end conditions.
  - `setReady(roomId, gamerId, ready)`: Update ready status. Return true if all non-host gamers ready.
  - `removeGamer(roomId, gamerId)`: Remove gamer. Delete room if empty or host leaves.
  - `broadcastToRoom(roomId, event, data)`: Send SSE to all gamers in room.
  - `deleteRoom(roomId)`: Delete room and cleanup pending sessions.

#### 2.2.2 SessionManager (service/src/managers/SessionManager.ts)

- **Description**: Global session manager.
- **Properties**:
  - `sessions`: Map<string, Session>.
- **Key Methods**:
  - `createSession(sessionId, gamerId, gamerName, roomId, response)`: Create session with max 100 limit.
  - `getSession(sessionId)`: Get active session.
  - `removeSession(sessionId)`: Remove and cleanup.
  - `heartbeat(sessionId)`: Update lastActive timestamp.
  - `getAllSessions()`: Return copy of sessions map.
- **Timeout Handling**: Sessions inactive for 5+ minutes are automatically cleaned up.

### 2.3 API Endpoints (service/src/routes/index.ts)

JSON format. POSTs require 'X-Session-Id' header (enforced via requireAuth middleware). Use Zod schemas for validation. All endpoints prefixed with `/api/`.

- **POST /api/room/create**
  - Request: { gamerId: string, gamerName: string, difficulty?: 'all'|'normal'|'ylg' }
  - Zod: createRoomSchema validates gamerId (UUID) and gamerName (1-50 chars)
  - Response: { roomId: string, sessionId: string }
  - Logic: Create room with 60s pending timeout.

- **POST /api/room/join**
  - Request: { gamerId: string, gamerName: string, roomId: string }
  - Zod: joinRoomSchema validates all fields
  - Response: { sessionId: string } or { success: false, message: string }
  - Logic: Check room exists and available, create pending session.

- **GET /api/sse/:sessionId**
  - Description: SSE endpoint for real-time updates.
  - Logic: Validate sessionId, confirmJoin to activate, set SSE headers, keep connection open.
  - Sends: 'connected' event, 'roomState' event with current gamers list.
  - Heartbeat: Every 30 seconds.
  - CORS enabled for development.

- **POST /api/room/ready** (requires auth)
  - Request: { ready: boolean }
  - Response: { success: true }
  - Logic: Update gamer ready status, broadcast 'readyUpdate'. If all non-host ready, broadcast 'allReady'.

- **POST /api/room/start** (requires auth, host-only)
  - Request: {}
  - Response: { success: true }
  - Logic: Host can start anytime. Generates mystery player, broadcasts 'gameStarted'.

- **POST /api/room/action** (requires auth)
  - Request: { guess: string } - Player proId to guess
  - Response: { success: true }
  - Logic: Process guess via compareGuess, broadcast 'guessResult'. If correct or exhausted, broadcast 'gameEnded'.

- **POST /api/room/leave** (requires auth)
  - Request: {}
  - Response: { success: true }
  - Logic: Remove gamer from room, close session, broadcast 'gamerLeft'. Delete room if empty.

- **POST /api/room/heartbeat** (requires auth)
  - Request: {}
  - Response: { success: true }
  - Logic: Update session lastActive timestamp. Note: Server sends heartbeat via SSE; this endpoint exists for manual pings if needed.

- **GET /api/alive**
  - Response: { alive: true }
  - Logic: Health check endpoint.

### 2.4 Event Types (SSE)

Event types defined in shared/const.ts (EsCustomEvent enum). SSE data format: `event: {eventName}\ndata: {json}\n\n`.

- **connected**: { gamerId: string, gamerName: string, roomId: string } - Sent when SSE connection established.
- **roomState**: { gamers: ServerGamerInfo[], roomStatus: string } - Full room state sent on connection.
- **heartbeat**: { timestamp: string } - Keep-alive sent every 30 seconds.
- **gamerJoined**: { gamerId: string, gamerName: string } - New gamer joined room.
- **gamerLeft**: { gamerId: string } - Gamer left room.
- **readyUpdate**: { gamerId: string, ready: boolean } - Gamer changed ready status.
- **allReady**: {} - All non-host gamers are ready.
- **gameStarted**: { status: 'inProgress' } - Game started.
- **guessResult**: { gamerId: string, guessId: string, mask: Mask, guessesLeft: number } - Guess processed.
- **gameEnded**: { status: 'ended', winner?: string, mysteryPlayer: Player } - Game ended.
- **roomEnded**: {} - Room closed (empty/disbanded).

### 2.5 Additional Logic

- **Disconnect Handling**: SSE connection closure detected by writableEnded flag. Sessions cleaned up after 5 min inactivity.
- **Timeout**: Pending sessions timeout after 60 seconds (PENDING_TIMEOUT_MS).
- **Mystery Generation**: startGame uses getRandomPlayer from filtered list based on difficulty.
- **Mask Calculation**: Uses compareGuess from shared/gameEngine.ts with MatchType enum (M/N/D/G/L).
- **Input Validation**: Zod schemas in service/src/utils/validation.ts. Returns 400 with error message.
- **Error Handling**: 401 invalid sessionId, 404 inactive room, 400 no guesses left.
- **Cleanup**: SessionManager timer checks for inactive sessions (>5 min).
- **Logging**: Custom logger in service/src/utils/logger.ts with info/warn/error/debug levels.

## 3. Client Design

Client implemented in React 19 with TypeScript. Uses Zustand for state management, custom hooks for SSE connection, and Wouter for routing.

### 3.1 GamerId and Name Management

- gamerId: Generated via `crypto.randomUUID()` and stored in localStorage key 'gamerId'. Managed in useOnlineStore.initializeGamerId().
- gamerName: Managed via settings page (useSettingsStore.username). Required for room creation/joining.

### 3.2 UI Flow

- **OnlineHomePage** (`/online`): Display username, difficulty selector (for host), create/join room buttons.
- **OnlineRoomPage** (`/room`): Show gamer list with ready status, ready button (non-host), start button (host), game interface.
- **Game Interface**: PlayerSearchInput for guesses, GuessHistory for displaying results with masks.
- **Game End**: Display winner (if any) and mystery player details. "Play Again" returns to online home.

### 3.3 Communication Implementation

- **State Management**: useOnlineStore (app/src/store/useOnlineStore.ts) stores gamerId, sessionId, roomId, gamers, guesses, roomStatus, etc.
- **SSE Connection**: useSSEConnection hook (app/src/hooks/useSSEConnection.ts) manages EventSource lifecycle.
- **Custom EventSource**: Extends native EventSource to handle custom SSE events (EsCustomEvent).

**Key Implementation Details**:

```typescript
// SSE connection in useSSEConnection.ts
const es = new CustomEventSource(`/api/sse/${sessionId}`);

// Custom event listeners
es.addEventListener(EsCustomEvent.CONNECTED, (data) => { ... });
es.addEventListener(EsCustomEvent.ROOM_STATE, (data) => { ... });
es.addEventListener(EsCustomEvent.GUESS_RESULT, (data) => { ... });

// Send action via POST with X-Session-Id header
const response = await fetch(`/api${endpoint}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Session-Id": sessionId,
  },
  body: JSON.stringify(data),
});
```

**Create/Join Flow**:

1. User creates/joins room via OnlineHomePage.
2. POST request to /api/room/create or /api/room/join returns sessionId.
3. useSSEConnection hook automatically establishes SSE connection.
4. On 'connected' event, UI shows room page.
5. On 'roomState' event, gamer list is populated.

### 3.4 Exception Handling

- SSE Disconnect: isSSEConnected state tracked. Shows "Connecting to room..." loading state.
- Connection Lost: sseError state set; can show error UI.
- Timeout: Handled by server (60s pending timeout, 5min session cleanup).
- Input Errors: Toast notifications via Sonner for 400/401/404 responses.
- Browser Close: SSE connection closes automatically; session cleaned up server-side.

### 3.5 Key Components

- **OnlineHomePage**: Room creation/joining UI with difficulty selector.
- **OnlineRoomPage**: Main room interface with gamer list, game interface, results display.
- **useSSEConnection**: Custom React hook for SSE lifecycle management.
- **useOnlineStore**: Zustand store for online game state.
- **PlayerSearchInput**: Reusable searchable dropdown for player selection (also used in single-player).
- **GuessHistory**: Displays guess history with mask indicators (M/N/D/G/L).

## 4. Implementation Notes

### 4.1 Development Commands

**Server (service/):**

```bash
pnpm --filter @guess-cspro/service dev   # Start dev server (port 3001)
pnpm --filter @guess-cspro/service build  # Build for production
pnpm --filter @guess-cspro/service start  # Start production server
```

**Client (app/):**

```bash
pnpm --filter @guess-cspro/app dev        # Start Vite dev server (proxies /api to :3001)
pnpm --filter @guess-cspro/app build      # Build for production
```

**Monorepo:**

```bash
pnpm install                              # Install all dependencies
pnpm -r build                             # Build all workspaces
```

### 4.2 Configuration

- **Server Port**: 3001 (configurable via PORT env var)
- **API Proxy**: Vite proxy forwards /api/\* to backend during development
- **Player Data**: Loaded from service/src/data/all_players_data.json
- **Difficulty Filtering**: Uses shared/data/mode_player_list.json

### 4.3 Known Issues / Limitations

1. **Kick Player Feature**: UI shows kick button for host, but functionality not implemented (only shows toast).
2. **SSE Reconnection**: No automatic reconnection on disconnect. User must manually refresh.
3. **Room Persistence**: No database; rooms lost on server restart.
4. **Session Cleanup**: Relies on 5-minute timeout; disconnect detection via writableEnded flag.
5. **Client Heartbeat**: Server sends heartbeat; POST /room/heartbeat exists but is not actively used by client.

### 4.4 Testing Considerations

- Test room creation and joining flow
- Test SSE connection lifecycle (connect, heartbeat, disconnect)
- Test guess processing with all mask types (M/N/D/G/L)
- Test game end conditions (correct guess, exhausted guesses)
- Test timeout scenarios (60s pending, 5min inactivity)
- Test room cleanup on empty/disconnect
- Test concurrent gamer scenarios

### 4.5 Deployment Notes

- Compile TypeScript before deployment
- Set PORT environment variable or use default 3001
- Ensure all_players_data.json and mode_player_list.json are present
- For production, consider using pm2 for process management
- CORS enabled for development; restrict for production
- No database required; all state in-memory
