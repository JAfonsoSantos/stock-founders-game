import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { I18nProvider } from "@/hooks/useI18n";
import { SettingsProvider } from "@/hooks/useSettings";
import { ThemeProvider } from "next-themes";
import { GameProvider } from "@/context/GameContext";
import { AppShell } from "@/components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CreateGame from "./pages/CreateGame";
import GameOrganizer from "./pages/GameOrganizer";
import ManageParticipants from "./pages/ManageParticipants";
import ManageStartups from "./pages/ManageStartups";
import GameSettings from "./pages/GameSettings";
import Join from "./pages/Join";
import Discover from "./pages/Discover";
import PlayerDashboard from "./pages/PlayerDashboard";
import StartupProfile from "./pages/StartupProfile";
import StartupAdmin from "./pages/StartupAdmin";
import Leaderboard from "./pages/Leaderboard";
import FounderOnboarding from "./pages/FounderOnboarding";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function ProtectedShellRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <AppShell>{children}</AppShell>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider>
        <AuthProvider>
          <GameProvider>
            <SettingsProvider>
              <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <ProtectedShellRoute>
                  <Dashboard />
                </ProtectedShellRoute>
              } />
              <Route path="/auth" element={
                <PublicRoute>
                  <Auth />
                </PublicRoute>
              } />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={
                <ProtectedShellRoute>
                  <Profile />
                </ProtectedShellRoute>
              } />
              <Route path="/settings" element={
                <ProtectedShellRoute>
                  <Settings />
                </ProtectedShellRoute>
              } />
              <Route path="/games/new" element={
                <ProtectedShellRoute>
                  <CreateGame />
                </ProtectedShellRoute>
              } />
              <Route path="/games/:gameId/organizer" element={
                <ProtectedShellRoute>
                  <GameOrganizer />
                </ProtectedShellRoute>
              } />
              <Route path="/games/:gameId/participants" element={
                <ProtectedShellRoute>
                  <ManageParticipants />
                </ProtectedShellRoute>
              } />
              <Route path="/games/:gameId/startups" element={
                <ProtectedShellRoute>
                  <ManageStartups />
                </ProtectedShellRoute>
              } />
              <Route path="/games/:gameId/settings" element={
                <ProtectedShellRoute>
                  <GameSettings />
                </ProtectedShellRoute>
              } />
              <Route path="/join/:gameId" element={<Join />} />
              <Route path="/join" element={<Join />} />
              <Route path="/games/:gameId/discover" element={
                <ProtectedShellRoute>
                  <Discover />
                </ProtectedShellRoute>
              } />
              <Route path="/games/:gameId/me" element={
                <ProtectedShellRoute>
                  <PlayerDashboard />
                </ProtectedShellRoute>
              } />
              <Route path="/games/:gameId/startup/:slug" element={
                <ProtectedShellRoute>
                  <StartupProfile />
                </ProtectedShellRoute>
              } />
              <Route path="/games/:gameId/startup/:slug/admin" element={
                <ProtectedShellRoute>
                  <StartupAdmin />
                </ProtectedShellRoute>
              } />
              <Route path="/games/:gameId/leaderboard" element={
                <ProtectedShellRoute>
                  <Leaderboard />
                </ProtectedShellRoute>
              } />
              <Route path="/games/:gameId/founder-onboarding" element={
                <ProtectedShellRoute>
                  <FounderOnboarding />
                </ProtectedShellRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
           </BrowserRouter>
             </TooltipProvider>
           </SettingsProvider>
          </GameProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
