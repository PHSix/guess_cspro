import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation } from "wouter";
import type { GamerInfo } from "@/types";
import { PlayerSearchInput } from "@/components/PlayerSearchInput";
import { GuessHistory } from "@/components/GuessHistory";
import { useSSEConnection } from "@/hooks/useSSEConnection";
import { useOnlineStore } from "@/store/useOnlineStore";
import { getCountryChinese } from "@shared/countryUtils";
import { Copy } from "lucide-react";
import { Player } from "@shared/gameEngine";

export default function OnlineRoomPage() {
  const [, navigate] = useLocation();

  const {
    gamerId: myGamerId,
    isHost,
    roomId,
    initializeGamerId,
    gamers,
    guesses,
    roomStatus,
    mysteryPlayer,
    winner,
    isSSEConnected,
    reset,
    difficulty,
  } = useOnlineStore();

  const { sendAction } = useSSEConnection();

  const [searchQuery, setSearchQuery] = useState("");
  const isReady = useMemo(
    () => gamers.find(g => g.gamerId === myGamerId)?.ready,
    [gamers, myGamerId]
  );

  const myGuesses = myGamerId ? guesses.get(myGamerId) || [] : [];

  useLayoutEffect(() => {
    if (!roomId) {
      toast.error("未找到房间，返回大厅");
      navigate("/online");
    }

    return () => {
      // reset store state
      reset();
    };
  }, [roomId]);

  useEffect(() => {
    initializeGamerId();
  }, []);

  const handleSubmitGuess = async (player: Player) => {
    if (roomStatus !== "inProgress" || !myGamerId) return;

    try {
      await sendAction("/room/action", { guess: player.proId });
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to submit guess:", error);
      toast.error("Failed to submit guess");
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await sendAction("/room/leave", {});
      navigate("/online");
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

  const canStartGame =
    isHost &&
    roomStatus === "waiting" &&
    gamers.every(it => (it.gamerId === myGamerId ? true : it.ready));

  return (
    <div className="bg-background min-h-screen py-8 px-4">
      <div className="container max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            <span className="glitch-text" data-text="Room">
              Room
            </span>
          </h1>
          {roomStatus === "waiting" && (
            <p className="text-sm text-muted-foreground/50 flex gap-2 justify-center">
              Room ID: {roomId || "Connecting..."}
              <Copy
                className="w-4 h-4 hover:text-foreground cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(roomId || "");
                  toast.success("Copied to clipboard");
                }}
              />
            </p>
          )}
        </div>

        {/* 房间等待状态 */}
        {roomStatus === "waiting" && (
          <Card className="p-6 neon-border">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground"></h2>
                <Badge className="ml-2">{gamers.length}/3</Badge>
              </div>

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
                        <div className="shrink-0">
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

                        {isHost && gamer.gamerId !== myGamerId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const name = gamer.gamerName;
                              toast.success(`Kicked ${name}`);
                            }}
                            className="text-destructive hover:text-destructive/80"
                          >
                            踢出去
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 开始游戏按钮（仅房主） */}
              <div className="flex justify-center mt-6">
                {isHost ? (
                  // 房主
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
                    开始游戏
                  </Button>
                ) : (
                  // 准备按钮，非房主
                  <Button
                    onClick={async () => {
                      sendAction("/room/ready", {
                        ready: !isReady,
                      });
                    }}
                    className={
                      isReady
                        ? "bg-red-700 text-muted-foreground hover:bg-muted/90 w-full"
                        : "bg-accent text-accent-foreground hover:bg-accent/90 neon-border w-full"
                    }
                    size={"lg"}
                  >
                    {isReady ? "取消准备" : "准备"}
                  </Button>
                )}
              </div>

              {/* 离开房间按钮 */}
              <Button
                onClick={handleLeaveRoom}
                variant="outline"
                className="w-full neon-border border-border text-foreground hover:bg-accent/10 mt-4"
              >
                离开房间
              </Button>
            </div>
          </Card>
        )}

        {/* 游戏进行状态 */}
        {roomStatus === "inProgress" && (
          <div className="space-y-6">
            {/* 搜索框 */}
            <PlayerSearchInput
              difficulty={difficulty}
              value={searchQuery}
              onChange={setSearchQuery}
              onSelectPlayer={handleSubmitGuess}
            />

            {/* 我的猜测历史 */}
            <GuessHistory guesses={myGuesses} />
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
                      onClick={() => navigate("/online")}
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
      </div>
    </div>
  );
}
