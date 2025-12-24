import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { usePlayerStore } from "./store/usePlayerStore";
import { useSettingsStore } from "./store/useSettingsStore";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import FinishedPage from "./pages/FinishedPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import OnlineHomePage from "./pages/OnlineHomePage";
import OnlineRoomPage from "./pages/OnlineRoomPage";
import { ofetch } from "ofetch";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={HomePage} />
      <Route path={"/game"} component={GamePage} />
      <Route path={"/finished"} component={FinishedPage} />
      <Route path={"/settings"} component={SettingsPage} />
      <Route path={"/online"} component={OnlineHomePage} />
      <Route path={"/room"} component={OnlineRoomPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const { initializeData, isLoading, error, isInitialized } = usePlayerStore();
  const { initialize: initializeSettings, setOnlineModeAvailable } =
    useSettingsStore();

  // 在应用启动时初始化数据
  useEffect(() => {
    initializeData();
    initializeSettings();

    // Check if server is available
    ofetch("/api/alive", {
      timeout: 1000,
      method: "GET",
      onResponse({ response }) {
        setOnlineModeAvailable(response.ok);
      },
      onResponseError() {
        setOnlineModeAvailable(false);
      },
    });
  }, []);

  // 如果正在加载或未初始化，显示加载界面
  if (isLoading || !isInitialized) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-accent" />
                <h2 className="text-2xl font-bold text-foreground">
                  正在加载游戏数据...
                </h2>
                <p className="text-sm text-muted-foreground">
                  请稍候，我们正在准备选手数据
                </p>
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // 如果加载失败，显示错误界面
  if (error) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md mx-auto p-6">
                <div className="w-12 h-12 mx-auto bg-destructive/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">⚠</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">加载失败</h2>
                <p className="text-sm text-muted-foreground">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
                >
                  重新加载
                </button>
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // 数据加载完成，渲染正常应用
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
