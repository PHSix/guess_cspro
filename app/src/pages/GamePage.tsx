import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import {
  searchPlayers,
  getRandomPlayer,
  comparePlayerAttributes,
  isCorrectGuess,
  createGuessRecord,
  type Player,
  type GameEngineGuess,
  MatchType,
} from "@/lib/gameEngine";
import { getCountryFlag, getCountryChinese } from "@shared/countryUtils";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { PlayerSearchInput } from "@/components/PlayerSearchInput";

function getMatchSymbol(match: MatchType): string {
  switch (match) {
    case MatchType.Exact:
      return "✓";
    case MatchType.Near:
      return "≈";
    case MatchType.Different:
      return "✗";
    case MatchType.Greater:
      return "↑";
    case MatchType.Less:
      return "↓";
    default:
      return "?";
  }
}

function getMatchClass(match: MatchType): string {
  switch (match) {
    case MatchType.Exact:
      return "text-green-400 font-bold bg-green-700";
    case MatchType.Near:
    case MatchType.Greater:
    case MatchType.Less:
      return "text-yellow-400 font-bold bg-yellow-700";
    case MatchType.Different:
      return "text-red-400";
    default:
      return "";
  }
}

interface CompareResult {
  value: string | number;
  valueClass?: string;
  class?: string;
  prefix?: string;
  symbol?: string;
}

function getCompareResults(record: GameEngineGuess): CompareResult[] {
  function wrapGetMatchClass(type: MatchType) {
    return `${getMatchClass(type)}`;
  }

  return [
    {
      value: record.playerName,
    },
    {
      value: record.team,
      class: wrapGetMatchClass(record.result.teamMatch),
      symbol: getMatchSymbol(record.result.teamMatch),
    },
    {
      // 国家图标
      prefix: getCountryFlag(record.country),
      // 国家名称
      value: getCountryChinese(record.country),
      valueClass: "hidden md:block",
      class: wrapGetMatchClass(record.result.countryMatch),
      symbol: getMatchSymbol(record.result.countryMatch),
    },
    {
      value: record.age,
      class: wrapGetMatchClass(record.result.ageMatch),
      symbol: getMatchSymbol(record.result.ageMatch),
    },
    {
      value: record.majorMaps,
      class: wrapGetMatchClass(record.result.majorMapsMatch),
      symbol: getMatchSymbol(record.result.majorMapsMatch),
    },
    {
      value: record.role,
      class: wrapGetMatchClass(record.result.roleMatch),
      symbol: getMatchSymbol(record.result.roleMatch),
    },
  ];
}

interface GuessWithCompareResult extends GameEngineGuess {
  compareResults: CompareResult[];
}

export default function GamePage() {
  const [, navigate] = useLocation();
  const { totalGuesses, fribergAutoGuess } = useSettingsStore();
  const [answerPlayer, setAnswerPlayer] = useState<Player | null>(null);
  const [guesses, setGuesses] = useState<GuessWithCompareResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    const player = getRandomPlayer();
    setAnswerPlayer(player);
    console.log(player);
    setGuesses([]);
    setGuessesRemaining(totalGuesses);
    setSearchQuery("");
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);

    // 如果开启了 friberg 自动猜测，则自动添加 friberg 的猜测
    if (fribergAutoGuess) {
      const players = searchPlayers("friberg");
      if (players.length > 0) {
        const friberg = players.find(p =>
          p.playerName.toLowerCase().includes("friberg")
        );
        if (friberg) {
          const result = comparePlayerAttributes(friberg, player);
          const guessRecord = createGuessRecord(friberg, result);
          const newGuesses = [
            ...[],
            { ...guessRecord, compareResults: getCompareResults(guessRecord) },
          ];
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

    const result = comparePlayerAttributes(player, answerPlayer);
    const guessRecord = createGuessRecord(player, result);

    const newGuesses = [
      ...guesses,
      { ...guessRecord, compareResults: getCompareResults(guessRecord) },
    ];
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
              value={searchQuery}
              onChange={setSearchQuery}
              onSelectPlayer={handleGuess}
            />
          </div>

          {/* 猜测历史表格 */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-muted-foreground">
              <span className="bracket">[</span>HISTORY
              <span className="bracket">]</span>
            </div>

            {/* 统一横向表格 */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>选手</th>
                    <th>队伍</th>
                    <th>国家</th>
                    <th>年龄</th>
                    <th>Major</th>
                    <th>角色</th>
                  </tr>
                </thead>
                <tbody>
                  {/* map 猜测历史表格 */}
                  {guesses.map((guess, idx) => (
                    <tr key={idx} className="body-row">
                      {/* 所有属性数据的对比结果 */}
                      {guess.compareResults.map((result, idx) => (
                        <td key={idx}>
                          <div className={`cell ${result.class}`}>
                            <span className="prefix">{result.prefix}</span>
                            <span
                              className={cn(
                                "font-semibold text-foreground max-w-15 md:max-w-none truncate",
                                result.valueClass
                              )}
                              title={`${result.value}`}
                            >
                              {result.value}
                            </span>
                            <span className="symbol">{result.symbol}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
