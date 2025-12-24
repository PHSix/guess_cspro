import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import {
  createGuessRecord,
  getCurrentDiffcultyPlayers,
} from "@/lib/gameEngine";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { PlayerSearchInput } from "@/components/PlayerSearchInput";
import {
  compareGuess,
  getRandomPlayer,
  Guess,
  isCorrectGuess,
  Player,
} from "@shared/gameEngine";
import { GuessHistory } from "@/components/GuessHistory";

export default function GamePage() {
  const [, navigate] = useLocation();
  const { totalGuesses, fribergAutoGuess, difficulty } = useSettingsStore();
  const [answerPlayer, setAnswerPlayer] = useState<Player | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const currentPlayers = getCurrentDiffcultyPlayers();
  const inputRef = useRef<HTMLInputElement>(null);

  const [guessesRemaining, setGuessesRemaining] = useState(totalGuesses);

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  /**
   * 开始游戏
   */
  useEffect(() => {
    setIsLoading(true);
    const player = getRandomPlayer(currentPlayers);
    setAnswerPlayer(player);
    setGuesses([]);
    setGuessesRemaining(totalGuesses);
    setSearchQuery("");
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);

    // 如果开启了 friberg 自动猜测，则自动添加 friberg 的猜测
    if (fribergAutoGuess) {
      const players = getCurrentDiffcultyPlayers();
      if (players.length > 0) {
        const friberg = players.find(p =>
          p.proId.toLowerCase().includes("friberg")
        );
        if (friberg) {
          const result = compareGuess(friberg, player);
          const guessRecord = createGuessRecord(friberg, result);
          const newGuesses = [guessRecord];
          setGuesses(newGuesses);

          // 检查是否直接猜中
          if (isCorrectGuess(friberg, player)) {
            const winData = {
              isWon: true,
              guesses: newGuesses,
              answer: player,
            };
            navigate("/finished", { state: winData });
          } else if (newGuesses.length >= totalGuesses) {
            const loseData = {
              isWon: false,
              guesses: newGuesses,
              answer: player,
            };
            navigate("/finished", { state: loseData });
          } else {
            setGuessesRemaining(totalGuesses - newGuesses.length);
          }
        }
      }
    }
  }, [fribergAutoGuess]);

  /**
   * 猜测选手
   */
  const handleGuess = (player: Player) => {
    if (!answerPlayer) return;

    const result = compareGuess(player, answerPlayer);
    const guessRecord = createGuessRecord(player, result);

    const newGuesses = [...guesses, guessRecord];
    setGuesses(newGuesses);

    if (isCorrectGuess(player, answerPlayer)) {
      // 猜中，跳转到成功页面
      const winData = {
        isWon: true,
        guesses: newGuesses,
        answer: answerPlayer,
      };
      navigate("/finished", { state: winData });
    } else if (newGuesses.length >= totalGuesses) {
      // 用完次数，跳转到失败页面
      const loseData = {
        isWon: false,
        guesses: newGuesses,
        answer: answerPlayer,
      };
      navigate("/finished", { state: loseData });
    } else {
      // 没猜中但还有次数，继续游戏
      setGuessesRemaining(totalGuesses - newGuesses.length);
      setSearchQuery("");
    }
  };

  if (isLoading || !answerPlayer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background py-8">
      <div className="container max-w-3xl">
        <div className="mb-6 text-center relative">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <span className="glitch-text" data-text="弗一把">
              弗一把
            </span>
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoToSettings}
            className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        <Card className="px-3 md:px-6 py-6 neon-border space-y-4 flex flex-col-reverse md:flex-col">
          {/* 搜索输入框 */}
          <div>
            <div className="flex flex-row items-center gap-4 mb-4">
              <span className="text-xs font-mono text-muted-foreground">
                <span className="bracket">[</span>REMAINING
                <span className="bracket">]</span>
              </span>

              {/* 小球显示 */}
              <div className="flex flex-row gap-2">
                {Array.from({ length: totalGuesses }, (_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-2 h-2 rounded-full border-2 border-border bg-accent",
                      {
                        "bg-emerald-50": idx < totalGuesses - guessesRemaining,
                      }
                    )}
                  />
                ))}
              </div>
            </div>

            <PlayerSearchInput
              difficulty={difficulty}
              value={searchQuery}
              onChange={setSearchQuery}
              onSelectPlayer={handleGuess}
            />
          </div>

          <GuessHistory guesses={guesses} />
        </Card>
      </div>
    </div>
  );
}
