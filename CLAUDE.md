# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CS:GO/CS2 professional player guessing game built with React and TypeScript. The game randomly selects a player and players must guess the player by comparing attributes (team, country, age, major tournament participation, and role) with feedback indicators showing how close their guesses are.

**Features:**
- Single-player mode with multiple difficulty levels (all, normal, ylg)
- **Online multiplayer mode** (up to 3 players per room, real-time via SSE)
- Offline PWA support for single-player mode

## Tech Stack

- **Frontend**: React 19.2.1 + TypeScript + Vite 7.1.7
- **Backend**: Node.js + Hono.js + @hono/node-server (for online multiplayer)
- **Routing**: Wouter (lightweight alternative to React Router)
- **Styling**: Tailwind CSS 4.1.14 with custom cyberpunk/neon theme
- **UI Components**: Radix UI primitives
- **State Management**: Zustand (global state) + localStorage for settings persistence
- **Real-time Communication**: Server-Sent Events (SSE) for multiplayer
- **Validation**: Zod for API input validation
- **PWA**: VitePWA plugin for offline support
- **Package Manager**: pnpm (monorepo with workspaces)

## Architecture

### Monorepo Structure

This project is organized as a pnpm monorepo with the following workspaces:

- **`app/`** - Main React application (frontend)
  - **`src/`** - Source code
    - **`components/`** - Reusable UI components (ErrorBoundary, Confetti, GameResult, GuessHistory, PlayerSearchInput, plus shadcn/ui components in `ui/` subdirectory)
    - **`pages/`** - Route pages (HomePage, GamePage, FinishedPage, SettingsPage, **OnlineHomePage**, **OnlineRoomPage**, NotFound)
    - **`lib/`** - Core game logic (`gameEngine.ts`), utilities (`utils.ts`)
    - **`store/`** - Zustand global state stores (`usePlayerStore.ts`, `useSettingsStore.ts`, **`useOnlineStore.ts`**)
    - **`contexts/`** - React contexts (ThemeContext)
    - **`hooks/`** - Custom hooks (e.g., `useMobile`, **`useSSEConnection`**)
    - **`config/`** - Configuration files (**`api.ts`** for API base URL)
    - **`types/`** - TypeScript type definitions (shared with backend)
  - **`public/`** - Static data files (JSON player data)
  - `package.json` - App dependencies and scripts
  - `vite.config.ts` - Vite configuration with API proxy to backend
  - `tsconfig.json` - TypeScript configuration

- **`service/`** - Online multiplayer backend (Node.js + Hono)
  - **`src/`** - Server source code
    - **`managers/`** - Room and session management (**`RoomManager.ts`**, **`SessionManager.ts`**)
    - **`models/`** - Data models (Room, Session, Player, **`playerDataLoader.ts`**)
    - **`routes/`** - API routes (`index.ts` with all endpoints)
    - **`utils/`** - Utilities (comparison, validation, logger)
    - **`data/`** - Player data JSON files (copied from shared)
    - **`constants.ts`** - Server constants
    - **`index.ts`** - Server entry point
  - `package.json` - Service dependencies
  - `tsconfig.json` - TypeScript configuration

- **`shared/`** - Shared code between frontend and backend
  - **`gameEngine.ts`** - Core game logic (compareGuess, searchPlayers, etc.) - **shared by both app and service**
  - **`types.ts`** - Shared TypeScript types
  - **`countryUtils.ts`** - Country to region mapping
  - **`const.ts`** - Shared constants (including SSE event types)
  - **`data/`** - Shared player data files
  - `index.ts` - Main entry point
  - `package.json` - Shared package configuration

- **`hltv_data_scraper/`** - Node.js scraper for fetching player data from HLTV
  - **`src/`** - TypeScript scraper code
  - **`out/`** - Output JSON files
  - Uses Puppeteer for web scraping
  - `package.json` - Scraper dependencies and scripts

- **`dist/`** - Build output directory (from app)

- **`pnpm-workspace.yaml`** - pnpm workspace configuration

- **`tsconfig.base.json`** - Base TypeScript configuration shared across workspaces

### Core Game Flow

#### Single-Player Mode

