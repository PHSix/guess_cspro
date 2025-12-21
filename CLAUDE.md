# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CS:GO/CS2 professional player guessing game built with React and TypeScript. The game randomly selects a player and players must guess the player by comparing attributes (team, country, age, major tournament participation, and role) with feedback indicators showing how close their guesses are.

## Tech Stack

- **Frontend**: React 19.2.1 + TypeScript + Vite 7.1.7
- **Routing**: Wouter (lightweight alternative to React Router)
- **Styling**: Tailwind CSS 4.1.14 with custom cyberpunk/neon theme
- **UI Components**: Radix UI primitives
- **State Management**: React hooks + localStorage for settings
- **PWA**: VitePWA plugin for offline support
- **Package Manager**: pnpm

## Architecture

### Directory Structure

- **`client/`** - Main React application
  - **`src/`** - Source code
    - **`components/`** - Reusable UI components (ErrorBoundary, Confetti, GameResult, GuessHistory, plus shadcn/ui components in `ui/` subdirectory)
    - **`pages/`** - Route pages (HomePage, GamePage, FinishedPage, SettingsPage, NotFound)
    - **`lib/`** - Core game logic (`gameEngine.ts`), utilities (`utils.ts`)
    - **`contexts/`** - React contexts (ThemeContext)
    - **`hooks/`** - Custom hooks (e.g., `useMobile`)
    - **`const.ts`** - Game constants
  - **`public/`** - Static data files (JSON player data for different modes)

- **`shared/`** - Shared code between client and other modules
  - **`types.ts`** - Type definitions (references Drizzle schema)
  - **`countryUtils.ts`** - Country to region mapping utilities
  - **`const.ts`** - Shared constants
  - **`_core/errors.ts`** - Error types

- **`hltv_data_scraper/`** - Node.js scraper for fetching player data from HLTV
  - **`src/`** - TypeScript scraper code
  - **`out/`** - Output JSON files
  - Uses Puppeteer for web scraping

- **`scripts/`** - Utility scripts (load-players.mjs, seed-players.mjs)

- **`dist/`** - Build output directory

### Core Game Flow

1. **HomePage** (`/`) - Landing page with START GAME button
2. **GamePage** (`/game`) - Main gameplay interface
   - Displays answer player attributes to guess
   - Searchable dropdown to select player guesses
   - Comparison table showing guess results with match indicators
   - Mobile-optimized layout with horizontal scrolling
3. **FinishedPage** (`/finished`) - Game completion (win/loss)
4. **SettingsPage** (`/settings`) - Game configuration

### Game Modes

The game supports three difficulty modes stored as JSON files in `client/public/`:

- **`all_players_data.json`** - ALL mode (hardest, all players)
- **`normal_players_data.json`** - Normal mode (curated selection)
- **`ylg_players_data.json`** - YLG mode (easiest, coming soon)

Settings stored in localStorage:
- `game-difficulty` - Current difficulty mode
- `game-total-guesses` - Number of allowed guesses (1-20, default 8)

### Key Components

#### `gameEngine.ts` (client/src/lib/gameEngine.ts)

Core game logic including:
- `getAllPlayers()` - Load player data from JSON files
- `searchPlayers(query)` - Fuzzy search players by name
- `getRandomPlayer()` - Select random player for current mode
- `comparePlayerAttributes()` - Compare guess vs answer with match types
- `isCorrectGuess()` - Check if guess matches answer
- `createGuessRecord()` - Format guess with comparison results

Match types:
- `Exact` - Perfect match (✓, green)
- `Near` - Close match (≈, yellow)
- `Different` - Wrong value (✗, red)
- `Greater` - Value is higher (↑, yellow)
- `Less` - Value is lower (↓, yellow)

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

### Main Application

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Type check
pnpm check

# Format code with Prettier
pnpm format
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

Player data is stored in JSON files and loaded dynamically based on difficulty mode. The game engine caches data in memory and localStorage for performance.

**Data Sources:**
- Public directory: `client/public/*.json`
- Scraper output: `hltv_data_scraper/out/*.json`

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

6. **Game State**:
   - Settings persist in localStorage
   - Game progress stored in component state (not persisted)

## Common Development Tasks

### Adding New Player Attributes

1. Update `Player` interface in `client/src/lib/gameEngine.ts`
2. Update comparison logic in `comparePlayerAttributes()`
3. Add column to game table in `GamePage.tsx`
4. Update match symbol/class functions
5. Regenerate player data JSON files

### Adding New Difficulty Mode

1. Create new JSON file in `client/public/`
2. Add entry to `DATA_SOURCE_MAP` in `gameEngine.ts`
3. Add mode config to `DIFFICULTY_CONFIG` in `SettingsPage.tsx`
4. Update type definition for `Difficulty`

### Modifying Game Logic

- Core game state: `GamePage.tsx`
- Comparison rules: `gameEngine.ts`
- UI components: `components/`
- Styling: `index.css` for theme, component files for individual styles

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

## Dependencies

### Main Application
- React ecosystem (React, React DOM, React Hook Form)
- UI libraries (Radix UI, shadcn/ui, Lucide React icons)
- Routing (Wouter)
- Data fetching (@tanstack/react-query, axios)
- Styling (Tailwind CSS, class-variance-authority, clsx, tailwind-merge)
- Animations (Framer Motion)
- Utilities (date-fns, nanoid, jose for JWT)

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
