export interface MysteryPlayer {
  id: string;
  playerName: string;
  team: string;
  country: string;
  birthYear: number;
  majorsPlayed: number;
  role: "AWPer" | "Rifler" | "Unknown";
}

export interface ServerPlayerData {
  [key: string]: {
    team: string;
    country: string;
    birth_year: number;
    majorsPlayed: number;
    role: string;
  };
}

export interface Mask {
  playerName: MatchType;
  team: MatchType;
  country: MatchType;
  birthYear: MatchType;
  majorsPlayed: MatchType;
  role: MatchType;
}

export type MatchType = "M" | "N" | "D";

export interface Guess {
  guessId: string;
  mask: Mask;
}

export interface GamerState {
  gamerId: string;
  gamerName: string;
  ready: boolean;
  joinedAt: Date;
  guessesLeft: number;
  guesses: Guess[];
}