1. **App Initialization** - Data loaded on app start with loading screen
2. **HomePage** (`/`) - Landing page with START GAME button
3. **GamePage** (`/game`) - Main gameplay interface
   - Displays answer player attributes to guess
   - Searchable dropdown to select player guesses
   - Comparison table showing guess results with match indicators
   - Mobile-optimized layout with horizontal scrolling
4. **FinishedPage** (`/finished`) - Game completion (win/loss)
5. **SettingsPage** (`/settings`) - Game configuration

#### Online Multiplayer Mode

1. **SettingsPage** (`/settings`) - Set username (required for online play)
2. **OnlineHomePage** (`/online`) - Create or join a room
   - Select difficulty (for room creation)
   - Enter room ID (for joining)
   - Create/join buttons
3. **OnlineRoomPage** (`/room`) - Room and game interface
   - Room waiting: Show connected gamers, ready status
   - Host: Can start game anytime
   - Non-host: Ready button to indicate readiness
   - Game in progress: PlayerSearchInput for guesses, GuessHistory for results
   - Game ended: Display winner and mystery player

**Multiplayer Technical Details:**
- Communication via SSE (Server-Sent Events) for real-time updates
- POST requests with X-Session-Id header for actions
- Server uses in-memory state (no database)
- Up to 3 players per room, 8 guesses per player
- 60-second timeout for pending sessions, 5-minute inactivity timeout

### Data Management Architecture

#### Global State (Zustand)

**usePlayerStore** (`app/src/store/usePlayerStore.ts`)

- Manages all player data and mode configuration
- Loads data on app initialization: `/all_players_data.json` and `/mode_player_list.json`
- Provides filtered player lists based on difficulty mode
- Caches data for performance
- Handles loading and error states

**useSettingsStore** (`app/src/store/useSettingsStore.ts`)

- Manages game settings (difficulty, total guesses, **username**)
- Auto-syncs to localStorage
- Initializes from localStorage on app start
- Provides setter methods that automatically persist changes

**useOnlineStore** (`app/src/store/useOnlineStore.ts`) - **NEW for multiplayer**

- Manages online multiplayer state
- Stores: gamerId (localStorage), gamerName, sessionId, roomId, isHost
- Tracks: gamers list, roomStatus, guesses (Map by gamerId), winner, mysteryPlayer
- Connection state: isSSEConnected, sseError
- Methods: initializeGamerId(), setGamerInfo(), setSessionInfo(), updateGamerList(), addGuess(), etc.

#### Game Modes

The game supports three difficulty modes:

- **ALL mode**: All players (hardest)
- **Normal mode**: Curated selection of players
- **YLG mode**: Coming soon (easiest)

Mode configuration is managed via `mode_player_list.json` which contains player name arrays for each mode.

**Data Files:**

- `all_players_data.json` - Complete player database
- `mode_player_list.json` - Mode-specific player lists (ylg: [], normal: [player names])

Settings stored in localStorage:

- `game-difficulty` - Current difficulty mode
- `game-total-guesses` - Number of allowed guesses (1-20, default 8)

### Key Components

#### `gameEngine.ts` (shared/gameEngine.ts) - **SHARED between frontend and backend**

Core game logic including:

- `compareGuess(guessedPlayer, answerPlayer)` - Compare and return MatchType mask (M/N/D/G/L)
- `searchPlayers(players, query, limit)` - Fuzzy search players by name
- `getRandomPlayer(players)` - Select random player from list
- `findPlayerByName(players, name)` - Find player by proId
- `getCountryRegion(country)` - Get region (Europe/CIS/Americas/APAC) for country
- `calculateAge(birthYear)` - Calculate age from birth year
- `inRange(value, min, max)` - Check if value is in range

**MatchType values:**

- `Exact (M)` - Perfect match (✓, green)
- `Near (N)` - Close match (≈, yellow) - for country (same region)
- `Different (D)` - Wrong value (✗, red)
- `Greater (G)` - Value is higher (↑, yellow) - for age/majors
- `Less (L)` - Value is lower (↓, yellow) - for age/majors

#### `useSSEConnection` (app/src/hooks/useSSEConnection.ts) - **NEW for multiplayer**

