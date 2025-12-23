# Bugs Found in guess_cspro Project

## Summary

This document lists all bugs found during code analysis and type checking.

---

## 1. TypeScript Configuration Issues

### 1.1 Service Package - tsconfig.json (Line 15)

**Location:** `service/tsconfig.json:15`
**Severity:** CRITICAL
**Issue:** The `lib` compiler option has a string value instead of an array.

```json
"lib": "ES2017"  // WRONG - should be array
```

**Fix:**

```json
"lib": ["ES2017"]
```

**Impact:** Causes TypeScript to fail reading configuration, breaks build.

---

### 1.2 Service Package - Missing @types/node

**Location:** Multiple files in `service/src/`
**Severity:** CRITICAL
**Issue:** `@types/node` is not properly configured in tsconfig, causing:

- `Cannot find global value 'Promise'`
- `Cannot find name 'process'`
- `Cannot find namespace 'NodeJS'`
- `Cannot find name 'Map'`

**Fix:** Add `"types": ["node"]` to `compilerOptions` in `service/tsconfig.json`

---

## 2. Service Package Critical Bugs

### 2.1 routes/index.ts - Default Import Issue (Line 2)

**Location:** `service/src/routes/index.ts:2`
**Severity:** CRITICAL
**Issue:** Imports `app` as default, but routes/index.ts exports it as named export.

```typescript
import app from "./routes/index.js"; // WRONG
```

**Fix:**

```typescript
import { app } from "./routes/index.js";
```

### 2.2 routes/index.ts - Null Check Missing (Lines 103-105, 110-111)

**Location:** `service/src/routes/index.ts:103-111`
**Severity:** CRITICAL
**Issue:** `pending` can be null but is used without null check.

```typescript
const pending = roomManager.getPendingSession(sessionId);
// ...
const connectEvent = `event: connected\ndata: ${JSON.stringify({
  gamerId: pending.gamerId, // ERROR: pending is possibly null
  gamerName: pending.gamerName, // ERROR: pending is possibly null
})}\n\n`;
```

**Fix:**

```typescript
if (!pending) {
  return c.json({ success: false, message: "Invalid session" }, 401);
}
```

### 2.3 routes/index.ts - Wrong Response Type (Line 116)

**Location:** `service/src/routes/index.ts:116`
**Severity:** CRITICAL
**Issue:** `res` variable is typed as `Request`, not `Response`.

```typescript
const res = c.req.raw; // This is Request, not Response!
```

**Fix:**

```typescript
const resTyped = res as unknown as {
  writableEnded: boolean;
  write: (data: string) => void;
};
sessionManager.createSession(..., resTyped);
```

### 2.4 routes/index.ts - Undefined sessionId (Line 266)

**Location:** `service/src/routes/index.ts:266`
**Severity:** HIGH
**Issue:** `session.roomId` is `string | null`, but passed as `string`.

```typescript
roomManager.removeGamer(roomId || "", session.gamerId); // roomId could be null
```

### 2.5 RoomManager.broadcastToRoom - Uses Wrong Sessions (Lines 274-291)

**Location:** `service/src/managers/RoomManager.ts:274-291`
**Severity:** CRITICAL - **SSE BROADCAST WILL NOT WORK**
**Issue:** `broadcastToRoom` iterates over `pendingSessions` instead of active sessions from `sessionManager`. The `pending.data?.response` doesn't exist because pending sessions don't have response objects.

```typescript
broadcastToRoom(roomId: string, event: string, data: unknown): void {
  // ...
  room.gamers.forEach((_, gamerId) => {
    const pendingKeys = Array.from(this.pendingSessions.entries());
    pendingKeys.forEach(([sessionId, pending]) => {
      if (pending.gamerId === gamerId) {
        const res = pending.data?.response as any;  // ERROR: pending has no data property
        if (res && !res.writableEnded) {
          res.write(eventString);  // This will NEVER be called!
        }
      }
    });
  });
}
```

**Fix:** The `RoomManager` needs access to `SessionManager` or a callback mechanism to broadcast to actual active SSE connections.

### 2.6 RoomManager - Hardcoded Player List (Lines 186-198)

**Location:** `service/src/managers/RoomManager.ts:186-198`
**Severity:** HIGH
**Issue:** Only 9 players are available for mystery player generation instead of using full player data.

