# Multiplayer Service Backend Design

## 1. Overview

This design document defines the backend architecture for adding a **multiplayer room-based gaming feature** to the existing "弗一把" (CS Professional Player Guessing Game). This feature is implemented as an independent module without modifying existing single-player functionality.

### 1.1 Key Features

- Support 2-3 players per room (maximum 3)
- Real-time communication via SSE (Server-Sent Events)
- No login required - `gamerId` generated locally and stored in localStorage
- Server-side in-memory storage, no database dependency
- Maximum 100 concurrent sessions
- 8 guesses per player; first to guess correctly wins

### 1.2 Tech Stack

- **Backend**: Node.js + Hono + TypeScript + Zod
- **Frontend**: React (reusing existing components)
- **Communication**: SSE (server push) + POST (client requests)
- **State Management**: Zustand (new store)

---

## 2. Backend Architecture (service package)

### 2.1 Project Structure

```
service/
├── src/
│   ├── index.ts              # Entry point
│   ├── models/
│   │   ├── Room.ts          # Room entity
│   │   ├── Session.ts       # SSE session entity
│   │   └── PlayerData.ts    # Player data definitions
│   ├── managers/
│   │   ├── RoomManager.ts   # Room manager
│   │   └── SessionManager.ts # Session manager
│   ├── routes/
│   │   └── index.ts         # API routes
│   ├── utils/
│   │   ├── validation.ts    # Zod schemas
│   │   ├── comparison.ts    # Guess comparison logic
│   │   └── uuid.ts          # UUID utilities
│   └── constants.ts         # Constants
├── package.json
├── tsconfig.json
└── tsconfig.node.json
```

### 2.2 Core Type Definitions

```typescript
// src/models/PlayerData.ts
export interface MysteryPlayer {
  id: string;
  playerName: string;
  team: string;
  country: string;
  birthYear: number;
  majorsPlayed: number;
  role: "AWPer" | "Rifler" | "Unknown";
}

export type MatchType = "M" | "N" | "D"; // Match, Near, Different

export interface Mask {
  playerName: MatchType;
  team: MatchType;
  country: MatchType;
  birthYear: MatchType;
  majorsPlayed: MatchType;
  role: MatchType;
}

export interface Guess {
  guessId: string;
  mask: Mask;
}

export interface GamerState {
  gamerId: string;
  gamerName: string;
  ready: boolean;
  joinedAt: Date;
  guessesLeft: number;
  guesses: Guess[];
}
```

```typescript
// src/models/Room.ts
export type RoomStatus =
  | "pending"
  | "waiting"
  | "ready"
  | "inProgress"
  | "ended";

export interface Room {
  roomId: string;
  hostGamerId: string;
  gamers: Map<string, GamerState>;
  status: RoomStatus;
  mysteryPlayer: MysteryPlayer | null;
  createdAt: Date;
  startedAt?: Date;
}
```

```typescript
// src/models/Session.ts
export interface Session {
  sessionId: string;
  gamerId: string;
  gamerName: string;
  roomId: string | null;
  response: ServerResponse;
  lastActive: Date;
}
```

### 2.3 Guess Comparison Algorithm

```typescript
// src/utils/comparison.ts
export function compareGuess(
  guessedPlayer: MysteryPlayer,
  answerPlayer: MysteryPlayer
): Mask {
  const currentYear = new Date().getFullYear();
  const guessedAge = currentYear - guessedPlayer.birthYear;
  const answerAge = currentYear - answerPlayer.birthYear;

  return {
    playerName:
      guessedPlayer.playerName === answerPlayer.playerName ? "M" : "D",
    team: guessedPlayer.team === answerPlayer.team ? "M" : "D",
    country:
      guessedPlayer.country === answerPlayer.country
        ? "M"
        : isCountryNear(guessedPlayer.country, answerPlayer.country)
          ? "N"
          : "D",
    birthYear:
      guessedPlayer.birthYear === answerPlayer.birthYear
        ? "M"
        : Math.abs(guessedPlayer.birthYear - answerPlayer.birthYear) <= 2
          ? "N"
          : "D",
    majorsPlayed:
      guessedPlayer.majorsPlayed === answerPlayer.majorsPlayed
        ? "M"
        : Math.abs(guessedPlayer.majorsPlayed - answerPlayer.majorsPlayed) <= 2
          ? "N"
          : "D",
    role: guessedPlayer.role === answerPlayer.role ? "M" : "D",
  };
}
```

