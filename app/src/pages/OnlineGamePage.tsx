import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import type { Mask, MatchType, Guess } from "@/types/multiplayer.js";
import type { Player } from "@/lib/gameEngine.js";
import { searchPlayers } from "@/lib/gameEngine.js";
import { useSSEConnection } from "@/hooks/useSSEConnection.js";
import { useMultiplayerStore } from "@/store/useMultiplayerStore.js";
import type { GamerInfo } from "@/types/multiplayer.js";
import { getCountryFlag, getCountryChinese } from "@shared/countryUtils.js";

function getMatchClass(match: MatchType): string {
  switch (match) {
    case "M":
      return "text-green-400 font-bold bg-green-700/20";
    case "N":
      return "text-yellow-400 font-bold bg-yellow-700/20";
    case "D":
      return "text-red-400";
    default:
      return "";
  }
}

function getMatchSymbol(match: MatchType): string {
  switch (match) {
    case "M":
      return "✓";
    case "N":
      return "≈";
    case "D":
      return "✗";
    default:
      return "?";
  }
}

export default function OnlineGamePage() {
  const [, setLocation] = useLocation();

  const { initializeGamerId } = useMultiplayerStore(state => state);
  const myGamerId = useMultiplayerStore(state => state.gamerId);

  const {
    gamers,
    guesses,
    roomStatus,
    mysteryPlayer,
    winner,
    isSSEConnected,
    sendAction,
  } = useSSEConnection();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const myGuesses = myGamerId ? guesses.get(myGamerId) || [] : [];

  useEffect(() => {
    if (roomStatus === "inProgress" && mysteryPlayer) {
      inputRef.current?.focus();
    }
  }, [roomStatus, mysteryPlayer]);

  useEffect(() => {
    initializeGamerId();
  }, []);

  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleFocus = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      const newIndex =
        highlightedIndex < searchResults.length - 1
          ? highlightedIndex + 1
          : highlightedIndex;
      setHighlightedIndex(newIndex);
    } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      const newIndex = highlightedIndex > 0 ? highlightedIndex - 1 : 0;
      setHighlightedIndex(newIndex);
    } else if (
      e.key === "Enter" ||
      e.key === "Go" ||
      e.key === "Search" ||
      e.key === "Done"
    ) {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[highlightedIndex]) {
        handleSubmitGuess(searchResults[highlightedIndex]);
      }
    }
  };

  const handleSubmitGuess = async (player: Player) => {
    if (roomStatus !== "inProgress" || !myGamerId) return;

    try {
      await sendAction("/room/action", { guess: player.playerName });
      setSearchQuery("");
      setSearchResults([]);
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to submit guess:", error);
      toast.error("Failed to submit guess");
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await sendAction("/room/leave", {});
      useMultiplayerStore.getState().reset();
      setLocation("/multiplayer");
      toast.success("Left room");
    } catch (error) {
      console.error("Failed to leave room:", error);
      toast.error("Failed to leave room");
    }
  };

  if (!isSSEConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin mx-auto text-accent mb-4" />
          <h2 className="text-xl font-bold text-foreground">
            Connecting to room...
          </h2>
        </div>
      </div>
    );
  }

  const isAllReady =
    roomStatus === "ready" || (roomStatus === "waiting" && gamers.length >= 2);

  return (
    <div className="bg-background min-h-screen py-8 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-foreground">
            <span className="glitch-text" data-text="Game">
              Game
            </span>
          </h1>
          <Button
            onClick={handleLeaveRoom}
            variant="outline"
            className="neon-border border-border text-foreground hover:bg-accent/10"
          >
            Leave Room
          </Button>
        </div>

        {roomStatus === "inProgress" && (
          <div className="space-y-6">
            <div className="relative mb-6">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search player name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onFocus={handleFocus}
                className="bg-input text-foreground border-border pr-20"
                autoComplete="off"
              />

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 max-h-80 overflow-y-auto border border-border bg-card shadow-lg rounded-lg">
                  {searchResults.map((player, idx) => (
                    <button
                      key={player.id}
                      data-search-index={idx}
                      onPointerDown={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleSubmitGuess(player);
                      }}
                      className={`w-full text-left px-4 py-2 border-b border-border/50 last:border-b-0 transition-colors ${
                        idx === highlightedIndex
                          ? "bg-accent/20 text-accent-foreground"
                          : "hover:bg-accent/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-foreground">
                          {player.playerName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* My Guesses */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                My Guesses ({myGuesses.length}/8)
              </h2>
            </div>

            {myGuesses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No guesses yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myGuesses.map((guess: Guess, idx: number) => (
                  <div
                    key={`${myGamerId}-${idx}`}
                    className="grid grid-cols-6 gap-2 text-sm"
                  >
                    <div>Player</div>
                    <div>Team</div>
                    <div>Country</div>
                    <div>Age</div>
                    <div>Majors</div>
                    <div>Role</div>
                    <div className="col-span-2 text-center">
                      <div className="font-semibold text-foreground">
                        {guess.playerName}
                      </div>
                    </div>
                    <div className="text-muted-foreground">{guess.team}</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-muted-foreground ${getMatchClass(guess.mask.country)}`}
                      >
                        {getCountryChinese(guess.country)}
                      </span>
                      <span
                        className={`text-xl ${getMatchClass(guess.mask.country)}`}
                      >
                        {getMatchSymbol(guess.mask.country)}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1 ${getMatchClass(guess.mask.birthYear)}`}
                    >
                      <span
                        className={`text-xl ${getMatchClass(guess.mask.birthYear)}`}
                      >
                        {getMatchSymbol(guess.mask.birthYear)}
                      </span>
                      <span
                        className={`text-sm text-muted-foreground ${getMatchClass(guess.mask.birthYear)}`}
                      >
                        {guess.age}岁
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1 ${getMatchClass(guess.mask.majorsPlayed)}`}
                    >
                      <span
                        className={`text-xl ${getMatchClass(guess.mask.majorsPlayed)}`}
                      >
                        {getMatchSymbol(guess.mask.majorsPlayed)}
                      </span>
                      <span
                        className={`text-sm text-muted-foreground ${getMatchClass(guess.mask.majorsPlayed)}`}
                      >
                        {guess.majorMaps}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1 ${getMatchClass(guess.mask.role)}`}
                    >
                      <span
                        className={`text-xl ${getMatchClass(guess.mask.role)}`}
                      >
                        {getMatchSymbol(guess.mask.role)}
                      </span>
                      <span
                        className={`text-sm text-muted-foreground ${getMatchClass(guess.mask.role)}`}
                      >
                        {guess.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Game Ended */}
        {roomStatus === "ended" && (
          <div className="mt-8 text-center space-y-6">
            <Card className="p-8 neon-border">
              {winner && (
                <>
                  <div className="text-6xl font-bold text-foreground mb-4">
                    <span className="glitch-text" data-text="You Won">
                      You Won!
                    </span>
                  </div>
                  <p className="text-2xl text-foreground mb-4">
                    🎉 Congratulations!
                  </p>
                  <p className="text-lg text-muted-foreground mb-4">
                    {winner === myGamerId
                      ? "You correctly guessed the mystery player!"
                      : `${winner} won the game!`}
                  </p>
                </>
              )}

              {mysteryPlayer && (
                <div className="p-4 border border-border rounded-lg bg-card">
                  <div className="text-center font-mono text-sm text-muted-foreground mb-2">
                    <span className="bracket">[</span>
                    MYSTERY PLAYER GENERATED
                    <span className="bracket">]</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Player:
                      </span>
                      <span className="text-foreground font-semibold">
                        {mysteryPlayer.playerName}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Team:
                      </span>
                      <span className="text-foreground">
                        {mysteryPlayer.team}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Country:
                      </span>
                      <span className="text-foreground">
                        {getCountryChinese(mysteryPlayer.country)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Age:
                      </span>
                      <span className="text-foreground">
                        {new Date().getFullYear() - mysteryPlayer.birthYear}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Majors:
                      </span>
                      <span className="text-foreground">
                        {mysteryPlayer.majorsPlayed}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Role:
                      </span>
                      <span className="text-foreground">
                        {mysteryPlayer.role}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 space-y-4">
                <Button
                  onClick={() => setLocation("/room")}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 neon-border w-full"
                  size="lg"
                >
                  Play Again
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
