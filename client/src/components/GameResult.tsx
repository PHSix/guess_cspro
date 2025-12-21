import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GameResultProps {
  gameState: any;
  onPlayAgain: () => void;
}

export default function GameResult({ gameState, onPlayAgain }: GameResultProps) {
  const isWon = gameState?.isWon;
  const guessesUsed = gameState?.guessesUsed || 0;
  const answerPlayer = gameState?.answerPlayer;
  const guessHistory = gameState?.guessHistory || [];

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <Card className="p-8 max-w-2xl neon-border space-y-6">
        {/* 结果标题 */}
        <div className="text-center space-y-2">
          {isWon ? (
            <>
              <h2 className="text-4xl font-bold text-green-400">
                <span className="bracket">[</span>SUCCESS<span className="bracket">]</span>
              </h2>
              <p className="text-lg text-muted-foreground">恭喜！你成功猜出了谜底选手！</p>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-red-400">
                <span className="bracket">[</span>FAILED<span className="bracket">]</span>
              </h2>
              <p className="text-lg text-muted-foreground">很遗憾，你没有在8次机会内猜出答案。</p>
            </>
          )}
        </div>

        {/* 答案展示 */}
        {answerPlayer && (
          <div className="bg-card/50 p-6 rounded border border-accent/30 space-y-4">
            <div className="text-sm font-mono text-muted-foreground mb-4">
              <span className="bracket">[</span>ANSWER<span className="bracket">]</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground text-sm">选手名字</span>
                <div className="text-xl font-bold text-accent">{answerPlayer.playerName}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">队伍</span>
                <div className="text-lg font-semibold text-foreground">{answerPlayer.team}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">国家</span>
                <div className="text-lg font-semibold text-foreground">{answerPlayer.country}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">年龄</span>
                <div className="text-lg font-semibold text-foreground">
                  {new Date().getFullYear() - answerPlayer.birthYear}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">参加Major次数</span>
                <div className="text-lg font-semibold text-foreground">{answerPlayer.majorMaps}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">游戏角色</span>
                <div className="text-lg font-semibold text-foreground">{answerPlayer.role}</div>
              </div>
            </div>
          </div>
        )}

        {/* 统计信息 */}
        <div className="bg-card/50 p-4 rounded border border-border/50 space-y-3">
          <div className="text-sm font-mono text-muted-foreground">
            <span className="bracket">[</span>STATISTICS<span className="bracket">]</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">使用猜测次数</span>
              <div className="text-2xl font-bold text-accent">{guessesUsed} / 8</div>
            </div>
            <div>
              <span className="text-muted-foreground">猜测准确率</span>
              <div className="text-2xl font-bold text-accent">
                {guessHistory.length > 0
                  ? Math.round(
                      (guessHistory.filter(
                        (g: any) =>
                          g.teamMatch === 'exact' ||
                          g.countryMatch === 'exact' ||
                          g.ageMatch === 'exact' ||
                          g.majorMapsMatch === 'exact' ||
                          g.roleMatch === 'exact'
                      ).length /
                        (guessHistory.length * 5)) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>

        {/* 重新开始按钮 */}
        <Button
          onClick={onPlayAgain}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 neon-border"
          size="lg"
        >
          再来一把
        </Button>
      </Card>
    </div>
  );
}
