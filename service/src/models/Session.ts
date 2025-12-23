import type { ServerResponse } from "node:http";

export interface Session {
  sessionId: string;
  gamerId: string;
  gamerName: string;
  roomId: string | null;
  response: ServerResponse;
  lastActive: Date;
}
