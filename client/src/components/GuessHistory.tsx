import { Card } from '@/components/ui/card';

interface GuessHistoryProps {
  gameState: any;
}

function getMatchColor(matchType: string): string {
  switch (matchType) {
    case 'exact':
      return 'match-exact';
    case 'similar':
      return 'match-similar';
    case 'different':
      return 'match-different';
    case 'greater':
      return 'match-similar direction-up';
    case 'less':
      return 'match-similar direction-down';
    default:
      return '';
  }
}

function getMatchLabel(matchType: string): string {
  switch (matchType) {
    case 'exact':
      return '✓';
    case 'similar':
      return '≈';
    case 'different':
      return '✗';
    case 'greater':
      return '↑';
    case 'less':
      return '↓';
    default:
      return '?';
  }
}

export default function GuessHistory({ gameState }: GuessHistoryProps) {
  const guessHistory = gameState?.guessHistory || [];

  if (guessHistory.length === 0) {
    return (
      <Card className="p-6 neon-border">
        <div className="text-center text-muted-foreground">
          <div className="text-sm font-mono mb-2">
            <span className="bracket">[</span>HISTORY_EMPTY<span className="bracket">]</span>
          </div>
          <p className="text-xs">暂无猜测记录</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 neon-border space-y-4">
      <div className="text-sm font-mono text-muted-foreground mb-4">
        <span className="bracket">[</span>GUESS_HISTORY<span className="bracket">]</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {guessHistory.map((guess: any, index: number) => (
          <div key={guess.id} className="bg-card/50 p-3 rounded border border-border/50 space-y-2">
            <div className="text-xs font-mono text-muted-foreground">
              第 {guess.guessNumber} 次猜测
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* 队伍 */}
              <div className={`p-2 rounded ${getMatchColor(guess.teamMatch)}`}>
                <div className="text-xs font-mono opacity-70">队伍</div>
                <div className="font-semibold">{getMatchLabel(guess.teamMatch)}</div>
              </div>

              {/* 国家 */}
              <div className={`p-2 rounded ${getMatchColor(guess.countryMatch)}`}>
                <div className="text-xs font-mono opacity-70">国家</div>
                <div className="font-semibold">{getMatchLabel(guess.countryMatch)}</div>
              </div>

              {/* 年龄 */}
              <div className={`p-2 rounded ${getMatchColor(guess.ageMatch)}`}>
                <div className="text-xs font-mono opacity-70">年龄</div>
                <div className="font-semibold">{getMatchLabel(guess.ageMatch)}</div>
              </div>

              {/* Major */}
              <div className={`p-2 rounded ${getMatchColor(guess.majorMapsMatch)}`}>
                <div className="text-xs font-mono opacity-70">Major</div>
                <div className="font-semibold">{getMatchLabel(guess.majorMapsMatch)}</div>
              </div>

              {/* 角色 */}
              <div className={`p-2 rounded col-span-2 ${getMatchColor(guess.roleMatch)}`}>
                <div className="text-xs font-mono opacity-70">角色</div>
                <div className="font-semibold">{getMatchLabel(guess.roleMatch)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="border-t border-border/50 pt-3 text-xs text-muted-foreground space-y-1">
        <div><span className="text-green-400">✓</span> 完全匹配</div>
        <div><span className="text-yellow-400">≈</span> 相似 <span className="text-yellow-400">↑↓</span> 大小关系</div>
        <div><span className="text-red-400">✗</span> 不匹配</div>
      </div>
    </Card>
  );
}
