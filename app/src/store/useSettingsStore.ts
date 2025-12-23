import { create } from "zustand";

export type Difficulty = "all" | "normal" | "ylg";

// Generate random username
function generateRandomUsername(): string {
  const adjectives = [
    "Happy",
    "Cool",
    "Swift",
    "Brave",
    "Clever",
    "Epic",
    "Lucky",
    "Mighty",
  ];
  const nouns = [
    "Tiger",
    "Dragon",
    "Phoenix",
    "Wolf",
    "Bear",
    "Eagle",
    "Lion",
    "Panther",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

interface SettingsState {
  difficulty: Difficulty;
  totalGuesses: number;
  fribergAutoGuess: boolean;
  username: string;
  isOnlineModeAvailable: boolean;
  setDifficulty: (difficulty: Difficulty) => void;
  setTotalGuesses: (guesses: number) => void;
  setFribergAutoGuess: (enabled: boolean) => void;
  setUsername: (username: string) => void;
  setOnlineModeAvailable: (available: boolean) => void;
  reset: () => void;
  initialize: () => void;
}

const DEFAULT_DIFFICULTY: Difficulty = "normal";
const DEFAULT_TOTAL_GUESSES = 8;
const DEFAULT_FRIBERG_AUTO_GUESS = true;
const DEFAULT_USERNAME = generateRandomUsername();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  difficulty: DEFAULT_DIFFICULTY,
  totalGuesses: DEFAULT_TOTAL_GUESSES,
  fribergAutoGuess: DEFAULT_FRIBERG_AUTO_GUESS,
  username: DEFAULT_USERNAME,
  isOnlineModeAvailable: false,

  setDifficulty: difficulty => {
    set({ difficulty });
    localStorage.setItem("game-difficulty", difficulty);
  },

  setTotalGuesses: guesses => {
    const validGuesses = Math.max(1, Math.min(20, guesses));
    set({ totalGuesses: validGuesses });
    localStorage.setItem("game-total-guesses", validGuesses.toString());
  },

  setFribergAutoGuess: enabled => {
    set({ fribergAutoGuess: enabled });
    localStorage.setItem("game-friberg-auto-guess", enabled.toString());
  },

  setUsername: username => {
    // Max length is 20
    const trimmed = username.trim().slice(0, 20);
    set({ username: trimmed });
    localStorage.setItem("game-username", trimmed);
  },

  setOnlineModeAvailable: available => {
    set({ isOnlineModeAvailable: available });
  },

  reset: () => {
    const newUsername = generateRandomUsername();
    set({
      difficulty: DEFAULT_DIFFICULTY,
      totalGuesses: DEFAULT_TOTAL_GUESSES,
      fribergAutoGuess: DEFAULT_FRIBERG_AUTO_GUESS,
      username: newUsername,
    });
    localStorage.removeItem("game-difficulty");
    localStorage.removeItem("game-total-guesses");
    localStorage.removeItem("game-friberg-auto-guess");
    localStorage.removeItem("game-username");
  },

  initialize: () => {
    try {
      const savedDifficulty = localStorage.getItem(
        "game-difficulty"
      ) as Difficulty;
      const savedTotalGuesses = localStorage.getItem("game-total-guesses");
      const savedFribergAutoGuess = localStorage.getItem(
        "game-friberg-auto-guess"
      );
      const savedUsername = localStorage.getItem("game-username");

      let newDifficulty = get().difficulty;
      let newTotalGuesses = get().totalGuesses;
      let newFribergAutoGuess = get().fribergAutoGuess;
      let newUsername = get().username;

      if (
        savedDifficulty &&
        ["all", "normal", "ylg"].includes(savedDifficulty)
      ) {
        newDifficulty = savedDifficulty;
      }

      if (savedTotalGuesses) {
        const parsed = parseInt(savedTotalGuesses);
        if (parsed >= 1 && parsed <= 20) {
          newTotalGuesses = parsed;
        }
      }

      if (savedFribergAutoGuess !== null) {
        newFribergAutoGuess = savedFribergAutoGuess === "true";
      }

      if (savedUsername && savedUsername.trim().length > 0) {
        newUsername = savedUsername.trim().slice(0, 20);
      }

      set({
        difficulty: newDifficulty,
        totalGuesses: newTotalGuesses,
        fribergAutoGuess: newFribergAutoGuess,
        username: newUsername,
      });
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    }
  },
}));
