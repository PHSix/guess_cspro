# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CS:GO/CS2 professional player guessing game built with React and TypeScript. The game randomly selects a player and players must guess the player by comparing attributes (team, country, age, major tournament participation, and role) with feedback indicators showing how close their guesses are.

## Tech Stack

- **Frontend**: React 19.2.1 + TypeScript + Vite 7.1.7
- **Routing**: Wouter (lightweight alternative to React Router)
- **Styling**: Tailwind CSS 4.1.14 with custom cyberpunk/neon theme
- **UI Components**: Radix UI primitives
- **State Management**: Zustand (global state) + localStorage for settings persistence
- **PWA**: VitePWA plugin for offline support
- **Package Manager**: pnpm

## Architecture

### Monorepo Structure

This project is organized as a pnpm monorepo with the following workspaces:

- **`app/`** - Main React application
  - **`src/`** - Source code
    - **`components/`** - Reusable UI components (ErrorBoundary, Confetti, GameResult, GuessHistory, plus shadcn/ui components in `ui/` subdirectory)
    - **`pages/`** - Route pages (HomePage, GamePage, FinishedPage, SettingsPage, NotFound)
    - **`lib/`** - Core game logic (`gameEngine.ts`), utilities (`utils.ts`)
    - **`store/`** - Zustand global state stores (`usePlayerStore.ts`, `useSettingsStore.ts`)
    - **`contexts/`** - React contexts (ThemeContext)
    - **`hooks/`** - Custom hooks (e.g., `useMobile`)
    - **`const.ts`** - Game constants
  - **`public/`** - Static data files (JSON player data)
  - `package.json` - App dependencies and scripts
  - `vite.config.ts` - Vite configuration
  - `tsconfig.json` - TypeScript configuration

- **`shared/`** - Shared code between apps and other modules
  - **`types.ts`** - Type definitions (references Drizzle schema)
  - **`countryUtils.ts`** - Country to region mapping utilities
  - **`const.ts`** - Shared constants
  - **`_core/errors.ts`** - Error types
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

1. **App Initialization** - Data loaded on app start with loading screen
2. **HomePage** (`/`) - Landing page with START GAME button
3. **GamePage** (`/game`) - Main gameplay interface
   - Displays answer player attributes to guess
   - Searchable dropdown to select player guesses
   - Comparison table showing guess results with match indicators
   - Mobile-optimized layout with horizontal scrolling
4. **FinishedPage** (`/finished`) - Game completion (win/loss)
5. **SettingsPage** (`/settings`) - Game configuration

### Data Management Architecture

#### Global State (Zustand)

**usePlayerStore** (`client/src/store/usePlayerStore.ts`)
- Manages all player data and mode configuration
- Loads data on app initialization: `/all_players_data.json` and `/mode_player_list.json`
- Provides filtered player lists based on difficulty mode
- Caches data for performance
- Handles loading and error states

**useSettingsStore** (`client/src/store/useSettingsStore.ts`)
- Manages game settings (difficulty, total guesses)
- Auto-syncs to localStorage
- Initializes from localStorage on app start
- Provides setter methods that automatically persist changes

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

#### `gameEngine.ts` (client/src/lib/gameEngine.ts)

Core game logic including:
- `getAllPlayers()` - Get players for current mode (sync, from global state)
- `searchPlayers(query)` - Fuzzy search players by name (sync)
- `getRandomPlayer()` - Select random player for current mode (sync)
- `comparePlayerAttributes()` - Compare guess vs answer with match types
- `isCorrectGuess()` - Check if guess matches answer
- `createGuessRecord()` - Format guess with comparison results

**Match types:**
- `Exact` - Perfect match (✓, green)
- `Near` - Close match (≈, yellow)
- `Different` - Wrong value (✗, red)
- `Greater` - Value is higher (↑, yellow)
- `Less` - Value is lower (↓, yellow)

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
  lowerPlayerName: string;      // Lowercase for search
  filterPlayerName: string;     // Normalized for search
}
```

## Development Commands

### Monorepo Management

```bash
# Install dependencies for all workspaces
pnpm install

# Run command in specific workspace
pnpm --filter @guess-cspro/app dev
pnpm --filter @guess-cspro/hltv_data_scraper fetch

# Run command in all workspaces
pnpm -r build
pnpm -r check
```

### Main Application (apps/app)

```bash
# Start development server
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

### Vite Config (vite.config.ts)

- **Aliases**: `@` → `client/src`, `@shared` → `shared`
- **PWA**: Configured with auto-update, offline support for JSON data
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

## Future Enhancements

- YLG mode implementation
- Player statistics/trivia
- Leaderboards
- Multiplayer mode
- Tournament-specific filters
