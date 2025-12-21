import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
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
  GameState,
  MatchType,
} from "@/lib/gameEngine";

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(GameState.Menu);
  const [answerPlayer, setAnswerPlayer] = useState<Player | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [guessesRemaining, setGuessesRemaining] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      } else {
        setSearchResults([]);
        setHighlightedIndex(0);
      }
    };

    const timer = setTimeout(search, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * 开始游戏
   */
  const handleStartGame = async () => {
    setIsLoading(true);
    const player = await getRandomPlayer();
    setAnswerPlayer(player);
    setGuesses([]);
    setGuessesRemaining(8);
    setGameState(GameState.Playing);
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedIndex(0);
    setIsWon(false);
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
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
      setIsWon(true);
    } else if (newGuesses.length >= 8) {
      setGameState(GameState.Finished);
      setGameState(GameState.Finished);
    } else {
      setGuessesRemaining(8 - newGuesses.length);
      setSearchQuery("");
      setSearchResults([]);
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleGuess(searchResults[highlightedIndex]);
      }
    }
  };

  const handlePlayAgain = () => {
    setGameState(GameState.Menu);
    setAnswerPlayer(null);
    setGuesses([]);
    setGuessesRemaining(8);
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedIndex(0);
  };

  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="p-8 max-w-md neon-border text-center space-y-6">
          <h1 className="text-4xl font-bold text-foreground">
            <span className="glitch-text" data-text="弗一把">
              弗一把
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">CS职业选手猜猜猜</p>
          <Button
            onClick={handleStartGame}
            disabled={isLoading}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 neon-border"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                初始化中...
              </>
            ) : (
              ">> START GAME"
            )}
          </Button>
        </Card>
      </div>
    );
  }

  if (gameState === "finished") {
    return (
      <div className="min-h-screen bg-background py-8">
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
                  : "很遗憾，没有猜出答案"}
              </p>
            </div>

            {answerPlayer && (
              <div className="bg-card/50 p-4 rounded border border-accent/30 space-y-3">
                <div className="text-sm font-mono text-muted-foreground">
                  <span className="bracket">[</span>ANSWER
                  <span className="bracket">]</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">名字:</span>
                    <div className="font-semibold text-accent">
                      {answerPlayer.playerName}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">队伍:</span>
                    <div className="font-semibold">{answerPlayer.team}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">国家:</span>
                    <div className="font-semibold">{answerPlayer.country}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">年龄:</span>
                    <div className="font-semibold">
                      {new Date().getFullYear() - answerPlayer.birthYear}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Major:</span>
                    <div className="font-semibold">
                      {answerPlayer.majorMaps}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">角色:</span>
                    <div className="font-semibold">{answerPlayer.role}</div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handlePlayAgain}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 neon-border"
              size="lg"
            >
              再来一把
            </Button>
          </Card>
        </div>
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
          <div className="text-sm text-muted-foreground">
            剩余次数:{" "}
            <span className="text-accent font-bold">{guessesRemaining}</span> /
            8
          </div>
        </div>

        <Card className="p-6 neon-border space-y-4">
          {/* 搜索输入框 */}
          <Select>
            <SelectTrigger className="bg-input text-foreground placeholder:text-muted-foreground border-border">
              <SelectValue
                onChange={e => {
                  console.log(e, e.target);
                }}
              />
            </SelectTrigger>
            <SelectContent>
              {searchResults.map(player => (
                <SelectItem key={player.id} value={player.playerName}>
                  <div className="font-semibold text-foreground text-sm">
                    {player.playerName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {player.team} • {player.country} •{" "}
                    {new Date().getFullYear() - player.birthYear}岁
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="输入选手名字... (↑↓ 选择, Enter 确认)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-input text-foreground placeholder:text-muted-foreground border-border"
              autoFocus
            />

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded z-50 max-h-48 overflow-y-auto">
                {searchResults.map((player, idx) => (
                  <button
                    key={player.id}
                    onClick={() => handleGuess(player)}
                    className={`w-full text-left px-4 py-2 transition-colors border-b border-border/50 last:border-b-0 ${
                      idx === highlightedIndex
                        ? "bg-accent/20 border-l-2 border-l-accent"
                        : "hover:bg-card/50"
                    }`}
                  >
                    <div className="font-semibold text-foreground text-sm">
                      {player.playerName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.team} • {player.country} •{" "}
                      {new Date().getFullYear() - player.birthYear}岁
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div> */}

          {/* 猜测历史表格 */}
          {guesses.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-muted-foreground">
                <span className="bracket">[</span>HISTORY
                <span className="bracket">]</span>
              </div>
              <div className="overflow-x-auto">
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
                            <div>{guess.country}</div>
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
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

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
