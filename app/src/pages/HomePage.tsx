import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Settings, User, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function HomePage() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { isOnlineModeAvailable } = useSettingsStore();

  const handleStartGame = () => {
    setIsLoading(true);
    // 直接导航到游戏页面
    navigate("/game");
  };

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="p-8 max-w-md neon-border text-center space-y-0">
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
            "▶ START GAME"
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate("/online")}
          disabled={!isOnlineModeAvailable}
          className="w-full text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          size="sm"
        >
          {isOnlineModeAvailable ? (
            <>
              <Wifi className="w-4 h-4 mr-2" />
              ONLINE
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 mr-2" />
              ONLINE (离线)
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={handleGoToSettings}
          className="w-full text-muted-foreground hover:text-foreground"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          设置
        </Button>
      </Card>
    </div>
  );
}
