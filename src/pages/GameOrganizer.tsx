import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Building2, Settings, Play, Pause, Mail, TrendingUp, BarChart3, Edit, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendInviteEmail, sendMarketOpenEmail, sendLastMinutesEmail, sendResultsEmail } from "@/lib/email";
import { GameImageUpload } from "@/components/GameImageUpload";
import { OrganizerNotifications } from "@/components/OrganizerNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  logo_url?: string;
  hero_image_url?: string;
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
  const isMobile = useIsMobile();
  const [game, setGame] = useState<Game | null>(null);
  const [stats, setStats] = useState<GameStats>({ participants: 0, startups: 0, totalVolume: 0, activeTrades: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<'logo' | 'header' | null>(null);

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
      const [participantsResult, venturesResult, tradesResult] = await Promise.all([
        supabase.from("participants").select("id", { count: "exact" }).eq("game_id", gameId),
        supabase.from("ventures").select("id", { count: "exact" }).eq("game_id", gameId),
        supabase.from("trades").select("qty, price_per_share").eq("game_id", gameId)
      ]);

      const totalVolume = tradesResult.data?.reduce((sum, trade) => 
        sum + (trade.qty * trade.price_per_share), 0) || 0;

      setStats({
        participants: participantsResult.count || 0,
        startups: venturesResult.count || 0,
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

  const handleImageUpload = (type: 'logo' | 'header', url: string) => {
    if (!game) return;
    
    const updatedGame = {
      ...game,
      [type === 'logo' ? 'logo_url' : 'hero_image_url']: url
    };
    
    setGame(updatedGame);
    setEditingImage(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'pre_market': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'open': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
      case 'results': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pre_market': return 'Pre-Market';
      case 'open': return 'Market Open';
      case 'closed': return 'Market Closed';
      case 'results': return 'Results Available';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
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
      {/* Hero Section */}
      <div className="relative">
        {/* Background */}
        <div 
          className={cn(
            "w-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 group cursor-pointer relative",
            isMobile ? "h-32" : "h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80"
          )}
          style={{
            backgroundImage: game.hero_image_url ? `url(${game.hero_image_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onClick={() => setEditingImage('header')}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
          
          {/* Edit Cover Image Button */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Button
              variant="secondary"
              size={isMobile ? "sm" : "default"}
              className="bg-white/90 text-gray-900 hover:bg-white"
            >
              <Edit className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
              {game.hero_image_url ? 'Edit cover' : 'Add cover'}
            </Button>
          </div>
        </div>
        
        {/* Header Controls */}
        <div className={cn("absolute top-4 flex justify-between items-center", isMobile ? "left-4 right-4" : "top-6 left-6 right-6")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isMobile ? "Back" : "Back to Dashboard"}
          </Button>
        </div>

        {/* Game Logo */}
        <div className={cn("absolute left-4 right-4", isMobile ? "-bottom-12" : "-bottom-16 left-8 right-8")}>
          <div className={cn("flex gap-4", isMobile ? "flex-col items-center text-center" : "flex-row items-end gap-6")}>
            <div 
              className={cn(
                "border-4 border-gray-50 rounded-2xl bg-white flex items-center justify-center group cursor-pointer relative flex-shrink-0",
                isMobile ? "h-24 w-24" : "h-32 w-32"
              )}
              onClick={() => setEditingImage('logo')}
            >
              {game.logo_url ? (
                <>
                  <img src={game.logo_url} alt={game.name} className="w-full h-full object-cover rounded-xl" />
                  <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/90 text-gray-900 hover:bg-white p-2 h-8 w-8"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center group-hover:opacity-75 transition-opacity flex flex-col justify-center h-full">
                  <div className={cn("text-gray-400 leading-relaxed", isMobile ? "text-xs" : "text-sm")}>
                    <div>Your</div>
                    <div>Logo</div>
                    <div>Here</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Event Title */}
            <div className={cn("flex-1", isMobile ? "pb-0" : "pb-2")}>
              <div className="bg-gray-50 px-4 py-2 rounded-lg inline-block">
                <h1 className={cn("font-bold text-gray-900 mb-1", isMobile ? "text-2xl" : "text-4xl")}>
                  {game.name}
                </h1>
                <p className={cn("text-gray-600", isMobile ? "text-sm" : "text-lg")}>
                  {isMobile ? "Organizer" : "Game Organizer Dashboard"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for absolute positioned content */}
      <div className={isMobile ? "h-16" : "h-20"}></div>

      {/* Status Badges and Main Actions */}
      <div className={cn("pb-8", isMobile ? "px-4" : "px-8")}>
        <div className="max-w-7xl mx-auto">
          <div className={cn("mb-6", isMobile ? "space-y-4" : "flex justify-between items-center mb-8")}>
            <div className={cn("gap-2", isMobile ? "flex flex-wrap" : "flex items-center gap-3")}>
              <div className={`px-3 py-2 rounded-lg font-medium border ${getStatusColor(game.status)} ${isMobile ? 'text-sm' : ''}`}>
                {getStatusLabel(game.status)}
              </div>
              <div className={cn("flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg", isMobile ? "text-sm" : "")}>
                <Users className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900">{stats.participants} {isMobile ? "" : "participants"}</span>
              </div>
              <div className={cn("flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg", isMobile ? "text-sm" : "")}>
                <Building2 className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900">{stats.startups} {isMobile ? "" : "startups"}</span>
              </div>
            </div>
            
            {/* Main Action Buttons */}
            <div className={cn("gap-2", isMobile ? "flex flex-col space-y-2" : "flex gap-3")}>
              {/* Preview and Edit buttons */}
              <Button 
                variant="outline"
                onClick={() => navigate(`/games/${game.id}/preview`)}
                className="px-4"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Game
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate(`/games/${game.id}/edit`)}
                className="px-4"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>

              {/* Main status control button */}
              {game.status === 'draft' && (
                <Button 
                  onClick={() => updateGameStatus('pre_market')}
                  disabled={actionLoading === 'status-pre_market'}
                  className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-6"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Pre-Market
                </Button>
              )}
              {game.status === 'pre_market' && (
                <Button 
                  onClick={() => updateGameStatus('open')}
                  disabled={actionLoading === 'status-open'}
                  className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-6"
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
                  className="px-6"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Close Market
                </Button>
              )}
              {game.status === 'closed' && (
                <Button 
                  onClick={() => updateGameStatus('results')}
                  disabled={actionLoading === 'status-results'}
                  className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-6"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Show Results
                </Button>
              )}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className={cn("gap-6", isMobile ? "space-y-6" : "grid lg:grid-cols-2 gap-8")}>
            {/* Left Column - Game Controls & Statistics */}
            <div className="space-y-6">
              {/* Organizer Notifications */}
              <OrganizerNotifications gameId={gameId!} />

              {/* Game Details */}
              <Card className="bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3 text-gray-900">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Settings className="h-6 w-6 text-blue-600" />
                    </div>
                    Game Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Start Date</span>
                    <span className="font-semibold text-gray-900">{new Date(game.starts_at).toLocaleDateString()}</span>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">End Date</span>
                    <span className="font-semibold text-gray-900">{new Date(game.ends_at).toLocaleDateString()}</span>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Currency</span>
                    <span className="font-semibold text-gray-900">{game.currency}</span>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Language</span>
                    <span className="font-semibold text-gray-900">{game.locale.toUpperCase()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Market Controls */}
              <Card className="bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3 text-gray-900">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    Market Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pb-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Secondary Market</span>
                      <p className="text-xs text-gray-500">Allow peer-to-peer trading</p>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={toggleSecondaryMarket}
                      disabled={actionLoading === 'secondary'}
                      className={game.allow_secondary ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    >
                      {game.allow_secondary ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Public Leaderboards</span>
                      <p className="text-xs text-gray-500">Show rankings publicly</p>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={toggleLeaderboards}
                      disabled={actionLoading === 'leaderboards'}
                      className={game.show_public_leaderboards ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                    >
                      {game.show_public_leaderboards ? 'Public' : 'Private'}
                    </Button>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-center pt-2">
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/games/${gameId}/leaderboard`)}
                      className="w-full"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Leaderboard
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Live Statistics */}
              <Card className="bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3 text-gray-900">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                    Live Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{stats.participants}</div>
                      <div className="text-sm text-gray-600">Participants</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{stats.startups}</div>
                      <div className="text-sm text-gray-600">Startups</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{game.currency} {stats.totalVolume.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total Volume</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{stats.activeTrades}</div>
                      <div className="text-sm text-gray-600">Trades</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              {/* Organizer Notifications */}
              {gameId && <OrganizerNotifications gameId={gameId} />}
              
              <Card
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/games/${gameId}/participants`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/games/${gameId}/participants`);
                }}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white border-gray-100 hover:border-orange-200 group"
                aria-label="Manage Participants"
              >
                <CardContent className="flex items-center p-8">
                  <div className="p-4 bg-orange-50 rounded-xl mr-6 group-hover:bg-orange-100 transition-colors">
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Participants</h3>
                    <p className="text-gray-600">
                      Add, edit, and manage game participants and their budgets
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/games/${gameId}/ventures`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/games/${gameId}/ventures`);
                }}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white border-gray-100 hover:border-orange-200 group"
                aria-label="Manage Ventures"
              >
                <CardContent className="flex items-center p-8">
                  <div className="p-4 bg-blue-50 rounded-xl mr-6 group-hover:bg-blue-100 transition-colors">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Ventures</h3>
                    <p className="text-gray-600">
                      Add and configure venture profiles and share distribution
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/games/${gameId}/settings`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/games/${gameId}/settings`);
                }}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white border-gray-100 hover:border-orange-200 group"
                aria-label="Game Settings"
              >
                <CardContent className="flex items-center p-8">
                  <div className="p-4 bg-purple-50 rounded-xl mr-6 group-hover:bg-purple-100 transition-colors">
                    <Settings className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Game Settings</h3>
                    <p className="text-gray-600">
                      Configure game parameters, rules, and customization
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/games/${gameId}/preview`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/games/${gameId}/preview`);
                }}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white border-gray-100 hover:border-orange-200 group"
                aria-label="Preview Game"
              >
                <CardContent className="flex items-center p-8">
                  <div className="p-4 bg-green-50 rounded-xl mr-6 group-hover:bg-green-100 transition-colors">
                    <Play className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Preview Game</h3>
                    <p className="text-gray-600">
                      Preview how the game looks to participants before launch
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modals */}
      {editingImage && gameId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingImage === 'logo' ? 'Edit Event Logo' : 'Edit Cover Image'}
            </h3>
            <GameImageUpload
              type={editingImage}
              currentUrl={editingImage === 'logo' ? game?.logo_url : game?.hero_image_url}
              onUpload={(url) => handleImageUpload(editingImage, url)}
              title={editingImage === 'logo' ? 'Event Logo' : 'Cover Image'}
              description={editingImage === 'logo' ? 'PNG, JPG até 2MB' : 'PNG, JPG até 5MB'}
              gameId={gameId}
            />
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setEditingImage(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}