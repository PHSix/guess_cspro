import { cn } from "@/lib/utils";
import { getCountryChinese, getCountryFlag } from "@shared/countryUtils";
import { MatchType, Guess } from "@shared/index";
import { useMemo } from "react";

interface GuessHistoryProps {
  /** 猜测记录列表 */
  guesses: Guess[];
  /** 总猜测次数限制 */
  maxGuesses?: number;
  /** 是否显示表头 */
  showHeader?: boolean;
  /** 容器类名 */
  className?: string;
}

function getSymbolByMaskMatchType(match: MatchType): string {
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

/**
 * 获取匹配结果的样式类名
 */
export function getMatchClass(match: MatchType): string {
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

/**
 * 在线游戏猜测历史记录组件
 * 显示玩家的猜测历史及匹配结果
 */
export function GuessHistory({ guesses }: GuessHistoryProps) {
  const history: CompareResult[][] = useMemo(() => {
    return guesses.map(guess => {
      return [
        {
          value: guess.guessId,
        },
        {
          value: guess.team,
          class: getMatchClass(guess.mask.team),
          symbol: getSymbolByMaskMatchType(guess.mask.team),
        },
        {
          // 国家图标
          prefix: getCountryFlag(guess.country),
          // 国家名称
          value: getCountryChinese(guess.country),
          valueClass: "hidden md:block",
          class: getMatchClass(guess.mask.country),
          symbol: getSymbolByMaskMatchType(guess.mask.country),
        },
        {
          value: guess.age,
          class: getMatchClass(guess.mask.age),
          symbol: getSymbolByMaskMatchType(guess.mask.age),
        },
        {
          value: guess.majorMaps,
          class: getMatchClass(guess.mask.majorsPlayed),
          symbol: getSymbolByMaskMatchType(guess.mask.majorsPlayed),
        },
        {
          value: guess.role,
          class: getMatchClass(guess.mask.role),
          symbol: getSymbolByMaskMatchType(guess.mask.role),
        },
      ];
    });
  }, [guesses]);

  return (
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
            {history.map((row, idx) => (
              <tr key={idx} className="body-row">
                {/* 所有属性数据的对比结果 */}
                {row.map((result, idx) => (
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
  );
}
