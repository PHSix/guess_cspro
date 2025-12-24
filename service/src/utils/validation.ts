import { z } from "zod";
import type { Difficulty } from "@guess-cspro/shared";

/**
 * Zod validation schemas for API requests
 * These schemas validate incoming requests and provide type inference
 */

export const createRoomSchema = z.object({
  gamerId: z.string().uuid(),
  gamerName: z.string().min(1).max(50),
  difficulty: z
    .enum(["all", "normal", "ylg"])
    .default("all") as z.ZodType<Difficulty>,
});

export const joinRoomSchema = z.object({
  gamerId: z.string().uuid(),
  gamerName: z.string().min(1).max(50),
  roomId: z.string().uuid(),
});

export const readySchema = z.object({
  ready: z.boolean(),
});

export const guessSchema = z.object({
  guess: z.string().min(1),
});

export const sessionIdSchema = z.string().uuid();

// Infer TypeScript types from Zod schemas
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type ReadyInput = z.infer<typeof readySchema>;
export type GuessInput = z.infer<typeof guessSchema>;
