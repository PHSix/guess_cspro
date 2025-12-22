import { create } from 'zustand';

export type Difficulty = 'all' | 'normal' | 'ylg';

interface SettingsState {
  difficulty: Difficulty;
  totalGuesses: number;
  setDifficulty: (difficulty: Difficulty) => void;
  setTotalGuesses: (guesses: number) => void;
  reset: () => void;
  initialize: () => void;
}

const DEFAULT_DIFFICULTY: Difficulty = 'normal';
const DEFAULT_TOTAL_GUESSES = 8;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  difficulty: DEFAULT_DIFFICULTY,
  totalGuesses: DEFAULT_TOTAL_GUESSES,

  setDifficulty: (difficulty) => {
    set({ difficulty });
    localStorage.setItem('game-difficulty', difficulty);
  },

  setTotalGuesses: (guesses) => {
    const validGuesses = Math.max(1, Math.min(20, guesses));
    set({ totalGuesses: validGuesses });
    localStorage.setItem('game-total-guesses', validGuesses.toString());
  },

  reset: () => {
    set({
      difficulty: DEFAULT_DIFFICULTY,
      totalGuesses: DEFAULT_TOTAL_GUESSES,
    });
    localStorage.removeItem('game-difficulty');
    localStorage.removeItem('game-total-guesses');
  },

  initialize: () => {
    try {
      const savedDifficulty = localStorage.getItem('game-difficulty') as Difficulty;
      const savedTotalGuesses = localStorage.getItem('game-total-guesses');

      let newDifficulty = get().difficulty;
      let newTotalGuesses = get().totalGuesses;

      if (savedDifficulty && ['all', 'normal', 'ylg'].includes(savedDifficulty)) {
        newDifficulty = savedDifficulty;
      }

      if (savedTotalGuesses) {
        const parsed = parseInt(savedTotalGuesses);
        if (parsed >= 1 && parsed <= 20) {
          newTotalGuesses = parsed;
        }
      }

      set({
        difficulty: newDifficulty,
        totalGuesses: newTotalGuesses,
      });
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  },
}));
