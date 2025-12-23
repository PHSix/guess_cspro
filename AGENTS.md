# Development Commands

pnpm dev # Start dev server
pnpm check # Type check (tsc --noEmit)
pnpm build # Build all workspaces
pnpm format # Format code with Prettier
pnpm --filter @guess-cspro/app dev # Run app-specific commands
pnpm --filter @guess-cspro/hltv_data_scraper fetch # Scrape data

# Code Style Guidelines

- Imports: Named imports preferred, use @/_ for app, @shared/_ for shared code
- Formatting: Prettier (double quotes, semicolons, 80 char width), no inline comments
- Types: TypeScript strict mode, interface for objects, type for primitives
- Naming: PascalCase components, camelCase functions/hooks, UPPER_SNAKE_CASE constants
- Error handling: try/catch with console.error, use ErrorBoundary for boundaries
- State: Zustand for global state, React hooks for component state
- UI: shadcn/ui patterns, class-variance-authority for variants, cn() utility
- File structure: pages/, components/ (with ui/ subfolder), store/, lib/
- Testing: No test framework - use pnpm dev for manual testing
