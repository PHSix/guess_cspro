# Shared - Common Code for Frontend and Backend

Shared workspace containing common types, utilities, and game logic used by both the frontend (`app`) and backend (`service`).

## Overview

This package eliminates code duplication between the frontend and backend by providing:
- Core game logic (player comparison, search, filtering)
- TypeScript type definitions
- API request/response types
- SSE event data schemas with Zod validation
- Utility functions (country to region mapping)
- Shared constants

## Tech Stack

- **TypeScript**: 5.9.3
- **Validation**: Zod 3.x
- **Package Manager**: pnpm workspace

## Exports

### Game Logic (`gameEngine.ts`)

Core game functions used by both frontend and backend:

```typescript
// Compare guess vs answer, return match mask
compareGuess(guessedPlayer: Player, answerPlayer: Player): Mask

// Search players by name (fuzzy search)
searchPlayers(players: Player[], query: string, limit?: number): Player[]

// Get random player from list
getRandomPlayer(players: Player[]): Player

// Find player by proId
findPlayerByName(players: Player[], name: string): Player | undefined

// Calculate age from birth year
calculateAge(birthYear: number): number

// Get country region (Europe/CIS/Americas/APAC)
getCountryRegion(country: string): Region
```

### Match Types

The comparison result mask uses these match types:

| Type | Symbol | Description |
|------|--------|-------------|
| `Exact` | M | Perfect match |
| `Near` | N | Close match (same region for country, ±2 years for age, ±3 for majors) |
| `Different` | D | Different value |
| `Greater` | G | Value is higher (age/majors) |
| `Less` | L | Value is lower (age/majors) |

### API Types (`api.ts`)

Request and response types for the online multiplayer API:

```typescript
// Requests
CreateRoomRequest, JoinRoomRequest, ReadyRequest, GuessRequest, EmptyRequest

// Responses
CreateRoomResponse, JoinRoomResponse, SuccessResponse, ErrorResponse, ApiResponse

// Common Types
RoomStatus, Difficulty, MysteryPlayer, ServerGamerInfo, GamerInfo
```

### SSE Event Types (`sse.ts`)

Event data interfaces and Zod validation schemas:

```typescript
// Event Data Interfaces
ConnectedEventData, RoomStateEventData, HeartbeatEventData,
GamerJoinedEventData, GamerLeftEventData, ReadyUpdateEventData,
AllReadyEventData, GameStartedEventData, GuessResultEventData,
GameEndedEventData, RoomEndedEventData

// Type Unions
SSEEventDataSet, SSEEventName, SSEEvent<T>

// Zod Validation Schemas
SSEEventSchemas, ConnectedEventSchema, RoomStateEventSchema, ...
```

### Constants (`const.ts`)

```typescript
// SSE Event Types (enum)
EsCustomEvent: CONNECTED, ROOM_STATE, HEARTBEAT, GAMER_JOINED, ...

// Shared Constants
COOKIE_NAME, ONE_YEAR_MS, AXIOS_TIMEOUT_MS, etc.
```

### Country Utils (`countryUtils.ts`)

```typescript
// Country to region mapping
COUNTRY_REGIONS: Record<string, Region>

// Get region for a country
getCountryRegion(country: string): Region
```

## Project Structure

```
shared/
├── gameEngine.ts       # Core game logic (compareGuess, searchPlayers, etc.)
├── api.ts             # API request/response types
├── sse.ts             # SSE event types with Zod schemas
├── const.ts           # Shared constants (SSE events, etc.)
├── countryUtils.ts    # Country to region mapping
├── types.ts           # Legacy type definitions (will be migrated)
├── _core/
│   └── errors.ts      # Core error types
├── data/
│   ├── all_players_data.json      # All player data
│   └── mode_player_list.json      # Difficulty mode lists
├── index.ts           # Main export entry point
├── package.json
└── README.md
```

## Usage

### In Frontend (app/)

```typescript
import { compareGuess, searchPlayers, GuessResultEventData } from "@shared";

// Use shared game logic
const mask = compareGuess(guess, answer);
const results = searchPlayers(allPlayers, "s1mple");

// Use shared types
const handleEvent = (data: GuessResultEventData) => {
  console.log(data.mask, data.guessesLeft);
};
```

### In Backend (service/)

```typescript
import { compareGuess, getRandomPlayer, SSEEventDataSet } from "@guess-cspro/shared";

// Use shared game logic
const mask = compareGuess(guessedPlayer, mysteryPlayer);

// Type-safe broadcasting
broadcastToRoom<keyof SSEEventDataSet>(
  roomId,
  "guessResult",
  { gamerId, guessId, mask, guessesLeft }
);
```

## Type-Safe Broadcasting

The shared SSE types enable compile-time type checking for broadcasts:

```typescript
// ✅ Type-safe - data structure validated at compile time
broadcastToRoom(roomId, "gameStarted", { status: "inProgress" });

// ❌ Compile error - missing required fields
broadcastToRoom(roomId, "gameStarted", {});
```

## Zod Validation

Frontend can validate incoming SSE events:

```typescript
import { SSEEventSchemas } from "@shared/sse";

const schema = SSEEventSchemas[eventName];
const result = schema.safeParse(rawData);
if (!result.success) {
  console.error("Invalid event data:", result.error);
}
```

## Development

```bash
# Type check
pnpm check

# This workspace has no build step - it's consumed as source
```

## Data Files

### `all_players_data.json`

Complete player database with all attributes:

```json
[
  {
    "id": "1",
    "proId": "s1mple",
    "team": "NAVI",
    "country": "Ukraine",
    "birthYear": 1997,
    "majorsPlayed": 20,
    "role": "AWPer",
    "lowerProId": "s1mple",
    "filterProId": "s1mple"
  },
  ...
]
```

### `mode_player_list.json`

Difficulty mode configuration:

```json
{
  "ylg": [],
  "normal": ["s1mple", "ZywOo", "m0NESY", ...]
}
```

## Dependencies

None! This package only has TypeScript and Zod as dev dependencies.

## Related

- **Frontend**: [../app/README.md](../app/README.md)
- **Backend**: [../service/README.md](../service/README.md)
- **Root**: [../README.md](../README.md)