### 2.4 API Routes

| Endpoint          | Method | Description            | Header Required |
| ----------------- | ------ | ---------------------- | --------------- |
| `/room/create`    | POST   | Create room            | -               |
| `/room/join`      | POST   | Join room              | -               |
| `/sse/:sessionId` | GET    | SSE connection         | -               |
| `/room/ready`     | POST   | Set ready status       | `X-Session-Id`  |
| `/room/start`     | POST   | Start game (host only) | `X-Session-Id`  |
| `/room/action`    | POST   | Submit guess           | `X-Session-Id`  |
| `/room/leave`     | POST   | Leave room             | `X-Session-Id`  |
| `/room/heartbeat` | POST   | Heartbeat keep-alive   | `X-Session-Id`  |

### 2.5 SSE Event Types

```typescript
export interface SSEEvent {
  event: string;
  data: unknown;
}

export type SSEEventType =
  | "connected"
  | "gamerJoined"
  | "gamerLeft"
  | "readyUpdate"
  | "allReady"
  | "gameStarted"
  | "guessResult"
  | "gameEnded"
  | "roomEnded";
```

### 2.6 package.json Dependencies

```json
{
  "name": "@guess-cspro/service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "check": "tsc --noEmit"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0",
    "zod": "^3.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.9.3"
  }
}
```

---

## 3. Core Implementation Details

### 3.1 RoomManager

```typescript
// src/managers/RoomManager.ts
export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private pendingSessions: Map<string, PendingSession> = new Map();
  private playerData: MysteryPlayer[];

  createRoom(gamerId: string, gamerName: string): CreateRoomResult {}
  getRoom(roomId: string): Room | null {}
  joinRoom(
    roomId: string,
    gamerId: string,
    gamerName: string
  ): JoinRoomResult {}
  confirmJoin(sessionId: string): void {}
  deleteRoom(roomId: string): void {}
  broadcastToRoom(roomId: string, event: string, data: unknown): void {}
}
```

### 3.2 SessionManager

```typescript
// src/managers/SessionManager.ts
export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  createSession(
    sessionId: string,
    gamerId: string,
    gamerName: string,
    roomId: string,
    res: ServerResponse
  ): void {}
  getSession(sessionId: string): Session | null {}
  removeSession(sessionId: string): void {}
  heartbeat(sessionId: string): void {}
  startCleanupTimer(): void {}
}
```

### 3.3 Validation Schemas

```typescript
// src/utils/validation.ts
import { z } from "zod";

export const createRoomSchema = z.object({
  gamerId: z.string().uuid(),
  gamerName: z.string().min(1).max(50),
});

export const joinRoomSchema = z.object({
  gamerId: z.string().uuid(),
  gamerName: z.string().min(1).max(50),
  roomId: z.string().uuid(),
});

export const readySchema = z.object({
  ready: z.boolean(),
});

export const guessSchema = z.object({
  guess: z.string().min(1),
});
```

---

## 4. API Endpoint Specifications

### 4.1 POST /room/create

**Request:**

```json
{
  "gamerId": "550e8400-e29b-41d4-a716-446655440000",
  "gamerName": "Player1"
}
```

**Response (200):**

