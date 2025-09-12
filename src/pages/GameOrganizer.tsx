import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Building2, Settings, Play, Pause, Mail, TrendingUp, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendInviteEmail, sendMarketOpenEmail, sendLastMinutesEmail, sendResultsEmail } from "@/lib/email";

interface Game {
  id: string;
  name: string;
  status: string;
  starts_at: string;
  ends_at: string;
  currency: string;
  locale: string;
  owner_user_id: string;
  allow_secondary: boolean;
  show_public_leaderboards: boolean;
}

interface GameStats {
  participants: number;
  startups: number;
  totalVolume: number;
  activeTrades: number;
}

export default function GameOrganizer() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [stats, setStats] = useState<GameStats>({ participants: 0, startups: 0, totalVolume: 0, activeTrades: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    
    fetchGame();
  }, [gameId]);

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (error) throw error;
      
      // Check if user is the owner
      if (data.owner_user_id !== user?.id) {
        toast.error("Access denied - you don't have permission to organize this game");
        navigate("/");
        return;
      }

      setGame(data);
      
      // Fetch stats
      const [participantsResult, startupsResult, tradesResult] = await Promise.all([
        supabase.from("participants").select("id", { count: "exact" }).eq("game_id", gameId),
        supabase.from("startups").select("id", { count: "exact" }).eq("game_id", gameId),
        supabase.from("trades").select("qty, price_per_share").eq("game_id", gameId)
      ]);

      const totalVolume = tradesResult.data?.reduce((sum, trade) => 
        sum + (trade.qty * trade.price_per_share), 0) || 0;

      setStats({
        participants: participantsResult.count || 0,
        startups: startupsResult.count || 0,
        totalVolume,
        activeTrades: tradesResult.data?.length || 0
      });
    } catch (error: any) {
      toast.error("Failed to load game: " + error.message);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const updateGameStatus = async (newStatus: "draft" | "pre_market" | "open" | "closed" | "results") => {
    if (!game) return;
    
    const previousStatus = game.status;
    setActionLoading(`status-${newStatus}`);
    
    try {
      const { error } = await supabase
        .from("games")
        .update({ status: newStatus })
        .eq("id", gameId);

      if (error) throw error;

      setGame({ ...game, status: newStatus });
      toast.success(`Game status updated to ${newStatus.replace('_', ' ')}`);
      
      // Send automatic status change notification emails
      try {
        const { error: notificationError } = await supabase.functions.invoke('notify-game-status-change', {
          body: {
            gameId: gameId,
            previousStatus: previousStatus,
            newStatus: newStatus
          }
        });

        if (notificationError) {
          console.error('Error sending status change notifications:', notificationError);
          toast.warning("Status updated but email notifications failed to send");
        } else {
          toast.success("Status updated and participants notified by email!");
        }
      } catch (emailError) {
        console.error('Failed to send status change notifications:', emailError);
        toast.warning("Status updated but email notifications failed to send");
      }
    } catch (error: any) {
      toast.error("Failed to update game status: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSecondaryMarket = async () => {
    if (!game) return;
    
    setActionLoading('secondary');
    
    try {
      const { error } = await supabase
        .from("games")
        .update({ allow_secondary: !game.allow_secondary })
        .eq("id", gameId);

      if (error) throw error;

      setGame({ ...game, allow_secondary: !game.allow_secondary });
      toast.success(`Secondary market ${!game.allow_secondary ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      toast.error("Failed to toggle secondary market: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleLeaderboards = async () => {
    if (!game) return;
    
    setActionLoading('leaderboards');
    
    try {
      const { error } = await supabase
        .from("games")
        .update({ show_public_leaderboards: !game.show_public_leaderboards })
        .eq("id", gameId);

      if (error) throw error;

      setGame({ ...game, show_public_leaderboards: !game.show_public_leaderboards });
      toast.success(`Public leaderboards ${!game.show_public_leaderboards ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      toast.error("Failed to toggle leaderboards: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Game not found</h2>
          <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{game.name}</h1>
            <p className="text-gray-600">Game Organizer Dashboard</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Game Status */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Game Status & Controls</CardTitle>
              <CardDescription className="text-gray-600">Current status: {game.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Start Date</p>
                  <p className="text-gray-600">
                    {new Date(game.starts_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">End Date</p>
                  <p className="text-muted-foreground">
                    {new Date(game.ends_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Currency</p>
                  <p className="text-muted-foreground">{game.currency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-muted-foreground">{game.locale}</p>
                </div>
              </div>
              
              {/* Status Controls */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Game Status Controls</h4>
                  <div className="flex flex-wrap gap-2">
                    {game.status === 'draft' && (
                      <Button 
                        onClick={() => updateGameStatus('pre_market')}
                        disabled={actionLoading === 'status-pre_market'}
                        className="bg-[#FF6B35] hover:bg-[#E55A2B] text-foreground"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Pre-Market
                      </Button>
                    )}
                    {game.status === 'pre_market' && (
                      <Button 
                        onClick={() => updateGameStatus('open')}
                        disabled={actionLoading === 'status-open'}
                        className="bg-[#FF6B35] hover:bg-[#E55A2B] text-foreground"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Open Market
                      </Button>
                    )}
                    {game.status === 'open' && (
                      <Button 
                        variant="destructive"
                        onClick={() => updateGameStatus('closed')}
                        disabled={actionLoading === 'status-closed'}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Close Market
                      </Button>
                    )}
                    {game.status === 'closed' && (
                      <Button 
                        onClick={() => updateGameStatus('results')}
                        disabled={actionLoading === 'status-results'}
                        className="bg-[#FF6B35] hover:bg-[#E55A2B] text-foreground"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Show Results
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Market Controls */}
                <div>
                  <h4 className="font-medium mb-3">Market Controls</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline"
                      onClick={toggleSecondaryMarket}
                      disabled={actionLoading === 'secondary'}
                    >
                      {game.allow_secondary ? 'Disable' : 'Enable'} Secondary Market
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={toggleLeaderboards}
                      disabled={actionLoading === 'leaderboards'}
                    >
                      {game.show_public_leaderboards ? 'Hide' : 'Show'} Public Leaderboards
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/games/${gameId}/leaderboard`)}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Leaderboard
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/games/${gameId}/participants`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/games/${gameId}/participants`);
              }}
              className="cursor-pointer hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white border-gray-200 shadow-sm"
              aria-label="Manage Participants"
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Users className="h-8 w-8 mb-2 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Manage Participants</h3>
                <p className="text-sm text-gray-600 text-center">
                  Add and manage game participants
                </p>
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/games/${gameId}/startups`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/games/${gameId}/startups`);
              }}
              className="cursor-pointer hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white border-gray-200 shadow-sm"
              aria-label="Manage Startups"
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Building2 className="h-8 w-8 mb-2 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Manage Startups</h3>
                <p className="text-sm text-gray-600 text-center">
                  Add and configure startups
                </p>
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/games/${gameId}/settings`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/games/${gameId}/settings`);
              }}
              className="cursor-pointer hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white border-gray-200 shadow-sm"
              aria-label="Game Settings"
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Settings className="h-8 w-8 mb-2 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Game Settings</h3>
                <p className="text-sm text-gray-600 text-center">
                  Configure game parameters
                </p>
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/games/${gameId}/discover`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/games/${gameId}/discover`);
              }}
              className="cursor-pointer hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white border-gray-200 shadow-sm"
              aria-label="View Game"
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Play className="h-8 w-8 mb-2 text-orange-600" />
                <h3 className="font-semibold text-gray-900">View Game</h3>
                <p className="text-sm text-gray-600 text-center">
                  {game.status === "open" ? "Game is live!" : `Status: ${game.status}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Game Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.participants}</div>
                <p className="text-gray-600">
                  {stats.participants === 0 ? "No participants yet" : "Active participants"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Startups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.startups}</div>
                <p className="text-gray-600">
                  {stats.startups === 0 ? "No startups added" : "Available startups"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{game.currency} {stats.totalVolume.toLocaleString()}</div>
                <p className="text-gray-600">
                  {stats.activeTrades} trades executed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/games/${gameId}/participants`)}
                  className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invites
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/games/${gameId}/leaderboard`)}
                  className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Leaderboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}