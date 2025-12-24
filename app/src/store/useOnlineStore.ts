import type { Difficulty, GamerInfo, MysteryPlayer, RoomStatus } from "@/types";
import { customCreate } from "./util";
import { Guess } from "@shared/gameEngine";

interface OnlineState {
  gamerId: string | null;
  gamerName: string | null;
  sessionId: string | null;
  roomId: string | null;
  isHost: boolean;

  gamers: GamerInfo[];
  roomStatus: RoomStatus;

  mysteryPlayer: MysteryPlayer | null;

  guesses: Map<string, Guess[]>;
  winner: string | null;
  isSSEConnected: boolean;
  sseError: string | null;
  difficulty: Difficulty;

  // Actions
  initializeGamerId: () => void;
  setGamerInfo: (gamerId: string, gamerName: string) => void;
  setSessionInfo: (
    sessionId: string,
    roomId: string,
    isHost: boolean,
    difficulty: Difficulty
  ) => void;
  setRoomId: (roomId: string) => void;
  updateGamerList: (gamers: GamerInfo[]) => void;
  updateRoomStatus: (status: RoomStatus) => void;
  setMysteryPlayer: (player: MysteryPlayer) => void;
  addGuess: (gamerId: string, guess: Guess) => void;
  setWinner: (winner: string | null) => void;
  setSSEConnected: (connected: boolean) => void;
  setSSEError: (error: string | null) => void;
  reset: () => void;
}

export const useOnlineStore = customCreate<OnlineState>(set => ({
  gamerId: null,
  gamerName: null,
  sessionId: null,
  roomId: null,
  isHost: false,

  gamers: [],
  roomStatus: "pending" as RoomStatus,
  mysteryPlayer: null,

  guesses: new Map(),
  winner: null,
  isSSEConnected: false,
  sseError: null,
  difficulty: "all",

  initializeGamerId: () => {
    let storedId = localStorage.getItem("gamerId");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("gamerId", storedId);
    }
    set({ gamerId: storedId });
  },

  setGamerInfo: (gamerId, gamerName) => {
    set({ gamerId, gamerName });
  },

  setSessionInfo: (sessionId, roomId, isHost, difficulty) => {
    set({ sessionId, roomId, isHost, difficulty });
  },

  setRoomId: roomId => {
    set({ roomId, roomStatus: "waiting" });
  },

  updateGamerList: gamers => {
    set({ gamers });
  },

  updateRoomStatus: status => {
    set({ roomStatus: status });
  },

  setMysteryPlayer: (player: MysteryPlayer) => {
    set({ mysteryPlayer: player });
  },

  addGuess: (gamerId: string, guess: Guess) => {
    set(state => {
      const currentGuesses = state.guesses.get(gamerId) || [];
      const newGuesses = new Map(state.guesses);
      newGuesses.set(gamerId, [...currentGuesses, guess]);
      return { guesses: newGuesses };
    });
  },

  setWinner: (winner: string | null) => {
    set({ winner });
  },

  setSSEConnected: (connected: boolean) => {
    set({ isSSEConnected: connected });
  },

  setSSEError: (error: string | null) => {
    set({ sseError: error });
  },

  reset: () => {
    set({
      gamerId: null,
      gamerName: null,
      sessionId: null,
      roomId: null,
      isHost: false,
      gamers: [],
      roomStatus: "pending" as RoomStatus,
      mysteryPlayer: null,
      guesses: new Map(),
      winner: null,
      isSSEConnected: false,
      sseError: null,
      difficulty: "all",
    });
  },
}));
