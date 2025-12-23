import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useOnlineStore } from "@/store/useOnlineStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  CreateRoomResponse,
  JoinRoomResponse,
  ErrorResponse,
} from "@/types";

type Difficulty = "all" | "normal" | "ylg";

/** 难度配置 */
const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; description: string }
> = {
  all: { label: "All Players", description: "所有职业选手" },
  normal: { label: "Normal", description: "精选常见选手" },
  ylg: { label: "YLG", description: "YLG 战队选手" },
};

export default function OnlineHomePage() {
  const [, navigate] = useLocation();
  const { difficulty: _difficulty } = useSettingsStore();
  // 优先使用本地存储的难度
  const [difficulty, setDifficulty] = useState<Difficulty>(_difficulty);
  const { setGamerInfo, setSessionInfo, reset, initializeGamerId, gamerId } =
    useOnlineStore();
  const { username } = useSettingsStore();

  const [roomIdInput, setRoomIdInput] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    initializeGamerId();
  }, []);

  const handleCreateRoom = async () => {
    if (!gamerId || !username.trim()) {
      toast.error("Please enter your name in settings");
      navigate("/settings");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gamerId,
          gamerName: username.trim(),
          difficulty,
        } satisfies CreateRoomRequest),
      });

      const data = (await response.json()) as
        | CreateRoomResponse
        | ErrorResponse;

      if ("success" in data && data.success === false) {
        toast.error(data.message || "Failed to create room");
        setIsCreating(false);
        return;
      }

      // Now data is CreateRoomResponse
      const createResponse = data as CreateRoomResponse;
      setSessionInfo(createResponse.sessionId, createResponse.roomId, true);
      setGamerInfo(gamerId, username);
      navigate("/room");
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error("Failed to create room");
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!gamerId || !username.trim() || !roomIdInput.trim()) {
      toast.error("Please check your settings and room ID");
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gamerId,
          gamerName: username.trim(),
          roomId: roomIdInput.trim(),
        } satisfies JoinRoomRequest),
      });

      const data = (await response.json()) as JoinRoomResponse | ErrorResponse;

      if ("success" in data && data.success === false) {
        toast.error(data.message || "Failed to join room");
        setIsJoining(false);
        return;
      }

      // Now data is JoinRoomResponse
      const joinResponse = data as JoinRoomResponse;
      setSessionInfo(joinResponse.sessionId, roomIdInput, false);
      setGamerInfo(gamerId, username);
      navigate("/room");
    } catch (error) {
      console.error("Failed to join room:", error);
      toast.error("Failed to join room");
      setIsJoining(false);
    }
  };

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomIdInput(e.target.value);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="p-8 max-w-2xl neon-border">
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
          <span className="glitch-text" data-text="多人对战">
            多人对战
          </span>
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          创建一个房间，最多支持3人参与
        </p>

        {/* Display current username */}
        <div className="mb-6 p-4 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">您的用户名</p>
              <p className="text-lg font-semibold text-foreground">
                {username}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/settings")}
            >
              修改
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Difficulty selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              困难等级（创建房间时）
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`p-3 rounded-lg border transition-all ${
                    difficulty === diff
                      ? "bg-accent text-accent-foreground border-accent neon-border"
                      : "bg-card text-muted-foreground border-border hover:border-accent/50"
                  }`}
                >
                  <div className="font-semibold text-sm">
                    {DIFFICULTY_CONFIG[diff].label}
                  </div>
                  <div className="text-xs opacity-70">
                    {DIFFICULTY_CONFIG[diff].description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="text-sm font-medium text-foreground mb-2 block"
              htmlFor="room-id-input"
            >
              房间ID（加入房间时）
            </label>
            <Input
              id="room-id-input"
              type="text"
              placeholder="输入房间ID..."
              value={roomIdInput}
              onChange={handleRoomIdChange}
              className="bg-input text-foreground border-border"
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating || !username.trim()}
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 neon-border"
            >
              {isCreating ? "创建中..." : "创建房间"}
            </Button>

            <Button
              onClick={handleJoinRoom}
              disabled={isJoining || !roomIdInput.trim() || !username.trim()}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {isJoining ? "加入中..." : "加入房间"}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              reset();
              navigate("/");
            }}
            className="w-full"
          >
            返回首页
          </Button>
        </div>
      </Card>
    </div>
  );
}