```json
{
  "roomId": "660e8400-e29b-41d4-a716-446655440000",
  "sessionId": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Logic:**

1. Validate request with Zod schema
2. Generate roomId and sessionId (UUID)
3. Create room with status "pending"
4. Add to pendingSessions with 10s timeout
5. Return roomId and sessionId

### 4.2 POST /room/join

**Request:**

```json
{
  "gamerId": "880e8400-e29b-41d4-a716-446655440000",
  "gamerName": "Player2",
  "roomId": "660e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**

```json
{
  "sessionId": "990e8400-e29b-41d4-a716-446655440000"
}
```

**Response (400):**

```json
{
  "success": false,
  "message": "Room is full"
}
```

### 4.3 GET /sse/:sessionId

**Description:** Establish SSE connection

**Logic:**

1. Validate sessionId is valid UUID
2. If in pendingSessions, confirm join and create Session
3. Set SSE headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`)
4. Send "connected" event
5. Keep connection open
6. Handle connection close for cleanup

### 4.4 POST /room/ready

**Headers:** `X-Session-Id: 770e8400-e29b-41d4-a716-446655440000`

**Request:**

```json
{
  "ready": true
}
```

**Response (200):**

```json
{
  "success": true
}
```

**Logic:**

1. Validate sessionId header
2. Find session and room
3. Update gamer ready status
4. If all gamers ready, set room status to "ready" and broadcast "allReady"

### 4.5 POST /room/start

**Headers:** `X-Session-Id: 770e8400-e29b-41d4-a716-446655440000`

**Request:** `{}` (empty body)

**Response (200):**

```json
{
  "success": true
}
```

**Logic:**

1. Validate session is host
2. Check room status is "ready"
3. Generate random mystery player from playerData
4. Set room status to "inProgress"
5. Broadcast "gameStarted" event

### 4.6 POST /room/action

**Headers:** `X-Session-Id: 770e8400-e29b-41d4-a716-446655440000`

**Request:**

```json
{
  "guess": "s1mple"
}
```

**Response (200):**

```json
{
  "success": true
}
```

**Logic:**

1. Validate session and room status is "inProgress"
2. Find guessed player by name
3. Compare with mystery player to generate mask
4. Decrement guessesLeft
5. Add to gamer's guesses
6. Broadcast "guessResult" to all gamers
7. Check if correct guess or no guesses left
8. If game ended, broadcast "gameEnded" with winner and mystery player

### 4.7 POST /room/leave

**Headers:** `X-Session-Id: 770e8400-e29b-41d4-a716-446655440000`

**Request:** `{}` (empty body)

**Response (200):**

```json
{
  "success": true
}
```

**Logic:**

1. Remove gamer from room
2. Remove session
3. Broadcast "gamerLeft"
4. If host left, delete room
5. If room empty, delete room

### 4.8 POST /room/heartbeat

**Headers:** `X-Session-Id: 770e8400-e29b-41d4-a716-446655440000`

**Request:** `{}` (empty body)

**Response (200):**

```json
{
  "success": true
}
```

**Logic:** Update session's lastActive timestamp

---

## 5. SSE Event Specifications

### 5.1 connected

```json
{
  "event": "connected",
  "data": {
    "gamerId": "550e8400-e29b-41d4-a716-446655440000",
    "gamerName": "Player1"
  }
}
```

### 5.2 gamerJoined

```json
{
  "event": "gamerJoined",
  "data": {
    "gamerId": "880e8400-e29b-41d4-a716-446655440000",
    "gamerName": "Player2"
  }
}
```

### 5.3 gamerLeft

```json
{
  "event": "gamerLeft",
  "data": {
    "gamerId": "880e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 5.4 readyUpdate

```json
{
  "event": "readyUpdate",
  "data": {
    "gamerId": "550e8400-e29b-41d4-a716-446655440000",
    "ready": true
  }
}
```

### 5.5 allReady

```json
{
  "event": "allReady",
  "data": {}
}
```

### 5.6 gameStarted

```json
{
  "event": "gameStarted",
  "data": {
    "status": "inProgress"
  }
}
```

### 5.7 guessResult

```json
{
  "event": "guessResult",
  "data": {
    "gamerId": "550e8400-e29b-41d4-a716-446655440000",
    "guessId": "s1mple",
    "mask": {
      "playerName": "M",
      "team": "D",
      "country": "N",
      "birthYear": "N",
      "majorsPlayed": "D",
      "role": "M"
    },
    "guessesLeft": 7
  }
}
```

### 5.8 gameEnded

```json
{
  "event": "gameEnded",
  "data": {
    "status": "ended",
    "winner": "550e8400-e29b-41d4-a716-446655440000",
    "mysteryPlayer": {
      "id": "s1mple",
      "playerName": "s1mple",
      "team": "NaVi",
      "country": "Ukraine",
      "birthYear": 1997,
      "majorsPlayed": 20,
      "role": "AWPer"
    }
  }
}
```

### 5.9 roomEnded

```json
{
  "event": "roomEnded",
  "data": {}
}
```

---

## 6. Constants

```typescript
// src/constants.ts
export const MAX_GAMERS_PER_ROOM = 3;
export const MAX_TOTAL_SESSIONS = 100;
export const GUESSES_PER_GAMER = 8;
export const PENDING_TIMEOUT_MS = 10_000;
export const HEARTBEAT_INTERVAL_MS = 30_000;
export const SESSION_INACTIVE_TIMEOUT_MS = 5 * 60_000;
export const BIRTH_YEAR_NEAR_THRESHOLD = 2;
export const MAJORS_NEAR_THRESHOLD = 2;
```

---

## 7. Error Handling

### 7.1 Error Codes

| Status | Error Type        | Description                        |
| ------ | ----------------- | ---------------------------------- |
| 400    | Bad Request       | Invalid request body or parameters |
| 401    | Unauthorized      | Invalid or expired sessionId       |
| 404    | Not Found         | Room not found or inactive         |
| 409    | Conflict          | Room full or gamer already in room |
| 429    | Too Many Requests | Rate limit exceeded                |
| 500    | Internal Error    | Server error                       |

### 7.2 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room does not exist or has ended"
  }
}
```

---

## 8. Security Considerations

### 8.1 Session Management

- sessionId generated server-side using UUID v4
- Validate sessionId on every request
- Timeout inactive sessions after 5 minutes
- No reconnection mechanism (security feature)

### 8.2 Rate Limiting

- Limit POST requests per session
- Prevent rapid room creation
- Pending session timeout prevents memory abuse

### 8.3 Input Validation

- All request bodies validated with Zod schemas
- Path parameters validated (sessionId, roomId)
- SQL injection not applicable (no database)

---

## 9. Player Data Management

### 9.1 Data Loading

```typescript
// service/src/models/PlayerData.ts
import PLAYERS from "../data/all_players_data.json";

export interface ServerPlayerData {
  [key: string]: {
    team: string;
    country: string;
    birth_year: number;
    majorsPlayed: number;
    role: string;
  };
}

export function getMysteryPlayers(): MysteryPlayer[] {
  return Object.entries(PLAYERS as ServerPlayerData).map(([key, data]) => ({
    id: key,
    playerName: key,
    team: data.team || "Unknown",
    country: data.country || "Unknown",
    birthYear: data.birth_year || 2000,
    majorsPlayed: data.majorsPlayed || 0,
    role: (data.role || "Unknown") as "AWPer" | "Rifler" | "Unknown",
  }));
}
```

### 9.2 Mode Filtering (Optional)

Support filtering players by game mode (all/normal/ylg) if needed.

---

## 10. Deployment

### 10.1 Environment Variables

```bash
# .env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

### 10.2 Production Build

```bash
# Build TypeScript
pnpm --filter @guess-cspro/service build

# Run with PM2 (recommended)
pm2 start dist/index.js --name guess-cspro-service
```

### 10.3 CORS Configuration

```typescript
app.use(async (c, next) => {
  c.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, X-Session-Id");
  await next();
});
```

---

_End of Backend Design Document_
