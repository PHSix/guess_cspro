import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import PlayerSearchDropdown from './PlayerSearchDropdown';

interface GameBoardProps {
  gameId: number;
  onGuessSubmitted: (gameState: any) => void;
}

export default function GameBoard({ gameId, onGuessSubmitted }: GameBoardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [guessesRemaining, setGuessesRemaining] = useState(8);
  const [guessHistory, setGuessHistory] = useState<any[]>([]);

  const submitGuessMutation = trpc.game.submitGuess.useMutation();
  const { data: gameState } = trpc.game.getGameState.useQuery({ gameId });

  // 初始化时获取游戏状态
  useEffect(() => {
    if (gameState) {
      setGuessesRemaining(gameState.guessesRemaining);
      setGuessHistory(gameState.guessHistory);
    }
  }, [gameState]);

  const handleGuessSubmit = async () => {
    if (!selectedPlayer) return;

    try {
      const result = await submitGuessMutation.mutateAsync({
        gameId,
        guessedPlayerId: selectedPlayer.id,
      });

      // 更新本地状态
      setGuessesRemaining(result.guessesRemaining);
      setGuessHistory((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          gameId,
          guessedPlayerId: selectedPlayer.id,
          guessNumber: prev.length + 1,
          ...result.comparisonResult,
        },
      ]);

      // 通知父组件
      onGuessSubmitted({
        ...result,
        guessesRemaining: result.guessesRemaining,
        guessHistory: [
          ...guessHistory,
          {
            id: guessHistory.length + 1,
            gameId,
            guessedPlayerId: selectedPlayer.id,
            guessNumber: guessHistory.length + 1,
            ...result.comparisonResult,
          },
        ],
      });

      setSelectedPlayer(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to submit guess:', error);
    }
  };

  const guessesUsed = Math.max(0, 8 - guessesRemaining);

  return (
    <Card className="p-6 neon-border space-y-6">
      {/* 猜测次数显示 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-mono text-muted-foreground">
            <span className="bracket">[</span>GUESSES_REMAINING<span className="bracket">]</span>
          </span>
          <span className="text-lg font-bold text-accent">{guessesRemaining} / 8</span>
        </div>
        <div className="w-full bg-card rounded h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
            style={{ width: `${(guessesUsed / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* 选手搜索和选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-mono text-muted-foreground">
          <span className="bracket">[</span>SELECT_PLAYER<span className="bracket">]</span>
        </label>
        <PlayerSearchDropdown
          onSelectPlayer={setSelectedPlayer}
          selectedPlayer={selectedPlayer}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* 选中的选手信息预览 */}
      {selectedPlayer && (
        <div className="bg-card/50 p-4 rounded border border-accent/30 space-y-2">
          <div className="text-sm font-mono text-muted-foreground mb-3">
            <span className="bracket">[</span>PREVIEW<span className="bracket">]</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">名字:</span>
              <span className="ml-2 text-foreground font-semibold">{selectedPlayer.playerName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">队伍:</span>
              <span className="ml-2 text-foreground font-semibold">{selectedPlayer.team}</span>
            </div>
            <div>
              <span className="text-muted-foreground">国家:</span>
              <span className="ml-2 text-foreground font-semibold">{selectedPlayer.country}</span>
            </div>
            <div>
              <span className="text-muted-foreground">年龄:</span>
              <span className="ml-2 text-foreground font-semibold">
                {new Date().getFullYear() - selectedPlayer.birthYear}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Major:</span>
              <span className="ml-2 text-foreground font-semibold">{selectedPlayer.majorMaps}</span>
            </div>
            <div>
              <span className="text-muted-foreground">角色:</span>
              <span className="ml-2 text-foreground font-semibold">{selectedPlayer.role}</span>
            </div>
          </div>
        </div>
      )}

      {/* 提交按钮 */}
      <Button
        onClick={handleGuessSubmit}
        disabled={!selectedPlayer || submitGuessMutation.isPending || guessesRemaining < 1}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 neon-border"
        size="lg"
      >
        {submitGuessMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            提交中...
          </>
        ) : (
          '提交猜测'
        )}
      </Button>

      {guessesRemaining <= 0 && (
        <div className="bg-red-900/20 border border-red-500/50 p-3 rounded text-red-400 text-sm text-center">
          <span className="bracket">[</span>ERROR<span className="bracket">]</span> 猜测次数已用完！
        </div>
      )}
    </Card>
  );
}
