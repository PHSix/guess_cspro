import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { toast } from "sonner";

// Generate random username (copied from settings store)
function generateRandomUsername(): string {
  const adjectives = [
    "Happy",
    "Cool",
    "Swift",
    "Brave",
    "Clever",
    "Epic",
    "Lucky",
    "Mighty",
  ];
  const nouns = [
    "Tiger",
    "Dragon",
    "Phoenix",
    "Wolf",
    "Bear",
    "Eagle",
    "Lion",
    "Panther",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

type DifficultyLevel = "all" | "normal" | "ylg";

interface Difficulty {
  label: string;
  description: string;
  difficulty: string;
  disabled: boolean;
  wip?: boolean;
}

const DIFFICULTY_CONFIG: Record<DifficultyLevel, Difficulty> = {
  all: {
    label: "ALL 模式",
    description: "困难模式 - 包含所有选手",
    difficulty: "困难",
    disabled: false,
    wip: false,
  },
  normal: {
    label: "Normal 模式",
    description: "中等模式 - 精选选手",
    difficulty: "中等",
    disabled: false,
    wip: false,
  },
  ylg: {
    label: "YLG 模式",
    description: "简单模式",
    difficulty: "简单",
    disabled: false,
  },
};

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const {
    difficulty,
    totalGuesses,
    fribergAutoGuess,
    username,
    setDifficulty,
    setTotalGuesses,
    setFribergAutoGuess,
    setUsername,
    reset,
  } = useSettingsStore();
  const [showFribergDialog, setShowFribergDialog] = useState(false);
  const [pendingFribergValue, setPendingFribergValue] = useState(false);

  const handleSave = () => {
    toast.success("设置已保存", {
      description: "您的游戏设置已更新",
    });
  };

  const handleReset = () => {
    reset();
    toast.success("设置已重置", {
      description: "所有设置已恢复默认值",
    });
  };

  const handleTotalGuessesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 20) {
      setTotalGuesses(value);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleFribergToggle = (checked: boolean) => {
    if (fribergAutoGuess && !checked) {
      setPendingFribergValue(false);
      setShowFribergDialog(true);
    } else {
      setFribergAutoGuess(checked);
    }
  };

  const handleFribergDialogConfirm = () => {
    setFribergAutoGuess(pendingFribergValue);
    setShowFribergDialog(false);
  };

  const handleFribergDialogCancel = () => {
    setShowFribergDialog(false);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            <span className="glitch-text" data-text="设置">
              设置
            </span>
          </h1>
        </div>

        <Card className="p-6 neon-border space-y-6">
          {/* 难度设置 */}
          <div className="space-y-4">
            <div className="text-xs font-mono text-muted-foreground">
              <span className="bracket">[</span>DIFFICULTY
              <span className="bracket">]</span>
            </div>

            <div className="space-y-3">
              {(
                Object.entries(DIFFICULTY_CONFIG) as [
                  DifficultyLevel,
                  (typeof DIFFICULTY_CONFIG)[DifficultyLevel],
                ][]
              ).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => !config.disabled && setDifficulty(key)}
                  disabled={config.disabled}
                  className={cn(
                    "w-full p-4 border rounded-lg transition-all text-left",
                    difficulty === key
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50",
                    config.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {config.label}
                        </h3>
                        {config.wip && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                            WIP
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                          {config.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                      {config.wip && (
                        <p className="text-xs text-yellow-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          此模式正在开发中，暂不可用
                        </p>
                      )}
                    </div>
                    {difficulty === key && (
                      <div className="w-4 h-4 rounded-full border-2 border-accent flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 用户名设置 */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="text-xs font-mono text-muted-foreground">
              <span className="bracket">[</span>USERNAME
              <span className="bracket">]</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  用户名
                </label>
                <Input
                  type="text"
                  maxLength={20}
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full max-w-75"
                  placeholder="输入用户名"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  用于多人模式的用户名（最多20个字符）
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setUsername(generateRandomUsername())}
              >
                随机生成
              </Button>
            </div>
          </div>

          {/* 猜测次数设置 */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="text-xs font-mono text-muted-foreground">
              <span className="bracket">[</span>TOTAL GUESSES
              <span className="bracket">]</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  最大猜测次数
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={totalGuesses}
                  onChange={handleTotalGuessesChange}
                  className="w-full max-w-50"
                  placeholder="8"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  设置游戏中的最大猜测次数（1-20之间）
                </p>
              </div>

              {/* 预设选项 */}
              <div className="flex flex-wrap gap-2">
                {[3, 5, 8, 10, 15].map(num => (
                  <Button
                    key={num}
                    variant={totalGuesses === num ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTotalGuesses(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* friberg 自动猜测设置 */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="text-xs font-mono text-muted-foreground">
              <span className="bracket">[</span>GAME OPTIONS
              <span className="bracket">]</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="space-y-1">
                  <label
                    className="text-sm font-semibold text-foreground cursor-pointer"
                    onClick={() => handleFribergToggle(!fribergAutoGuess)}
                  >
                    friberg
                  </label>
                  <p className="text-xs text-muted-foreground">自动玩高祖</p>
                </div>
                <Switch
                  checked={fribergAutoGuess}
                  onCheckedChange={handleFribergToggle}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                开启后，每次开始新游戏时会自动先猜测 friberg 选手
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button onClick={handleSave} className="flex-1">
              保存设置
            </Button>
            <Button variant="outline" onClick={handleReset}>
              重置
            </Button>
          </div>

          {/* 说明 */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
            <p>• 难度设置会影响游戏中的选手池和猜测范围</p>
            <p>• 猜测次数设置会在新游戏中生效</p>
            <p>• 所有设置会自动保存在浏览器本地存储中</p>
            <p>• 修改设置后需要重新开始游戏才能生效</p>
          </div>
        </Card>

        {/* friberg 确认对话框 */}
        <Dialog open={showFribergDialog} onOpenChange={setShowFribergDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>关闭自动玩高祖</DialogTitle>
              <DialogDescription>
                此为系统自动开启，不可以关闭！
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleFribergDialogCancel}>确认取消</Button>
              <Button variant="outline" onClick={handleFribergDialogConfirm}>
                取消开启
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
