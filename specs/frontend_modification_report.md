# Frontend Modification Report for Multiplayer Feature

## 1. Overview

This document outlines the frontend changes required to integrate the multiplayer room feature into the existing "弗一把" application. All changes are additive - no existing single-player functionality will be modified.

### 1.1 Design Principles

- **Non-invasive**: All multiplayer code is in new files/routes
- **Code reuse**: Leverage existing components, utilities, and stores
- **Consistent styling**: Follow cyberpunk/neon theme
- **Type safety**: Use shared types from `@shared/types/multiplayer`

---

## 2. New Page Structure

### 2.1 New Routes

```
/app/src/pages/
├── MultiplayerHomePage.tsx      # Multiplayer home page (create/join room)
├── MultiplayerRoomPage.tsx     # Room waiting page
└── MultiplayerGamePage.tsx      # Multiplayer game page
```

### 2.2 Route Additions in App.tsx

```tsx
// app/src/App.tsx (modification)
// Add new routes alongside existing routes:
<Route path={"/multiplayer"} component={MultiplayerHomePage} />
<Route path={"/multiplayer/room"} component={MultiplayerRoomPage} />
<Route path={"/multiplayer/game"} component={MultiplayerGamePage} />
```

---

## 3. New Components

### 3.1 Component Structure

```
/app/src/components/
├── multiplayer/
│   ├── CreateRoomDialog.tsx     # Create room modal
│   ├── JoinRoomDialog.tsx       # Join room modal
│   ├── RoomPlayerList.tsx       # Room player list
│   ├── MultiplayerGuessHistory.tsx # Multiplayer guess history
│   └── SSEConnectionProvider.tsx # SSE connection context provider
└── hooks/
    ├── useMultiplayerGame.ts    # Multiplayer game logic hook
    └── useSSEConnection.ts      # SSE connection hook
```

### 3.2 Custom Hooks

#### useSSEConnection.ts

```typescript
// app/src/hooks/useSSEConnection.ts
interface SSEConnectionReturn {
  connected: boolean;
  error: string | null;
  sendAction: (endpoint: string, data: unknown) => Promise<Response>;
  eventSource: EventSource | null;
}

export function useSSEConnection(sessionId: string): SSEConnectionReturn;
```

**Features:**

- Establish SSE connection to backend
- Handle connection errors and reconnection logic
- Provide `sendAction` function for POST requests with session header
- Auto-connect on mount, disconnect on unmount

#### useMultiplayerGame.ts

```typescript
// app/src/hooks/useMultiplayerGame.ts
interface UseMultiplayerGameReturn {
  // Room state
  gamers: GamerState[];
  roomStatus: RoomStatus;
  isHost: boolean;

  // Game state
  guesses: Map<string, Guess[]>;
  winner: string | null;

  // Actions
  setReady: (ready: boolean) => Promise<void>;
  startGame: () => Promise<void>;
  submitGuess: (playerName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
}

export function useMultiplayerGame(sessionId: string): UseMultiplayerGameReturn;
```

---

## 4. New Store (Zustand)

### 4.1 Multiplayer Store

```typescript
// app/src/store/useMultiplayerStore.ts
interface MultiplayerState {
  // Session information
  gamerId: string | null;
  gamerName: string | null;
  sessionId: string | null;
  roomId: string | null;
  isHost: boolean;

  // Room state
  gamers: GamerState[];
  roomStatus: RoomStatus;
  mysteryPlayer: MysteryPlayer | null;

  // Game state
  guesses: Map<string, Guess[]>; // gamerId -> guesses
  winner: string | null;

  // Action methods
  setGamerInfo: (gamerId: string, gamerName: string) => void;
  setSessionInfo: (sessionId: string, roomId: string, isHost: boolean) => void;
  updateGamerList: (gamers: GamerState[]) => void;
  updateRoomStatus: (status: RoomStatus) => void;
  setMysteryPlayer: (player: MysteryPlayer) => void;
  addGuess: (gamerId: string, guess: Guess) => void;
  setWinner: (winner: string | null) => void;
  reset: () => void;
}

export const useMultiplayerStore = create<MultiplayerState>(...);
```

---

## 5. Shared Types Extension

### 5.1 New File in shared Package

```
/shared/types/multiplayer.ts
```

```typescript
// shared/types/multiplayer.ts
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
  playerName: string;
  team: string;
  country: string;
  age: number;
  majorMaps: number;
  role: string;
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

export type RoomStatus =
  | "pending"
  | "waiting"
  | "ready"
  | "inProgress"
  | "ended";

export interface SSEEventData {
  connected: { gamerId: string; gamerName: string };
  gamerJoined: { gamerId: string; gamerName: string };
  gamerLeft: { gamerId: string };
  readyUpdate: { gamerId: string; ready: boolean };
  allReady: {};
  gameStarted: { status: "inProgress" };
  guessResult: {
    gamerId: string;
    guessId: string;
    mask: Mask;
    guessesLeft: number;
  };
  gameEnded: {
    status: "ended";
    winner?: string;
    mysteryPlayer: MysteryPlayer;
  };
  roomEnded: {};
}
```

