import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect, useMemo, useEffectEvent } from "react";
import { getCountryFlag } from "@shared/countryUtils";
import type { Player, Guess } from "@/lib/gameEngine";
import Confetti from "@/components/Confetti";

interface FinishData {
  isWon: boolean;
  guesses: Guess[];
  answer: Player;
}

export default function FinishedPage() {
  const [, navigate] = useLocation();
  const finishData = useMemo<FinishData | null>(() => {
    // 从 history state 中获取数据
    const stateData = history.state as FinishData | null;

    return stateData;
  }, []);

  console.log("finished", finishData);

  const handlePlayAgain = useEffectEvent(() => {
    navigate("/game");
  });

  const handleBackToHome = useEffectEvent(() => {
    navigate("/");
  });

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePlayAgain();
    }
  });

  useEffect(() => {
    if (!finishData) {
      // 如果没有数据，返回首页
      navigate("/");
    }

    window.addEventListener("keypress", handleKeyDown);
    return () => window.removeEventListener("keypress", handleKeyDown);
  }, [finishData, handleKeyDown]);

  if (!finishData) {
    return null;
  }

  const { isWon, guesses, answer } = finishData;

  return (
    <>
      {isWon && <Confetti isVisible={isWon} duration={3000} />}
      <div className="min-h-screen bg-background py-8 items-center flex">
        <div className="container max-w-2xl">
          <Card className="p-8 neon-border space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">
                {isWon ? (
                  <span className="text-green-400">
                    <span className="bracket">[</span>SUCCESS
                    <span className="bracket">]</span>
                  </span>
                ) : (
                  <span className="text-red-400">
                    <span className="bracket">[</span>FAILED
                    <span className="bracket">]</span>
                  </span>
                )}
              </h2>
              <p className="text-muted-foreground">
                {isWon
                  ? `恭喜！你用了 ${guesses.length} 次猜测猜出答案`
                  : `很遗憾，你用了 ${guesses.length} 次猜测都没有猜出答案`}
              </p>
            </div>

            {answer && (
              <div className="bg-card/50 p-4 rounded border border-accent/30 space-y-3">
                <div className="text-sm font-mono text-muted-foreground">
                  <span className="bracket">[</span>ANSWER
                  <span className="bracket">]</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">名字:</span>
                    <div className="font-semibold text-accent">
                      {answer.playerName}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">队伍:</span>
                    <div className="font-semibold">{answer.team}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">国家:</span>
                    <div className="font-semibold">
                      {getCountryFlag(answer.country)} {answer.country}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">年龄:</span>
                    <div className="font-semibold">
                      {new Date().getFullYear() - answer.birthYear}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Major:</span>
                    <div className="font-semibold">{answer.major}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">角色:</span>
                    <div className="font-semibold">{answer.role}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handlePlayAgain}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 neon-border"
                size="lg"
              >
                ▶ ENTER 键再来一把
              </Button>
              <Button
                onClick={handleBackToHome}
                variant="outline"
                className="w-full"
                size="lg"
              >
                返回首页
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                或点击按钮重新开始
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
