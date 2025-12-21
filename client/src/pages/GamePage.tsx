import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  getAllPlayers,
  searchPlayers,
  getRandomPlayer,
  comparePlayerAttributes,
  isCorrectGuess,
  createGuessRecord,
  type Player,
  type Guess,
  MatchType,
} from "@/lib/gameEngine";
import { getCountryFlag } from "@shared/countryUtils";
import { useLocation } from "wouter";

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

export default function GamePage() {
  const [, navigate] = useLocation();
  const [answerPlayer, setAnswerPlayer] = useState<Player | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [guessesRemaining, setGuessesRemaining] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // 初始化数据
  useEffect(() => {
    getAllPlayers().catch(console.error);
  }, []);

  // 搜索玩家
  useEffect(() => {
    const search = async () => {
      if (searchQuery.trim()) {
        const results = await searchPlayers(searchQuery);
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
  const handleStartGame = useCallback(async () => {
    setIsLoading(true);
    const player = await getRandomPlayer();
    setAnswerPlayer(player);
    console.log(player);
    setGuesses([]);
    setGuessesRemaining(8);
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedIndex(0);
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // 初始化游戏
  useEffect(() => {
    handleStartGame();
  }, []);

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
    } else if (newGuesses.length >= 8) {
      // 用完次数，跳转到失败页面
      const loseData = {
        isWon: false,
        guesses: newGuesses,
        answer: answerPlayer,
      };
      navigate("/finished", { state: loseData });
    } else {
      // 没猜中但还有次数，继续游戏
      setGuessesRemaining(8 - newGuesses.length);
      setSearchQuery("");
      setSearchResults([]);
      setHighlightedIndex(0);
      setShowDropdown(false);

      // 移动端自动滚动到最新一列
      if (tableRef.current) {
        setTimeout(() => {
          tableRef.current?.scrollTo({
            left: tableRef.current.scrollWidth,
            behavior: "smooth",
          });
        }, 100);
      }

      setTimeout(() => inputRef.current?.focus(), 100);
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
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <span className="glitch-text" data-text="弗一把">
              弗一把
            </span>
          </h1>
        </div>

        <div className="mb-4 text-center">
          <div className="text-xs font-mono text-muted-foreground">
            <span className="bracket">[</span>REMAINING
            <span className="bracket">]</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            <span className="text-accent font-bold">{guessesRemaining}</span> /
            8
          </div>
        </div>

        <Card className="p-6 neon-border space-y-4">
          {/* 搜索输入框 */}
          <div className="relative">
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
                className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded z-50 max-h-[108px] overflow-y-auto custom-scrollbar"
              >
                {searchResults.map((player, idx) => (
                  <button
                    key={player.id}
                    data-search-index={idx}
                    onClick={() => handleGuess(player)}
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

            {/* 桌面端正常表格 - 横向记录，纵向属性 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-mono">
                      选手
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-mono">
                      队伍
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-mono">
                      国家
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-mono">
                      年龄
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-mono">
                      Major
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-mono">
                      角色
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {guesses.map((guess, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border/50 hover:bg-card/30"
                    >
                      <td className="py-2 px-2">
                        <div className="font-semibold text-foreground">
                          {guess.playerName}
                        </div>
                      </td>
                      <td
                        className={`py-2 px-2 ${getMatchClass(guess.result.teamMatch)}`}
                      >
                        <div className="flex gap-4">
                          <div>{guess.team}</div>
                          <div className="text-xs">
                            {getMatchSymbol(guess.result.teamMatch)}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`py-2 px-2 ${getMatchClass(guess.result.countryMatch)}`}
                      >
                        <div className="flex gap-4">
                          <div>
                            {getCountryFlag(guess.country)} {guess.country}
                          </div>
                          <div className="text-xs">
                            {getMatchSymbol(guess.result.countryMatch)}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`py-2 px-2 ${getMatchClass(guess.result.ageMatch)}`}
                      >
                        <div className="flex gap-4">
                          <div>{guess.age}岁</div>
                          <div className="text-xs">
                            {getMatchSymbol(guess.result.ageMatch)}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`py-2 px-2 ${getMatchClass(guess.result.majorMapsMatch)}`}
                      >
                        <div className="flex gap-4">
                          <div>{guess.majorMaps}</div>
                          <div className="text-xs">
                            {getMatchSymbol(guess.result.majorMapsMatch)}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`py-2 px-2 ${getMatchClass(guess.result.roleMatch)}`}
                      >
                        <div className="flex gap-4">
                          <div>{guess.role}</div>
                          <div className="text-xs">
                            {getMatchSymbol(guess.result.roleMatch)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 移动端转置表格 - 纵向属性，横向记录 */}
            <div
              className="md:hidden overflow-x-auto custom-scrollbar"
              ref={tableRef}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-mono w-24 sticky left-0 bg-card z-10">
                      属性
                    </th>
                    {guesses.map((_, idx) => (
                      <th
                        key={idx}
                        className="text-left py-2 px-2 text-muted-foreground font-mono min-w-[100px]"
                      >
                        第 {idx + 1} 次
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 选手名字行 */}
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-semibold text-muted-foreground sticky left-0 bg-card z-10">
                      选手
                    </td>
                    {guesses.map((guess, idx) => (
                      <td
                        key={idx}
                        className="py-2 px-2 font-semibold text-foreground"
                      >
                        {guess.playerName}
                      </td>
                    ))}
                  </tr>

                  {/* 队伍行 */}
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-semibold text-muted-foreground sticky left-0 bg-card z-10">
                      队伍
                    </td>
                    {guesses.map((guess, idx) => (
                      <td
                        key={idx}
                        className={`py-2 px-2 ${getMatchClass(guess.result.teamMatch)}`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{guess.team}</span>
                          <span className="text-xs">
                            {getMatchSymbol(guess.result.teamMatch)}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* 国家行 */}
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-semibold text-muted-foreground sticky left-0 bg-card z-10">
                      国家
                    </td>
                    {guesses.map((guess, idx) => (
                      <td
                        key={idx}
                        className={`py-2 px-2 ${getMatchClass(guess.result.countryMatch)}`}
                      >
                        <div className="flex items-center gap-1">
                          <span>
                            {getCountryFlag(guess.country)} {guess.country}
                          </span>
                          <span className="text-xs">
                            {getMatchSymbol(guess.result.countryMatch)}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* 年龄行 */}
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-semibold text-muted-foreground sticky left-0 bg-card z-10">
                      年龄
                    </td>
                    {guesses.map((guess, idx) => (
                      <td
                        key={idx}
                        className={`py-2 px-2 ${getMatchClass(guess.result.ageMatch)}`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{guess.age}岁</span>
                          <span className="text-xs">
                            {getMatchSymbol(guess.result.ageMatch)}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Major行 */}
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-semibold text-muted-foreground sticky left-0 bg-card z-10">
                      Major
                    </td>
                    {guesses.map((guess, idx) => (
                      <td
                        key={idx}
                        className={`py-2 px-2 ${getMatchClass(guess.result.majorMapsMatch)}`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{guess.majorMaps}</span>
                          <span className="text-xs">
                            {getMatchSymbol(guess.result.majorMapsMatch)}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* 角色行 */}
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-semibold text-muted-foreground sticky left-0 bg-card z-10">
                      角色
                    </td>
                    {guesses.map((guess, idx) => (
                      <td
                        key={idx}
                        className={`py-2 px-2 ${getMatchClass(guess.result.roleMatch)}`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{guess.role}</span>
                          <span className="text-xs">
                            {getMatchSymbol(guess.result.roleMatch)}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