### 5.2 Update shared/index.ts

```typescript
// shared/index.ts (modification)
export * from "./types/multiplayer"; // Add this line
```

---

## 6. HomePage Modification

### 6.1 Add Multiplayer Entry Point

```tsx
// app/src/pages/HomePage.tsx (modification)
// Add new button below existing START GAME button:

<Button
  onClick={() => setLocation("/multiplayer")}
  variant="outline"
  className="w-full neon-border"
  size="lg"
>
  👥 Multiplayer
</Button>
```

**No existing buttons or functionality will be modified.**

---

## 7. SSE Client Implementation

### 7.1 SSE Connection Hook Details

```typescript
// app/src/hooks/useSSEConnection.ts
import { useEffect, useRef, useState, useCallback } from "react";

export function useSSEConnection(sessionId: string) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Create SSE connection
    const eventSource = new EventSource(
      `http://localhost:3001/sse/${sessionId}`
    );

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => {
      setError("Connection lost");
      setConnected(false);
    };

    // Handle different event types
    eventSource.addEventListener("connected", handleConnected);
    eventSource.addEventListener("gamerJoined", handleGamerJoined);
    eventSource.addEventListener("guessResult", handleGuessResult);
    // ... other event handlers

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  const sendAction = useCallback(
    async (endpoint: string, data: unknown) => {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": sessionId,
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    [sessionId]
  );

  // Send heartbeat every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      sendAction("/room/heartbeat", {});
    }, 30000);
    return () => clearInterval(interval);
  }, [sendAction]);

  return { connected, error, sendAction, eventSource: eventSourceRef.current };
}
```

---

## 8. Reusable Components

### 8.1 Leverage Existing Components

The multiplayer UI will reuse existing components from `@/components/ui/`:

- **Card** - Room container, game board
- **Button** - Action buttons (ready, start, leave)
- **Input** - Room ID input, player search
- **Badge** - Player status indicators
- **Avatar** - Player avatars (if available)
- **Dialog** - Create/join room modals
- **Sonner** - Toast notifications

### 8.2 Search Logic Reuse

```typescript
// Reuse existing search function from gameEngine.ts
import { searchPlayers } from "@/lib/gameEngine";

// In multiplayer, use same search for guess input
const handleSearch = (query: string) => {
  const results = searchPlayers(query);
  setSearchResults(results);
};
```

---

## 9. Player Data Integration

### 9.1 Data Synchronization Strategy

The backend `service` package needs access to same player data as frontend.

**Recommended Approach**: Copy `all_players_data.json` to service package

```bash
# Add script to root package.json
"scripts": {
  "sync-player-data": "cp app/public/all_players_data.json service/src/data/all_players_data.json"
}
```

**Build Flow:**

1. `pnpm sync-player-data` - Copy player data before build
2. `pnpm --filter @guess-cspro/service build` - Build service
3. `pnpm --filter @guess-cspro/app build` - Build app

### 9.2 Service Player Data Loader

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

---

## 10. Monorepo Configuration

### 10.1 Update pnpm-workspace.yaml

```yaml
# pnpm-workspace.yaml (modification)
packages:
  - "app"
  - "hltv_data_scraper"
  - "shared"
  - "service" # Add this line
```

### 10.2 Update root package.json

```json
{
  "scripts": {
    "sync-player-data": "cp app/public/all_players_data.json service/src/data/all_players_data.json",
    "dev": "pnpm --filter @guess-cspro/app dev",
    "dev:service": "pnpm --filter @guess-cspro/service dev",
    "dev:all": "pnpm run --parallel dev dev:service",
    "build": "pnpm sync-player-data && pnpm -r build",
    "check": "pnpm -r check",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  }
}
```

---

## 11. Page Flow Diagram

### 11.1 User Journey

```
HomePage (/)
  ├─ Click "Multiplayer" button
  ↓
MultiplayerHomePage (/multiplayer)
  ├─ Create Room ──────┐
  │   ├─ Input name    │
  │   └─ Get roomId    │
  │                    │
  └─ Join Room ───────┤
      ├─ Input roomId   │
      └─ Input name    │
                     ↓
           Connect SSE
                     ↓
       MultiplayerRoomPage (/multiplayer/room)
       ├─ Show player list
       ├─ Wait for ready
       └─ Host starts game
                     ↓
       MultiplayerGamePage (/multiplayer/game)
       ├─ Search & guess players
       ├─ View others' guesses
       ├─ Get real-time updates
       └─ Game ends when winner
                     ↓
            Show results
                     ↓
        Return to HomePage
