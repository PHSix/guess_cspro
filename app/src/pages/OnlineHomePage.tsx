import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useMultiplayerStore } from "@/store/useMultiplayerStore.js";
import { useSettingsStore } from "@/store/useSettingsStore.js";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  CreateRoomResponse,
  JoinRoomResponse,
  ErrorResponse,
} from "@/types/multiplayer.js";

export default function OnlineHomePage() {
  const [, setLocation] = useLocation();
  const { setGamerInfo, setSessionInfo, reset, initializeGamerId, gamerId } =
    useMultiplayerStore();
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
      setLocation("/settings");
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
      setLocation("/room");
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
      setLocation("/room");
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
            Multiplayer
          </span>
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Create or join a room with up to 3 players
        </p>

        {/* Display current username */}
        <div className="mb-6 p-4 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Your Username</p>
              <p className="text-lg font-semibold text-foreground">
                {username}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/settings")}
            >
              Change
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label
              className="text-sm font-medium text-foreground mb-2 block"
              htmlFor="room-id-input"
            >
              Room ID (to join)
            </label>
            <Input
              id="room-id-input"
              type="text"
              placeholder="Enter room ID..."
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
              {isCreating ? "Creating..." : "Create Room"}
            </Button>

            <Button
              onClick={handleJoinRoom}
              disabled={isJoining || !roomIdInput.trim() || !username.trim()}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {isJoining ? "Joining..." : "Join Room"}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              reset();
              setLocation("/");
            }}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
