import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface PlayerSearchDropdownProps {
  onSelectPlayer: (player: any) => void;
  selectedPlayer: any;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function PlayerSearchDropdown({
  onSelectPlayer,
  selectedPlayer,
  searchQuery,
  onSearchChange,
}: PlayerSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading: isSearching } = trpc.game.searchPlayers.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.trim().length > 0 }
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (searchResults) {
      setResults(searchResults);
      setIsOpen(true);
    }
  }, [searchResults, searchQuery]);

  const handleSelectPlayer = (player: any) => {
    onSelectPlayer(player);
    setIsOpen(false);
    onSearchChange('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Input
        placeholder="输入选手名字搜索..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => searchQuery && setIsOpen(true)}
        className="bg-input text-foreground placeholder:text-muted-foreground border-border"
      />

      {selectedPlayer && !searchQuery && (
        <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
          <span className="text-foreground font-semibold">{selectedPlayer.playerName}</span>
        </div>
      )}

      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto z-50 neon-border">
          <div className="divide-y divide-border">
            {results.map((player) => (
              <button
                key={player.id}
                onClick={() => handleSelectPlayer(player)}
                className="w-full text-left px-4 py-3 hover:bg-card/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-foreground">{player.playerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.team} • {player.country}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>年龄: {new Date().getFullYear() - player.birthYear}</div>
                    <div>Major: {player.majorMaps}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {isOpen && searchQuery && results.length === 0 && !isSearching && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 text-center text-muted-foreground neon-border">
          未找到匹配的选手
        </Card>
      )}
    </div>
  );
}