```typescript
const players = [
  "s1mple",
  "ZywOo",
  "NiKo",
  "donk",
  "m0NESY",
  "device",
  "ropz",
  "sh1ro",
  "frozen",
];
const randomPlayerName = players[Math.floor(Math.random() * players.length)];
```

**Fix:** Use the full player data from `all_players_data.json`:

```typescript
import { getMysteryPlayers } from "../models/playerDataLoader.js";
const players = getMysteryPlayers();
const randomPlayerName =
  players[Math.floor(Math.random() * players.length)].playerName;
```

### 2.7 models/Session.ts - Missing Import (Line 1)

**Location:** `service/src/models/Session.ts:1`
**Severity:** CRITICAL
**Issue:** Cannot find module 'node:http'

```typescript
import type { ServerResponse } from "node:http"; // FAILS without @types/node
```

---

## 3. App Package TypeScript Errors

### 3.1 OnlineHomePage.tsx - Missing Request Types (Lines 50, 88)

**Location:** `app/src/pages/OnlineHomePage.tsx:50, 88`
**Severity:** HIGH
**Issue:** `CreateRoomRequest` and `JoinRoomRequest` types are used but not defined anywhere.

```typescript
} satisfies CreateRoomRequest),   // Type doesn't exist!
} satisfies JoinRoomRequest),   // Type doesn't exist!
```

**Fix:** Add these types to `app/src/types/multiplayer.ts`:

```typescript
export interface CreateRoomRequest {
  gamerId: string;
  gamerName: string;
}

export interface JoinRoomRequest {
  gamerId: string;
  gamerName: string;
  roomId: string;
}
```

### 3.2 OnlineGamePage.tsx - Broken JSX Syntax (Lines 273-362)

**Location:** `app/src/pages/OnlineGamePage.tsx:273-362`
**Severity:** CRITICAL
**Issue:** Multiple JSX syntax errors:

- Missing closing `</Card>` tag
- Extra `</div>` closing tag
- Function definitions inside JSX without proper placement

**Error Messages:**

```
Line 273: JSX element 'Card' has no corresponding closing tag
Line 275: JSX expressions must have one parent element
Line 288: ')' expected
Line 360: Expected corresponding JSX closing tag for 'div'
Line 363-392: Declaration or statement expected
```

**Fix:** Review and fix JSX structure around lines 270-365.

### 3.3 OnlineRoomPage.tsx - Broken JSX Syntax (Lines 220-572)

**Location:** `app/src/pages/OnlineRoomPage.tsx:220-572`
**Severity:** CRITICAL
**Issue:** Multiple JSX syntax errors throughout the file.

**Error Messages:**

```
Line 220: ',' expected
Line 299: ')' expected
Line 301: Unexpected token
Line 334: Expected corresponding JSX closing tag for 'Card'
Line 335: ')' expected
Line 336: Unexpected token
Line 400-402: JSX expressions must have one parent element
Line 466-480: Multiple syntax errors
Line 502: '}' expected
Line 553: Unexpected token
Line 570-573: Declaration/statement expected
```

**Fix:** Review and fix entire JSX structure in OnlineRoomPage.tsx.

### 3.4 OnlineGamePage.tsx - Wrong Type Access (Lines 367-391)

**Location:** `app/src/pages/OnlineGamePage.tsx:367-391`
**Severity:** HIGH
**Issue:** `Mask["field_name"]` is not valid - should be accessing specific properties or using indexed type.

```typescript
function getMatchClass(match: Mask["field_name"]): string {  // WRONG
```

**Fix:** Use proper type:

```typescript
function getMatchClass(match: MatchType): string {
  // ...
}
```

---

## 4. Type System Issues

### 4.1 Duplicate Type Definitions

**Location:** `app/src/types/multiplayer.ts` and `service/src/models/PlayerData.ts`
**Severity:** MEDIUM
**Issue:** Same types (`MysteryPlayer`, `Mask`, `MatchType`, etc.) are duplicated in two locations instead of being shared.
**Impact:** Type inconsistencies, maintenance burden, DRY violation.

**Fix:** Move types to `shared/` and import from there.

### 4.2 Missing Type Exports from shared

