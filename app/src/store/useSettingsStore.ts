import { create } from 'zustand';

export type Difficulty = 'all' | 'normal' | 'ylg';

interface SettingsState {
  difficulty: Difficulty;
  totalGuesses: number;
  fribergAutoGuess: boolean;
  setDifficulty: (difficulty: Difficulty) => void;
  setTotalGuesses: (guesses: number) => void;
  setFribergAutoGuess: (enabled: boolean) => void;
  reset: () => void;
  initialize: () => void;
}

const DEFAULT_DIFFICULTY: Difficulty = 'normal';
const DEFAULT_TOTAL_GUESSES = 8;
const DEFAULT_FRIBERG_AUTO_GUESS = true;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  difficulty: DEFAULT_DIFFICULTY,
  totalGuesses: DEFAULT_TOTAL_GUESSES,
  fribergAutoGuess: DEFAULT_FRIBERG_AUTO_GUESS,

  setDifficulty: (difficulty) => {
    set({ difficulty });
    localStorage.setItem('game-difficulty', difficulty);
  },

  setTotalGuesses: (guesses) => {
    const validGuesses = Math.max(1, Math.min(20, guesses));
    set({ totalGuesses: validGuesses });
    localStorage.setItem('game-total-guesses', validGuesses.toString());
  },

  setFribergAutoGuess: (enabled) => {
    set({ fribergAutoGuess: enabled });
    localStorage.setItem('game-friberg-auto-guess', enabled.toString());
  },

  reset: () => {
    set({
      difficulty: DEFAULT_DIFFICULTY,
      totalGuesses: DEFAULT_TOTAL_GUESSES,
      fribergAutoGuess: DEFAULT_FRIBERG_AUTO_GUESS,
    });
    localStorage.removeItem('game-difficulty');
    localStorage.removeItem('game-total-guesses');
    localStorage.removeItem('game-friberg-auto-guess');
  },

  initialize: () => {
    try {
      const savedDifficulty = localStorage.getItem('game-difficulty') as Difficulty;
      const savedTotalGuesses = localStorage.getItem('game-total-guesses');
      const savedFribergAutoGuess = localStorage.getItem('game-friberg-auto-guess');

      let newDifficulty = get().difficulty;
      let newTotalGuesses = get().totalGuesses;
      let newFribergAutoGuess = get().fribergAutoGuess;

      if (savedDifficulty && ['all', 'normal', 'ylg'].includes(savedDifficulty)) {
        newDifficulty = savedDifficulty;
      }

      if (savedTotalGuesses) {
        const parsed = parseInt(savedTotalGuesses);
        if (parsed >= 1 && parsed <= 20) {
          newTotalGuesses = parsed;
        }
      }

      if (savedFribergAutoGuess !== null) {
        newFribergAutoGuess = savedFribergAutoGuess === 'true';
      }

      set({
        difficulty: newDifficulty,
        totalGuesses: newTotalGuesses,
        fribergAutoGuess: newFribergAutoGuess,
      });
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  },
}));