Custom React hook for managing SSE connections:

- Automatically establishes SSE connection when sessionId is available
- Listens for all SSE event types (connected, roomState, heartbeat, gamerJoined, etc.)
- Provides `sendAction()` method for POST requests to server
- Returns game state: gamers, guesses, roomStatus, mysteryPlayer, winner, isSSEConnected
- Handles connection lifecycle (connect, error, cleanup)

#### `OnlineHomePage` (app/src/pages/OnlineHomePage.tsx) - **NEW for multiplayer**

Online mode landing page:

- Display current username with link to settings
- Difficulty selector for room creation
- Room ID input for joining
- Create/join room buttons with loading states

#### `OnlineRoomPage` (app/src/pages/OnlineRoomPage.tsx) - **NEW for multiplayer**

Main online game room page:

- Room waiting state: Gamer list with ready indicators
- Host controls: Start game button (can start anytime)
- Non-host controls: Ready/toggle ready button
- Game in progress: PlayerSearchInput and GuessHistory components
- Game ended: Winner display and mystery player reveal
- Leave room button

#### `PlayerSearchInput` (app/src/components/PlayerSearchInput.tsx) - **SHARED component**

Reusable searchable player dropdown:

- Used by both single-player (GamePage) and multiplayer (OnlineRoomPage)
- Fuzzy search with debounced input
- Displays player list with proId, team, country
- onSelect callback for selected player

#### `usePlayerStore.ts` (client/src/store/usePlayerStore.ts)

Global player data management:

- `initializeData()` - Loads player on app start
- `getPlayersByMode(mode)` data and mode config - Returns filtered players for difficulty
- `isLoading`, `error`, `isInitialized` - Loading state management

#### `useSettingsStore.ts` (client/src/store/useSettingsStore.ts)

Settings management:

- `difficulty`, `totalGuesses` - Current settings state
- `setDifficulty()`, `setTotalGuesses()` - Auto-persist to localStorage
- `reset()` - Reset to defaults
- `initialize()` - Load from localStorage on app start

#### Player Data Structure

```typescript
interface Player {
  id: number;
  playerName: string;
  team: string;
  country: string;
  birthYear: number;
  majorsPlayed: number;
  role: "AWPer" | "Rifler" | "Unknown";
  lowerPlayerName: string; // Lowercase for search
  filterPlayerName: string; // Normalized for search
}
```

## Development Commands

### Monorepo Management

```bash
# Install dependencies for all workspaces
pnpm install

# Run command in specific workspace
pnpm --filter @guess-cspro/app dev
pnpm --filter @guess-cspro/service dev
pnpm --filter @guess-cspro/hltv_data_scraper fetch

# Run command in all workspaces
pnpm -r build
pnpm -r check
```

### Main Application (app)

```bash
# Start development server (port 5173, proxies /api to backend)
pnpm --filter @guess-cspro/app dev
# or from project root:
pnpm dev

# Build for production
pnpm --filter @guess-cspro/app build
# or from project root:
pnpm build:app

# Preview production build locally
pnpm --filter @guess-cspro/app preview

# Type check
pnpm --filter @guess-cspro/app check
```

### Backend Service (service) - **NEW for multiplayer**

```bash
# Start development server (port 3001)
pnpm --filter @guess-cspro/service dev

# Build for production
pnpm --filter @guess-cspro/service build

# Start production server
pnpm --filter @guess-cspro/service start

# Type check
pnpm --filter @guess-cspro/service check
```

**Starting Full Development Environment:**

For online multiplayer development, you need both servers running:

```bash
# Terminal 1: Start backend service
pnpm --filter @guess-cspro/service dev

# Terminal 2: Start frontend (with API proxy)
pnpm --filter @guess-cspro/app dev
```

The Vite dev server proxies `/api/*` requests to the backend service on port 3001.

### Data Scraper

From `hltv_data_scraper/` directory:

```bash
# Fetch player data from HLTV
pnpm fetch

# Sync data across modes
pnpm sync

# Apply patches/fixes
pnpm patch
```

### Database Loading

```bash
# Load players into MySQL database (requires DATABASE_URL)
node scripts/load-players.mjs
```

