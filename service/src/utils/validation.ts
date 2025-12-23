import { z } from "zod";

export const createRoomSchema = z.object({
  gamerId: z.string().uuid(),
  gamerName: z.string().min(1).max(50),
  difficulty: z.enum(["all", "normal", "ylg"]).default("all"),
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

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type ReadyInput = z.infer<typeof readySchema>;
export type GuessInput = z.infer<typeof guessSchema>;
