import PLAYERS from "../data/all_players_data.json" with { type: "json" };
import type { ServerPlayerData, MysteryPlayer } from "./PlayerData";

export function getMysteryPlayers(): MysteryPlayer[] {
  const playersData = PLAYERS as unknown as ServerPlayerData;
  return Object.entries(playersData).map(([key, data]) => ({
    id: key,
    playerName: key,
    team: data.team || "Unknown",
    country: data.country || "Unknown",
    birthYear: data.birth_year || 2000,
    majorsPlayed: data.majorsPlayed || 0,
    role: (data.role || "Unknown") as "AWPer" | "Rifler" | "Unknown",
  }));
}

export function findPlayerByName(name: string): MysteryPlayer | undefined {
  const players = getMysteryPlayers();
  return players.find(p => p.playerName.toLowerCase() === name.toLowerCase());
}