## Configuration

### Vite Config (app/vite.config.ts)

- **Aliases**: `@` → `app/src`, `@shared` → `shared`
- **PWA**: Configured with auto-update, offline support for JSON data
- **API Proxy**: `/api/*` proxied to `http://localhost:3001` (backend service)
- **Build**: Outputs to `dist/`
- **Dev Server**: Host on all interfaces, strict file system rules

### TypeScript Config (tsconfig.json)

- Strict mode enabled
- Path mapping for `@/*` and `@shared/*` aliases
- JSX preserve mode for React

### Tailwind Config

Custom cyberpunk/neon theme with:

- Dark default theme
- Neon border effects (`neon-border` class)
- Glitch text effects (`glitch-text` class)
- Custom color palette
- Responsive design breakpoints

## Data Management

### Data Loading Strategy

**App Initialization Flow:**

1. App component mounts
2. `useEffect` triggers `initializeData()` and `initializeSettings()`
3. Both stores load data concurrently:
   - Player store: fetches `/all_players_data.json` and `/mode_player_list.json`
   - Settings store: loads from localStorage
4. Loading screen displayed until both complete
5. App renders normally once initialized

**Data Sources:**

- Public directory: `client/public/*.json`
- Scraper output: `hltv_data_scraper/out/*.json`

**Mode Filtering:**

- All modes use the same `all_players_data.json`
- `mode_player_list.json` defines which players belong to each mode
- Filtering happens in `getPlayersByMode()` based on player names

**Database Integration:**

- Optional MySQL integration via `scripts/load-players.mjs`
- Uses environment variable `DATABASE_URL`
- Drizzle ORM schema referenced in types

## Styling Guidelines

- **Theme**: Dark cyberpunk aesthetic with neon accents
- **Components**: Use shadcn/ui component library built on Radix UI
- **Custom Classes**:
  - `neon-border` - Glowing border effect
  - `glitch-text` - Text glitch animation
  - `bracket` - Stylized brackets for labels
- **Responsive**: Mobile-first design with separate layouts for desktop/mobile
- **Colors**: CSS custom properties in `index.css` for theme consistency

## Important Implementation Notes

1. **Search Performance**: Player search uses debounced input (150ms) and normalized names for fuzzy matching

2. **Mobile Optimization**:
   - Separate table layouts for desktop (横向记录，纵向属性) and mobile (纵向属性，横向记录)
   - Horizontal scrolling on mobile for guess history
   - Dropdown positioning adapts to screen size

3. **PWA**: Player data is cached for offline gameplay

4. **Theme**:
   - Default theme is dark
   - Can be made switchable by uncommenting `switchable` prop in App.tsx
   - Color palette defined in `index.css`

5. **Error Handling**:
   - ErrorBoundary component wraps entire app
   - Toast notifications via Sonner for user feedback
   - Loading states handled in App.tsx

6. **State Management**:
   - All data loaded once on app start
   - Zustand stores manage global state
   - Settings auto-persist to localStorage
   - No async operations in game logic (data is pre-loaded)

## Common Development Tasks

### Adding New Player Attributes

1. Update `Player` interface in `client/src/lib/gameEngine.ts`
2. Update comparison logic in `comparePlayerAttributes()`
3. Add column to game table in `GamePage.tsx`
4. Update match symbol/class functions
5. Regenerate player data JSON files

### Adding New Difficulty Mode

1. Update `mode_player_list.json` to include player names for new mode
2. Add mode config to `DIFFICULTY_CONFIG` in `SettingsPage.tsx`
3. Update type definition for `Difficulty` in `useSettingsStore.ts`
4. No changes needed to data files - all modes share `all_players_data.json`

### Modifying Game Logic

- Core game state: `GamePage.tsx`
- Comparison rules: `gameEngine.ts`
- UI components: `components/`
- Styling: `index.css` for theme, component files for individual styles

### Working with Zustand Stores

**Player Store:**

- Located in `client/src/store/usePlayerStore.ts`
- Data initialization happens in App.tsx
- Use `getPlayersByMode()` to get filtered player list
- Check `isInitialized` before accessing data