```

---

## 12. Environment Configuration

### 12.1 Backend URL Configuration

```typescript
// app/src/config/api.ts (new file)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
```

### 12.2 Environment Variables

```bash
# .env.local (app)
VITE_API_BASE_URL=http://localhost:3001

# .env (service)
PORT=3001
NODE_ENV=development
```

---

## 13. Error Handling

### 13.1 Client-Side Error Scenarios

| Scenario                        | Handling                            |
| ------------------------------- | ----------------------------------- |
| SSE connection failed           | Show error toast, allow reconnect   |
| Invalid roomId                  | Show error, return to home          |
| Room full (3/3)                 | Show "Room is full" message         |
| Player left unexpectedly        | Show notification, remove from list |
| Guess submitted when game ended | Ignore, show message                |
| Network timeout                 | Show loading, retry                 |

### 13.2 UI Feedback

Use existing `sonner` toast notifications for all user-facing errors:

```typescript
import { toast } from "sonner";

// Example usage
toast.error("Failed to join room: Room is full");
toast.success("You won the game! 🎉");
```

---

## 14. Development Commands

```bash
# Install all dependencies
pnpm install

# Sync player data (required before service build)
pnpm sync-player-data

# Start frontend development server
pnpm dev

# Start backend service
pnpm dev:service

# Start both in parallel
pnpm dev:all

# Type check all packages
pnpm check

# Build all packages
pnpm build

# Format code
pnpm format
```

---

## 15. Summary

### 15.1 What's Added

| Category     | Files/Components                                                            |
| ------------ | --------------------------------------------------------------------------- |
| Pages        | 3 new pages (MultiplayerHomePage, MultiplayerRoomPage, MultiplayerGamePage) |
| Components   | 5+ new components in `/multiplayer` folder                                  |
| Hooks        | 2 new hooks (useSSEConnection, useMultiplayerGame)                          |
| Store        | 1 new Zustand store (useMultiplayerStore)                                   |
| Routes       | 3 new routes in App.tsx                                                     |
| Shared Types | 1 new file in shared package                                                |

### 15.2 What's NOT Modified

- All existing pages (HomePage, GamePage, FinishedPage, SettingsPage)
- Existing stores (usePlayerStore, useSettingsStore)
- Existing game logic (gameEngine.ts)
- Existing UI components (no changes)
- Single-player game flow

### 15.3 Integration Points

1. **HomePage**: Add "Multiplayer" button
2. **App.tsx**: Add 3 new routes
3. **shared/index.ts**: Export multiplayer types
4. **pnpm-workspace.yaml**: Add 'service' package
5. **root package.json**: Add sync and dev scripts

---

## 16. Open Questions

1. **Player Data Sync**: Confirm if copying `all_players_data.json` is acceptable, or should service fetch it via API?
2. **Environment Variables**: Should backend port/CORS be configurable via env vars?
3. **Deployment**: Should backend be deployed separately or bundled with frontend?
4. **CORS Configuration**: What domains should be allowed for production deployment?

---

## Appendix: File Tree Overview

```
guess_cspro/
├── app/                            (modified)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx         (add Multiplayer button)
│   │   │   ├── MultiplayerHomePage.tsx       (new)
│   │   │   ├── MultiplayerRoomPage.tsx      (new)
│   │   │   └── MultiplayerGamePage.tsx      (new)
│   │   ├── components/
│   │   │   ├── multiplayer/         (new folder)
│   │   │   │   ├── CreateRoomDialog.tsx
│   │   │   │   ├── JoinRoomDialog.tsx
│   │   │   │   ├── RoomPlayerList.tsx
│   │   │   │   ├── MultiplayerGuessHistory.tsx
│   │   │   │   └── SSEConnectionProvider.tsx
│   │   │   └── hooks/             (new folder)
│   │   │       ├── useMultiplayerGame.ts
│   │   │       └── useSSEConnection.ts
│   │   ├── store/
│   │   │   └── useMultiplayerStore.ts         (new)
│   │   ├── config/
│   │   │   └── api.ts                      (new)
│   │   └── App.tsx                (add 3 routes)
│   └── public/
│       └── all_players_data.json
├── service/                        (new package)
│   ├── src/
│   │   ├── data/
│   │   │   └── all_players_data.json
│   │   ├── models/
│   │   ├── managers/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── index.ts
│   └── package.json
├── shared/                         (modified)
│   └── types/
│       └── multiplayer.ts          (new)
├── pnpm-workspace.yaml             (add 'service')
└── package.json                    (add scripts)
```

---

_End of Frontend Modification Report_
