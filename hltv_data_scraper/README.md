# HLTV Data Scraper

Data scraper for fetching CS:GO/CS2 professional player information from HLTV.org using Puppeteer.

## Overview

This tool crawls HLTV player pages to extract up-to-date player data including:
- Player name (proId)
- Team
- Country
- Birth year
- Major tournament participation count
- Role (AWPer / Rifler)

## Features

- Automated web scraping with Puppeteer
- Stealth mode to avoid detection
- Batch processing of player lists
- Data export to JSON format
- Sync across difficulty modes

## Development

```bash
# Install dependencies
pnpm install

# Fetch player data from HLTV
pnpm fetch

# Sync data to different game modes
pnpm sync

# Apply patches and fixes
pnpm patch

# Type check
pnpm check
```

## Project Structure

```
hltv_data_scraper/
├── src/
│   ├── fetchPlayer.ts    # Core scraping logic for individual player
│   ├── sync.ts            # Sync data across game modes
│   ├── constants.ts       # File paths and configuration
│   └── utils.ts          # File I/O utilities
├── out/                   # Output JSON files
│   ├── all_players_data.json     # All player data
│   └── mode_player_list.json     # Mode-specific player lists
├── package.json
└── README.md
```

## Usage

### 1. Prepare Input File

Create a JSON file with HLTV player URLs:

```json
{
  "players": [
    {
      "name": "s1mple",
      "url": "https://www.hltv.org/player/7998/s1mple"
    },
    {
      "name": "ZywOo",
      "url": "https://www.hltv.org/player/16056/ZywOo"
    }
  ]
}
```

### 2. Run the Scraper

```bash
pnpm fetch input.json
```

### 3. Output Files

The scraper generates:

- **`out/all_players_data.json`** - All player data with full attributes
- **`out/mode_player_list.json`** - Player lists filtered by difficulty mode

### 4. Sync to App

```bash
# Copy data to frontend public directory
pnpm sync
```

## Data Format

### Player Data Structure

```json
[
  {
    "id": "7998",
    "proId": "s1mple",
    "team": "NAVI",
    "country": "Ukraine",
    "birthYear": 1997,
    "majorsPlayed": 20,
    "role": "AWPer",
    "lowerProId": "s1mple",
    "filterProId": "s1mple"
  }
]
```

### Mode Configuration

```json
{
  "ylg": ["player1", "player2", ...],
  "normal": ["s1mple", "ZywOo", "m0NESY", ...]
}
```

## Modes

- **ALL mode**: Includes all scraped players (highest difficulty)
- **Normal mode**: Manually curated list of well-known players
- **YLG mode**: Easiest mode (to be implemented)

## Configuration

Edit `src/constants.ts` to configure:

```typescript
export const INPUT_FILE = "./input.json";
export const OUTPUT_DIR = "./out";
export const ALL_PLAYERS_FILE = "./out/all_players_data.json";
export const MODE_PLAYER_LIST_FILE = "./out/mode_player_list.json";
```

## Troubleshooting

### Puppeteer Issues

If you encounter scraping issues:

1. **Headless mode**: Change `headless: true` in Puppeteer launch options
2. **Timeout**: Increase `page.setDefaultTimeout()` if pages load slowly
3. **User agent**: The stealth plugin handles user agent spoofing

### Missing Data

Some player pages may have incomplete data:
- **Role**: Defaults to "Unknown" if not specified
- **Majors**: May be 0 for newer players

## Credits

The scraper code structure was inspired by [GuessCSPRO](https://github.com/bai-piao/GuessCSPRO) project.

## License

MIT

## See Also

- **Root README**: [../README.md](../README.md)
- **Frontend App**: [../app/README.md](../app/README.md)
- **Shared Code**: [../shared/README.md](../shared/README.md)
