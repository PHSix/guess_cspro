# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **弗一把** (Fu Yiba) - a CS:GO/CS2 professional player guessing game. Players have 8 attempts to guess a random professional player based on attributes like team, country, age, Major maps played, and role.

## Architecture

### High-Level Structure

```
/home/ph/repos/guess_cspro
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components (shadcn/ui + custom)
│   │   ├── pages/          # Route pages (Home.tsx, NotFound.tsx)
│   │   ├── lib/            # Core logic (gameEngine.ts, utils.ts)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts (ThemeContext)
│   │   ├── _core/          # Core utilities and types
│   │   ├── App.tsx         # Main app component with routing
│   │   ├── main.tsx        # Entry point
│   │   └── index.css       # Global styles with Tailwind
│   └── public/             # Static assets (players_data.json)
├── shared/                 # Shared types and utilities
│   ├── _core/              # Core shared code
│   ├── types.ts            # Type exports
│   └── const.ts            # Shared constants
├── scripts/                # Database scripts (MySQL)
│   ├── load-players.mjs    # Load players from JSON to DB
│   └── seed-players.mjs    # Alternative seeding script
├── players_data.json       # Original player data (192KB)
├── players_data_cleaned.json  # Cleaned player data (118KB)
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── components.json         # shadcn/ui configuration
```

### Key Technologies

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with custom neon/cyberpunk theme
- **shadcn/ui** - UI component library (New York style)
- **Wouter** - Lightweight routing (patched at v3.7.1)
- **Lucide React** - Icons
- **MySQL** - Database (scripts provided, not actively used)

### Core Components

1. **Game Engine** (`client/src/lib/gameEngine.ts`): Contains all game logic:
   - `Player` interface with team, country, birthYear, majorMaps, role
   - `MatchType` enum for comparison results (Exact, Near, Different, Greater, Less)
   - Functions: `getRandomPlayer()`, `searchPlayers()`, `comparePlayerAttributes()`, `isCorrectGuess()`

2. **Home Page** (`client/src/pages/Home.tsx`): Main game interface with:
   - Menu state (start game)
   - Playing state (search and guess players)
   - Finished state (show results)
   - Search with autocomplete dropdown
   - Guess history table with color-coded matching

3. **Data Source**: Static JSON files loaded via fetch:
   - `/players_data.json` (in /client/public/)
   - Loaded asynchronously with caching

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type check
pnpm check

# Format code with Prettier
pnpm format

# Run tests (currently disabled)
pnpm test

# Database operations (scripts exist but not actively used)
pnpm db:push
```

## Configuration

### TypeScript Paths
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

### Vite Configuration
- Root: `/client`
- Build output: `/dist/public`
- Environment variables: Loaded from project root
- Aliases configured for `@`, `@shared`, `@assets`

### Tailwind Configuration
- CSS file: `client/src/index.css`
- Base color: `neutral`
- Style: New York (from shadcn/ui)
- Custom CSS variables for theming

## Key Implementation Details

### Theme System
- Default theme: `dark` in App.tsx
- ThemeProvider from contexts/ThemeContext
- CSS variables defined in index.css
- Can be made switchable by uncommenting `switchable` prop

### Styling Patterns
- Custom neon/cyberpunk aesthetic with `neon-border` class
- Glitch text effects on title
- Color-coded match indicators (green=exact, yellow=near, red=different)
- Bracket notation for UI labels

### Game Logic
- Players get 8 guesses maximum
- Random player selection at game start
- Search is debounced (150ms)
- Keyboard navigation (arrow keys, enter)
- Age calculated dynamically from birthYear
- Match comparison with tolerance:
  - Age: ±2 years
  - Major maps: ±3 maps

### Database Scripts
- Two scripts for loading player data to MySQL
- `load-players.mjs`: Uses DATABASE_URL environment variable
- `seed-players.mjs`: Uses individual DB_HOST, DB_USER, etc. variables
- Currently not used (static JSON files instead)

## Current State

- **Static Build**: No active backend, no tests
- **No Authentication**: tRPC code has been removed
- **No Database**: Uses static JSON files
- **No tRPC**: Previously removed, leftover references cleaned up
- **No Tests**: `pnpm test` echoes message about static build

## Data Management

Player data is loaded from JSON files with this structure:
```typescript
{
  "playerName": {
    "player": "Actual Name",
    "team": "Team Name",
    "country": "Country",
    "birth_year": 2000,
    "Maps": 100,
    "role": "AWPer|Rifler|Unknown"
  }
}
```

## Important Files

- `client/src/pages/Home.tsx` - Main game implementation
- `client/src/lib/gameEngine.ts` - Game logic and data operations
- `client/src/index.css` - Global styles and theme
- `client/public/players_data.json` - Player data source
- `vite.config.ts` - Build configuration
- `components.json` - shadcn/ui configuration

## Notes

- The project uses a patched version of Wouter (v3.7.1 with patches/wouter@3.7.1.patch)
- Tailwind v4 is used with the new @tailwindcss/vite plugin
- React Query (@tanstack/react-query) is installed but not actively used
- Many shadcn/ui components are available in client/src/components/ui/
- The codebase has components for features not currently used (AI chat, dashboard, maps)
