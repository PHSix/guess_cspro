# Service - Online Multiplayer Backend

Backend server for the online multiplayer mode, built with Node.js + Hono.js.

## Overview

This service handles real-time game room management, player sessions, and SSE (Server-Sent Events) broadcasting for the CS:GO/CS2 professional player guessing game.

## Features

- **Room Management**: Create, join, and manage game rooms (up to 3 players)
- **Session Management**: SSE connection lifecycle with automatic cleanup
- **Real-time Broadcasting**: SSE-based event streaming for all room events
- **Type-safe API**: Zod validation for all incoming requests
- **In-memory State**: No database required, all state in RAM

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Hono.js + @hono/node-server
- **Validation**: Zod
- **Type Safety**: TypeScript 5.9.3
- **UUID**: uuid v4 for session and room IDs

## Development

```bash
# Install dependencies
pnpm install

# Start development server (port 3001)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type check
pnpm check
```

## API Endpoints

All endpoints are prefixed with `/api/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/room/create` | Create new room |
| POST | `/room/join` | Join existing room |
| GET | `/sse/:sessionId` | SSE connection stream |
| POST | `/room/ready` | Toggle ready status |
| POST | `/room/start` | Start game (host only) |
| POST | `/room/action` | Submit guess |
| POST | `/room/leave` | Leave room |
| POST | `/room/heartbeat` | Manual heartbeat ping |
| GET | `/alive` | Health check |

## SSE Events

The server broadcasts these events via SSE:

- `connected` - SSE connection established
- `roomState` - Full room state snapshot
- `heartbeat` - Keep-alive (30s interval)
- `gamerJoined` - New player joined
- `gamerLeft` - Player left
- `readyUpdate` - Ready status changed
- `allReady` - All players ready
- `gameStarted` - Game started
- `guessResult` - Guess processed
- `gameEnded` - Game ended
- `roomEnded` - Room closed

## Project Structure

```
service/
├── src/
│   ├── managers/
│   │   ├── RoomManager.ts      # Game room management
│   │   └── SessionManager.ts    # SSE session management
│   ├── models/
│   │   ├── Room.ts              # Room data model
│   │   ├── Session.ts           # Session data model
│   │   ├── PlayerData.ts        # Player data models
│   │   └── playerDataLoader.ts  # Load player data from JSON
│   ├── routes/
│   │   └── index.ts             # API route handlers
│   ├── utils/
│   │   ├── validation.ts        # Zod validation schemas
│   │   └── logger.ts            # Custom logger
│   ├── data/
│   │   ├── all_players_data.json         # All player data
│   │   └── mode_player_list.json         # Difficulty mode lists
│   ├── constants.ts            # Server constants
│   └── index.ts                # Server entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

### RoomManager

Manages all game rooms and game flow:

- `createRoom()` - Create new room with pending timeout
- `joinRoom()` - Join existing room
- `confirmJoin()` - Confirm SSE connection and add gamer to room
- `setReady()` - Update player ready status
- `startGame()` - Start game, generate mystery player
- `processGuess()` - Process guess using `compareGuess()` from shared
- `removeGamer()` - Remove player, delete room if empty/host left
- `broadcastToRoom()` - Strongly typed SSE broadcasting

### SessionManager

Manages SSE connections:

- `createSession()` - Create SSE session with 100 max limit
- `getSession()` - Get active session
- `removeSession()` - Remove and cleanup session
- `heartbeat()` - Update last active timestamp
- Auto-cleanup: Sessions inactive for 5+ minutes are deleted

### Shared Dependencies

The service imports shared code from `@guess-cspro/shared`:

- `compareGuess()` - Core game logic for comparing guesses
- `Player`, `Mask`, `Difficulty` - Shared types
- `SSEEventDataSet`, `SSEEventName` - SSE event types

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |

### Constants

```typescript
MAX_GAMERS_PER_ROOM = 3      // Max players per room
MAX_TOTAL_SESSIONS = 100      // Max concurrent SSE connections
GUESSES_PER_GAMER = 8         // Guesses per player
PENDING_TIMEOUT_MS = 60000    // Pending session timeout (60s)
HEARTBEAT_INTERVAL_MS = 30000 // SSE heartbeat interval (30s)
SESSION_INACTIVE_TIMEOUT_MS = 300000 // Session cleanup (5min)
```

## Request Validation

All API requests are validated using Zod schemas:

```typescript
// Example: Create room request
{
  gamerId: string,    // UUID v4
  gamerName: string,  // 1-50 chars
  difficulty?: "all" | "normal" | "ylg"  // Default: "all"
}
```

## Error Handling

- `400` - Invalid request (Zod validation failed)
- `401` - Invalid/expired sessionId
- `404` - Room not found
- `500` - Internal server error

## Deployment

### Manual Deployment

```bash
# Build
pnpm build

# Start production server
PORT=3001 node dist/index.js
```

### Process Manager (pm2)

```bash
# Install pm2 globally
npm install -g pm2

# Start service
pm2 start dist/index.js --name guess-cspro-service

# View logs
pm2 logs guess-cspro-service

# Restart
pm2 restart guess-cspro-service
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

## Known Limitations

1. **In-memory only**: All state lost on server restart
2. **No reconnection**: SSE disconnects require page refresh
3. **Single server**: No horizontal scaling support
4. **Kick player**: UI exists but not fully implemented

## Testing

```bash
# Health check
curl http://localhost:3001/api/alive

# Create room
curl -X POST http://localhost:3001/api/room/create \
  -H "Content-Type: application/json" \
  -d '{"gamerId":"uuid","gamerName":"Player1","difficulty":"all"}'
```

## See Also

- **Root README**: [../README.md](../README.md)
- **Frontend App**: [../app/README.md](../app/README.md)
- **Shared Code**: [../shared/README.md](../shared/README.md)
- **CLAUDE.md**: [../CLAUDE.md](../CLAUDE.md) - Developer documentation
