import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
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
  type Guess,
  MatchType,
} from "@/lib/gameEngine";
import { getCountryFlag, getCountryChinese } from "@shared/countryUtils";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import { useSettingsStore } from "@/store/useSettingsStore";

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

function getCompareResults(record: Guess): CompareResult[] {
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

interface GuessWithClass extends Guess {
  compareResults: CompareResult[];
}

export default function GamePage() {
  const [, navigate] = useLocation();
  const { totalGuesses, fribergAutoGuess } = useSettingsStore();
  const [answerPlayer, setAnswerPlayer] = useState<Player | null>(null);
  const [guesses, setGuesses] = useState<GuessWithClass[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [guessesRemaining, setGuessesRemaining] = useState(totalGuesses);

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  // 搜索玩家
  useEffect(() => {
    const search = () => {
      if (searchQuery.trim()) {
        const results = searchPlayers(searchQuery);
        setSearchResults(results);
        setHighlightedIndex(0);
        setShowDropdown(results.length > 0);
      } else {
        setSearchResults([]);
        setHighlightedIndex(0);
        setShowDropdown(false);
      }
    };

    const timer = setTimeout(search, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 失焦处理
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
    setSearchResults([]);
    setHighlightedIndex(0);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      const newIndex =
        highlightedIndex < searchResults.length - 1
          ? highlightedIndex + 1
          : highlightedIndex;
      setHighlightedIndex(newIndex);
      setTimeout(() => {
        const highlightedElement = document.querySelector(
          `[data-search-index="${newIndex}"]`
        ) as HTMLElement;
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      const newIndex = highlightedIndex > 0 ? highlightedIndex - 1 : 0;
      setHighlightedIndex(newIndex);
      setTimeout(() => {
        const highlightedElement = document.querySelector(
          `[data-search-index="${newIndex}"]`
        ) as HTMLElement;
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    } else if (
      e.key === "Enter" ||
      e.key === "Go" ||
      e.key === "Search" ||
      e.key === "Done"
    ) {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleGuess(searchResults[highlightedIndex]);
      }
    }
  };

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
      setSearchResults([]);
      setHighlightedIndex(0);
      setShowDropdown(false);
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
          <div className="relative">
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
            <Input
              ref={inputRef}
              type="text"
              placeholder="输入选手名字... (↑↓ 或 Tab 切换, Enter 确认)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onFocus={handleFocus}
              className="bg-input text-foreground placeholder:text-muted-foreground border-border"
              autoFocus
              enterKeyHint="search"
            />

            {showDropdown && searchResults.length > 0 && (
              <div
                ref={dropdownRef}
                className={cn(
                  "absolute md:top-full left-0 right-0 mt-1 bg-card border border-border rounded flex flex-col-reverse md:flex-col z-50 max-h-27 overflow-y-auto custom-scrollbar",
                  {
                    "bottom-10": isMobile,
                  }
                )}
              >
                {searchResults.map((player, idx) => (
                  <button
                    key={player.id}
                    data-search-index={idx}
                    // 优化移动端收起键盘，使用pointerdown替换click事件
                    onPointerDown={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleGuess(player);
                    }}
                    className={`w-full text-left px-4 py-2 transition-colors border-b border-border/50 last:border-b-0 ${
                      idx === highlightedIndex
                        ? "bg-accent/20 border-l-2 border-l-accent"
                        : "hover:bg-accent/10 hover:border-l-2 hover:border-l-accent/50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-foreground text-sm">
                        {player.playerName}
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {player.team} • {getCountryFlag(player.country)}{" "}
                        {player.country} •{" "}
                        {new Date().getFullYear() - player.birthYear}岁
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 猜测历史表格 */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-muted-foreground">
              <span className="bracket">[</span>HISTORY
              <span className="bracket">]</span>
            </div>

            {/* 统一横向表格 */}
            <div className="overflow-x-auto custom-scrollbar" ref={tableRef}>
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