**Location:** `shared/index.ts`
**Severity:** MEDIUM
**Issue:** Multiplayer types are not exported from shared package, forcing duplication.

```typescript
export type * from "../drizzle/schema";
export * from "./_core/errors";
// Missing: export * from "./types/multiplayer";
```

---

## 5. Logic Bugs

### 5.1 OnlineHomePage.tsx - Wrong Navigation (Line 101)

**Location:** `app/src/pages/OnlineHomePage.tsx:101`
**Severity:** MEDIUM
**Issue:** After joining room, navigates to `/multiplayer` instead of `/room`.

```typescript
setLocation("/multiplayer"); // Should be "/room"
```

### 5.2 OnlineHomePage.tsx - Unused Search Function (Lines 109-127)

**Location:** `app/src/pages/OnlineHomePage.tsx:109-127`
**Severity:** LOW
**Issue:** `handleSearch` function is defined but never called. The `searchResults` and `showResults` state are never used.

### 5.3 useSSEConnection - Missing Dependencies (Line 29)

**Location:** `app/src/hooks/useSSEConnection.ts:29`
**Severity:** MEDIUM
**Issue:** `useEffect` has empty dependency array `[]`, but should depend on `sessionId`. When sessionId changes, SSE connection is not re-established.

```typescript
}, []);  // Should be [sessionId]
```

### 5.4 useSSEConnection - Incorrect Event Listener (Lines 92-118)

**Location:** `app/src/hooks/useSSEConnection.ts:92-118`
**Severity:** HIGH
**Issue:** SSE event listeners access `.data` from EventSource target, which is incorrect. Should use `event.data` from MessageEvent.

```typescript
eventSource.addEventListener(
  "connected",
  e => handleEvent("connected", (e.target as EventSource).data) // WRONG
);
```

**Fix:**

```typescript
eventSource.addEventListener("connected", (e: MessageEvent) =>
  handleEvent("connected", e.data)
);
```

---

## 6. Missing Implementation

### 6.1 No Player Data Sync Script

**Location:** Root `package.json`
**Severity:** MEDIUM
**Issue:** No script to sync `all_players_data.json` from app to service directory as specified in specs.

**Fix:** Add to root `package.json`:

```json
"scripts": {
  "sync-player-data": "cp app/public/all_players_data.json service/src/data/all_players_data.json"
}
```

### 6.2 Missing Heartbeat on Client Side

**Location:** `app/src/hooks/useSSEConnection.ts`
**Severity:** MEDIUM
**Issue:** No periodic heartbeat sending to keep session alive (spec requires every 30s).

**Fix:** Add heartbeat interval:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    sendAction("/room/heartbeat", {});
  }, 30000);
  return () => clearInterval(interval);
}, [sendAction]);
```

---

## 7. Severity Summary

| Severity | Count | Issues                                                |
| -------- | ----- | ----------------------------------------------------- |
| CRITICAL | 11    | Typescript config, SSE broadcast, JSX syntax, imports |
| HIGH     | 5     | Wrong types, hardcoded players, missing null checks   |
| MEDIUM   | 6     | Duplicate types, wrong navigation, missing features   |
| LOW      | 1     | Unused code                                           |

**Total: 23 bugs found**

---

## 8. Priority Fix Order

### Immediate (Blockers)

1. Fix `service/tsconfig.json` lib configuration
2. Add @types/node to service package
3. Fix `routes/index.ts` default import
4. Fix `RoomManager.broadcastToRoom` - use correct session manager
5. Fix JSX syntax in OnlineGamePage.tsx and OnlineRoomPage.tsx

### High Priority

6. Fix null checks in routes/index.ts
7. Fix hardcoded player list in RoomManager
8. Add missing request types to multiplayer.ts
9. Fix useSSEConnection event listeners

### Medium Priority

10. Consolidate duplicate types to shared/
11. Fix navigation bugs
12. Add heartbeat implementation
13. Add player data sync script

### Low Priority

14. Remove unused search function

---

## 9. Testing Recommendations

After fixing bugs, test:

1. SSE connection establishment and event receiving
2. Room creation and joining flow
3. Broadcast to all connected players
4. Game start and guess submission
5. Mystery player generation from full data
6. Type checking with `pnpm check`
7. Runtime with both dev and production builds

---

_Generated on 2025-12-23_
