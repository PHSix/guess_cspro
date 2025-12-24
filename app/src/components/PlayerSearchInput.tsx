import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchPlayers } from "@/lib/gameEngine";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import { getCountryFlag } from "@shared/countryUtils";
import { Player } from "@shared/gameEngine";

interface PlayerSearchInputProps {
  /** 当前搜索值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
  /** 选择玩家回调 */
  onSelectPlayer: (player: Player) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 输入框类名 */
  className?: string;
  /** 自动聚焦 */
  autoFocus?: boolean;
}

/**
 * 玩家搜索输入框组件
 * 支持下拉搜索、键盘导航、自动聚焦
 */
export function PlayerSearchInput({
  value,
  onChange,
  onSelectPlayer,
  disabled = false,
  placeholder = "输入选手名字... (↑↓ 或 Tab 切换, Enter 确认)",
  className = "bg-input text-foreground placeholder:text-muted-foreground border-border",
  autoFocus = true,
}: PlayerSearchInputProps) {
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // 自动聚焦
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);

  // 搜索逻辑
  useEffect(() => {
    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setHighlightedIndex(0);
      return;
    }

    const results = searchPlayers(value).slice(0, 20);
    setSearchResults(results);
    setHighlightedIndex(0);
    setShowDropdown(results.length > 0);
  }, [value]);

  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleFocus = () => {
    if (value.trim() && searchResults.length > 0) {
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
        handleSelectPlayer(searchResults[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSelectPlayer = (player: Player) => {
    onSelectPlayer(player);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />

      {showDropdown && searchResults.length > 0 && !disabled && (
        <div
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
              onPointerDown={e => {
                e.stopPropagation();
                e.preventDefault();
                handleSelectPlayer(player);
              }}
              className={`w-full text-left px-4 py-2 transition-colors border-b border-border/50 last:border-b-0 ${
                idx === highlightedIndex
                  ? "bg-accent/20 border-l-2 border-l-accent"
                  : "hover:bg-accent/10 hover:border-l-2 hover:border-l-accent/50"
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold text-foreground text-sm">
                  {player.proId}
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
  );
}
