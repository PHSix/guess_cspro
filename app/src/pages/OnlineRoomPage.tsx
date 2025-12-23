import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import type { MatchType, Guess } from "@/types/multiplayer.js";
import type { Player } from "@/lib/gameEngine.js";
import { searchPlayers } from "@/lib/gameEngine.js";
import { useSSEConnection } from "@/hooks/useSSEConnection.js";
import { useMultiplayerStore } from "@/store/useMultiplayerStore.js";
import type { GamerInfo } from "@/types/multiplayer.js";
import { getCountryChinese } from "@shared/countryUtils.js";

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

export default function OnlineRoomPage() {
  const [, setLocation] = useLocation();

  const {
    gamerId: myGamerId,
    isHost,
    roomId,
    initializeGamerId,
  } = useMultiplayerStore(state => state);

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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setHighlightedIndex(0);
      return;
    }

    const results = searchPlayers(searchQuery).slice(0, 20);
    setSearchResults(results);
    setHighlightedIndex(0);
    setShowDropdown(results.length > 0);
  }, [searchQuery]);

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
      setHighlightedIndex(0);
    } catch (error) {
      console.error("Failed to submit guess:", error);
      toast.error("Failed to submit guess");
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await sendAction("/room/leave", {});
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
    roomStatus === "ready" || (roomStatus === "waiting" && gamers.length >= 3);
  const canStartGame = isHost && isAllReady;

  return (
    <div className="bg-background min-h-screen py-8 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            <span className="glitch-text" data-text="Room">
              Room
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Room ID: {roomId || "Connecting..."}
          </p>
        </div>

        {/* 房间等待状态 */}
        {(roomStatus === "waiting" ||
          roomStatus === "ready" ||
          roomStatus === "inProgress") && (
          <Card className="p-6 neon-border">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  <span className="glitch-text" data-text="Waiting">
                    Waiting
                  </span>
                </h2>
                <Badge className="ml-2">{gamers.length}/3</Badge>
              </div>

              {/* 显示神秘玩家 */}
              {roomStatus === "ready" && (
                <div className="text-center py-8 border border-border rounded-lg bg-card">
                  <p className="text-center text-accent font-mono text-sm">
                    <span className="bracket">[</span>
                    MYSTERY PLAYER GENERATED
                    <span className="bracket">]</span>
                  </p>
                </div>
              )}

              {/* 玩家列表 */}
              <div className="space-y-3">
                {gamers.map((gamer: GamerInfo) => {
                  const isReady = gamer.ready;

                  return (
                    <div
                      key={gamer.gamerId}
                      className={`flex items-center justify-between p-3 border border-border rounded-lg bg-card transition-colors ${
                        isReady ? "bg-green-500/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">
                          <div className="text-sm font-semibold text-foreground">
                            {gamer.gamerName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {gamer.joinedAt.toLocaleTimeString()}
                          </div>
                        </div>

                        <Badge
                          variant={isReady ? "outline" : "default"}
                          className={
                            isReady
                              ? "bg-green-500/20 text-green-400 border-green-500/50"
                              : "bg-muted text-muted-foreground border-border/50"
                          }
                        >
                          {isReady ? "Ready" : "Waiting"}
                        </Badge>

                        {isHost && gamer.gamerId === myGamerId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const name = gamer.gamerName;
                              toast.success(`Kicked ${name}`);
                            }}
                            className="text-destructive hover:text-destructive/80"
                          >
                            Kick
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 开始游戏按钮（仅房主） */}
              {isHost && isAllReady && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={async () => {
                      try {
                        await sendAction("/room/start", {});
                        toast.success("Game starting...");
                      } catch (error) {
                        console.error("Failed to start game:", error);
                        toast.error("Failed to start game");
                      }
                    }}
                    disabled={!canStartGame}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 neon-border w-full"
                    size="lg"
                  >
                    Start Game
                  </Button>
                </div>
              )}

              {/* 离开房间按钮 */}
              <Button
                onClick={handleLeaveRoom}
                variant="outline"
                className="w-full neon-border border-border text-foreground hover:bg-accent/10 mt-4"
              >
                Leave Room
              </Button>
            </div>
          </Card>
        )}

        {/* 游戏进行状态 */}
        {roomStatus === "inProgress" && (
          <div className="space-y-6">
            {/* 搜索框 */}
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

            {/* 我的猜测历史 */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
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
                    <div className="text-muted-foreground">Player</div>
                    <div className="text-muted-foreground">Team</div>
                    <div className="text-muted-foreground">Country</div>
                    <div className="text-muted-foreground">Age</div>
                    <div className="text-muted-foreground">Majors</div>
                    <div className="text-muted-foreground">Role</div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`font-semibold ${getMatchClass(guess.mask.playerName)}`}
                      >
                        {guess.playerName}
                      </div>
                      <div
                        className={`text-xl ${getMatchClass(guess.mask.playerName)}`}
                      >
                        {getMatchSymbol(guess.mask.playerName)}
                      </div>
                    </div>

                    <div
                      className={`text-muted-foreground ${getMatchClass(guess.mask.team)}`}
                    >
                      {guess.team}
                    </div>

                    <div
                      className={`flex items-center gap-1 ${getMatchClass(guess.mask.country)}`}
                    >
                      <span
                        className={`text-xl ${getMatchClass(guess.mask.country)}`}
                      >
                        {getMatchSymbol(guess.mask.country)}
                      </span>
                      <span
                        className={`text-sm ${getMatchClass(guess.mask.country)}`}
                      >
                        {getCountryChinese(guess.country)}
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
                    </div>
                    <div
                      className={`text-sm text-muted-foreground ${getMatchClass(guess.mask.birthYear)}`}
                    >
                      {guess.age}岁
                    </div>

                    <div
                      className={`flex items-center gap-1 ${getMatchClass(guess.mask.majorsPlayed)}`}
                    >
                      <span
                        className={`text-xl ${getMatchClass(guess.mask.majorsPlayed)}`}
                      >
                        {getMatchSymbol(guess.mask.majorsPlayed)}
                      </span>
                    </div>
                    <div
                      className={`text-sm text-muted-foreground ${getMatchClass(guess.mask.majorsPlayed)}`}
                    >
                      {guess.majorMaps}
                    </div>

                    <div
                      className={`flex items-center gap-1 ${getMatchClass(guess.mask.role)}`}
                    >
                      <span
                        className={`text-xl ${getMatchClass(guess.mask.role)}`}
                      >
                        {getMatchSymbol(guess.mask.role)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 游戏结束 */}
        {roomStatus === "ended" && (
          <div className="mt-8 text-center space-y-6">
            <Card className="p-8 neon-border">
              {winner ? (
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
              ) : (
                <>
                  <div className="text-6xl font-bold text-foreground mb-4">
                    <span className="glitch-text" data-text="Game Over">
                      Game Over
                    </span>
                  </div>
                  <p className="text-lg text-muted-foreground mb-4">
                    The mystery player was:
                  </p>
                  <div className="p-4 border border-border rounded-lg bg-card">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-semibold">
                          {mysteryPlayer?.playerName}
                        </span>
                        <span className="text-muted-foreground mx-2">
                          - {mysteryPlayer?.team}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground mx-2">
                          {mysteryPlayer
                            ? getCountryChinese(mysteryPlayer.country)
                            : ""}
                        </span>
                        <span className="text-muted-foreground">
                          -{" "}
                          {mysteryPlayer
                            ? new Date().getFullYear() - mysteryPlayer.birthYear
                            : 0}
                          岁
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground mx-2">
                          {mysteryPlayer?.majorsPlayed} Majors
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground mx-2">
                          {mysteryPlayer?.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <Button
                      onClick={() => setLocation("/multiplayer")}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 neon-border w-full"
                      size="lg"
                    >
                      Play Again
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* 离开房间按钮 */}
        {roomStatus !== "ended" && roomStatus !== "inProgress" && (
          <div className="mt-6">
            <Button
              onClick={handleLeaveRoom}
              variant="outline"
              className="w-full neon-border border-border text-foreground hover:bg-accent/10"
            >
              Leave Room
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
