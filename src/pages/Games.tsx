import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Settings, Play, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Game {
  id: string;
  name: string;
  status: string;
  starts_at: string;
  ends_at: string;
  currency: string;
  created_at: string;
}

interface Participation {
  id: string;
  role: string;
  initial_budget: number;
  current_cash: number;
  status: string;
  games: Game;
}

export default function Games() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [ownedGames, setOwnedGames] = useState<Game[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch owned games
      const { data: games, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .eq("owner_user_id", user?.id)
        .order("created_at", { ascending: false });

      if (gamesError) throw gamesError;
      setOwnedGames(games || []);

      // Fetch active participations only
      const { data: parts, error: partsError } = await supabase
        .from("participants")
        .select(`
          *,
          games (*)
        `)
        .eq("user_id", user?.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (partsError) throw partsError;
      setParticipations(parts || []);
    } catch (error: any) {
      toast.error("Failed to load games: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-muted text-muted-foreground";
      case "pre_market": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "open": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 animate-pulse";
      case "closed": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "results": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Games</h1>
          <p className="text-gray-600 mt-2">
            Manage your games and participate in investment simulations
          </p>
        </div>
        <Button onClick={() => navigate("/games/new")} className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create New Game
        </Button>
      </div>

      {/* Empty state */}
      {ownedGames.length === 0 && participations.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No games yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first game or accept an invitation to get started
          </p>
          <Button onClick={() => navigate("/games/new")} className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Game
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Owned Games */}
        {ownedGames.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Games</h2>
              <Button 
                onClick={() => navigate("/games/new")} 
                variant="outline" 
                size="sm"
                className="text-gray-700 border-gray-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Game
              </Button>
            </div>
            
            <div className="space-y-4">
              {ownedGames.map((game) => (
                <Card key={game.id} className="hover:shadow-lg transition-all duration-200 group bg-white border-gray-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg group-hover:text-orange-600 transition-colors text-gray-900">
                          {game.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          {new Date(game.starts_at).toLocaleDateString()} - {new Date(game.ends_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                        {game.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Currency:</span>
                        <span className="font-mono px-2 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700">
                          {game.currency}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {game.status === 'open' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => navigate(`/games/${game.id}/discover`)}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Enter Game
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/games/${game.id}/organizer`)}
                          className="hover:bg-gray-50 border-gray-200 text-gray-700"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Participations */}
        {participations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Investments</h2>
            
            <div className="space-y-4">
              {participations.map((participation) => (
                <Card key={participation.id} className="hover:shadow-lg transition-all duration-200 group bg-white border-gray-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {participation.games.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span className="font-medium text-primary">
                            {participation.role.toUpperCase()}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span>{participation.games.currency}</span>
                        </CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(participation.games.status)}`}>
                        {participation.games.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground text-xs">Initial Budget</span>
                        <p className="font-bold text-lg">
                          {participation.games.currency} {participation.initial_budget.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground text-xs">Available Cash</span>
                        <p className="font-bold text-lg">
                          {participation.games.currency} {participation.current_cash.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {participation.games.status === 'open' && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => navigate(`/games/${participation.games.id}/discover`)}
                          className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Enter Game
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/games/${participation.games.id}/me`)}
                        className="hover:bg-gray-50 border-gray-200 text-gray-700"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        My Portfolio
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}