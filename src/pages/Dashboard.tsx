import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Plus, Users, TrendingUp, Settings, Play, Sparkles, Crown } from "lucide-react";
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
  games: Game;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
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

      // Fetch participations
      const { data: parts, error: partsError } = await supabase
        .from("participants")
        .select(`
          *,
          games (*)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (partsError) throw partsError;
      setParticipations(parts || []);
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDemoGame = async () => {
    if (!user) return;

    try {
      // Create demo game
      const demoGameData = {
        owner_user_id: user.id,
        name: "Demo Startup Summit 2024",
        currency: "USD",
        locale: "en",
        starts_at: new Date(Date.now() + 60000).toISOString(), // Start in 1 minute
        ends_at: new Date(Date.now() + 3600000).toISOString(), // End in 1 hour
        allow_secondary: true,
        show_public_leaderboards: true,
        circuit_breaker: true,
        max_price_per_share: 10000,
        status: 'pre_market' as const
      };

      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert(demoGameData)
        .select()
        .single();

      if (gameError) throw gameError;

      // Create default role budgets
      const roleInserts = [
        { game_id: game.id, role: "founder" as const, default_budget: 10000 },
        { game_id: game.id, role: "angel" as const, default_budget: 100000 },
        { game_id: game.id, role: "vc" as const, default_budget: 1000000 },
      ];

      const { error: rolesError } = await supabase
        .from("game_roles")
        .insert(roleInserts);

      if (rolesError) throw rolesError;

      // Create demo startups
      const startupNames = [
        { name: "TechFlow AI", description: "AI-powered workflow automation platform for modern businesses" },
        { name: "GreenSync", description: "Sustainable energy management and optimization solutions" },
        { name: "HealthLink", description: "Digital health record integration and patient care platform" },
        { name: "EduSpace", description: "Immersive virtual reality experiences for education and training" }
      ];

      for (const startup of startupNames) {
        const { data: startupData, error: startupError } = await supabase
          .from("startups")
          .insert({
            game_id: game.id,
            name: startup.name,
            slug: startup.name.toLowerCase().replace(/\s+/g, '-'),
            description: startup.description,
            total_shares: 100,
            primary_shares_remaining: 80 // Pre-sold some shares
          })
          .select()
          .single();

        if (startupError) throw startupError;
      }

      toast.success("🎉 Demo game created! Check it out to explore how the platform works.");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to create demo game: " + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "pre_market": return "bg-yellow-100 text-yellow-800";
      case "open": return "bg-green-100 text-green-800";
      case "closed": return "bg-red-100 text-red-800";
      case "results": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Startup Stock Market</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-muted-foreground mb-4">
            Manage your games and track your investments in the startup ecosystem
          </p>
          
          {ownedGames.length === 0 && participations.length === 0 && (
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Crown className="h-5 w-5 mr-2 text-primary" />
                      Try our Demo Game!
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Experience the full Startup Stock Market with pre-configured startups and demo data.
                    </p>
                  </div>
                  <Button onClick={createDemoGame} className="shrink-0">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Owned Games */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Your Games</h3>
              <Button onClick={() => navigate("/games/new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Game
              </Button>
            </div>
            
            <div className="space-y-4">
              {ownedGames.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      You haven't created any games yet.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => navigate("/games/new")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Game
                      </Button>
                      <Button variant="outline" onClick={createDemoGame}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Try Demo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                ownedGames.map((game) => (
                  <Card key={game.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            {game.name}
                            {game.name.includes("Demo") && (
                              <Sparkles className="h-4 w-4 ml-2 text-primary" />
                            )}
                          </CardTitle>
                          <CardDescription>
                            {new Date(game.starts_at).toLocaleDateString()} - {new Date(game.ends_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                          {game.status.replace('_', ' ')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Currency: {game.currency}
                        </span>
                        <div className="flex space-x-2">
                          {game.status === 'open' && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => navigate(`/games/${game.id}/discover`)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Enter Game
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/games/${game.id}/organizer`)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Participations */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Your Investments</h3>
            
            <div className="space-y-4">
              {participations.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      You're not participating in any games yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                participations.map((participation) => (
                  <Card key={participation.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{participation.games.name}</CardTitle>
                          <CardDescription>
                            Role: {participation.role.toUpperCase()}
                          </CardDescription>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(participation.games.status)}`}>
                          {participation.games.status.replace('_', ' ')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Budget:</span>
                          <p className="font-medium">{participation.games.currency} {participation.initial_budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cash:</span>
                          <p className="font-medium">{participation.games.currency} {participation.current_cash.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/games/${participation.games.id}/me`)}
                        >
                          My Portfolio
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/games/${participation.games.id}/discover`)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Enter Game
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}