**Settings Store:**

- Located in `client/src/store/useSettingsStore.ts`
- Auto-syncs to localStorage via setter methods
- Use `initialize()` in App.tsx to load saved settings
- All changes persist automatically

### Building and Deploying

```bash
# Build the application
pnpm build

# The dist/ folder contains the built app
# Can be served by any static file server
# For PWA testing, serve over HTTPS or localhost
```

## HLTV Data Scraper

The `hltv_data_scraper/` subproject fetches player data from HLTV using Puppeteer:

- **`fetchPlayer.ts`** - Core scraping logic for individual player pages
- **`sync.ts`** - Sync data across different modes
- **`constants.ts`** - File paths and configuration
- **`utils.ts`** - File I/O utilities

The scraper requires a JSON input file with player links, then fetches detailed data for each player and outputs structured JSON files.

**Data Sync Process:**

1. Scrapes player data from HLTV
2. Outputs to `all_players_data.json`
3. Manually curate `mode_player_list.json` for Normal/YLG modes
4. Sync copies files to `client/public/`

## Dependencies

### Main Application

- React ecosystem (React, React DOM)
- UI libraries (Radix UI, shadcn/ui, Lucide React icons)
- Routing (Wouter)
- State Management (Zustand)
- Styling (Tailwind CSS, class-variance-authority, clsx, tailwind-merge)
- Animations (Framer Motion)
- Utilities (date-fns, nanoid)

### Scraper

- Puppeteer + puppeteer-extra for web scraping
- Stealth plugin to avoid detection

## Testing

No test framework is currently configured. The project uses manual testing via the development server.

## Security Notes

- Environment variables handled via `.env` files (not committed)
- Puppeteer runs in non-headless mode for debugging (can be changed to headless)
- No authentication or sensitive data handling in frontend

## Online Multiplayer Architecture

### Backend Service (service/)

The online multiplayer backend is built with Node.js + Hono.js:

- **RoomManager** (`service/src/managers/RoomManager.ts`): Manages game rooms, player joins/leaves, game flow
- **SessionManager** (`service/src/managers/SessionManager.ts`): Manages SSE connections, session lifecycle
- **Routes** (`service/src/routes/index.ts`): API endpoints for room operations
- **Models**: Room, Session, Player data structures
- **Shared Logic**: Uses `shared/gameEngine.ts` for guess comparison

### API Endpoints

All endpoints prefixed with `/api/`:

- `POST /api/room/create` - Create new room (returns roomId, sessionId)
- `POST /api/room/join` - Join existing room (returns sessionId)
- `GET /api/sse/:sessionId` - SSE connection for real-time updates
- `POST /api/room/ready` - Toggle ready status
- `POST /api/room/start` - Start game (host only)
- `POST /api/room/action` - Submit guess
- `POST /api/room/leave` - Leave room
- `POST /api/room/heartbeat` - Manual heartbeat ping
- `GET /api/alive` - Health check

### SSE Events

Server-sent events (defined in `shared/const.ts`):

- `connected` - SSE connection established
- `roomState` - Full room state (gamers list, status)
- `heartbeat` - Keep-alive (every 30s)
- `gamerJoined` - New player joined
- `gamerLeft` - Player left
- `readyUpdate` - Player ready status changed
- `allReady` - All non-host players ready
- `gameStarted` - Game started
- `guessResult` - Guess processed with mask
- `gameEnded` - Game ended (winner, mystery player)
- `roomEnded` - Room closed

### Shared Code (shared/)

The `shared` workspace contains code used by both frontend and backend:

- `gameEngine.ts` - Core game logic (compareGuess, searchPlayers, etc.)
- `const.ts` - Constants including SSE event types (EsCustomEvent enum)
- `countryUtils.ts` - Country to region mapping
- `types.ts` - TypeScript type definitions
- `data/` - Player data JSON files

## Future Enhancements

- YLG mode implementation
- Player statistics/trivia
- Leaderboards
- **~~Multiplayer mode~~** (✅ **COMPLETED** - see feature-online branch)
- Tournament-specific filters
- Reconnection handling for SSE disconnects
- Kick player functionality (UI exists, needs backend implementation)
