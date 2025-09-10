import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Plus, Users, TrendingUp, Settings, Play, Sparkles, Crown, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

import { mergeAccounts } from "@/utils/mergeAccounts";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { profile, displayName, initials } = useUserProfile(user);
  const { t } = useI18n();
  const [ownedGames, setOwnedGames] = useState<Game[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      autoMergeAndFetchData();
    }
  }, [user]);

  const autoMergeAndFetchData = async () => {
    try {
      // Silently merge accounts in background
      if (user?.email) {
        try {
          await mergeAccounts(user.id, user.email);
        } catch (error) {
          // Silently fail - this is not critical
          console.log("Auto-merge not needed or failed:", error);
        }
      }
      
      // Fetch data after merge
      await fetchData();
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
      setLoading(false);
    }
  };

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

      // Create demo startups with more realistic data
      const startupNames = [
        { name: "TechFlow AI", description: "AI-powered workflow automation platform for modern businesses", shares: 100, price: 50 },
        { name: "GreenSync", description: "Sustainable energy management and optimization solutions", shares: 100, price: 25 },
        { name: "HealthLink", description: "Digital health record integration and patient care platform", shares: 100, price: 75 },
        { name: "EduSpace", description: "Immersive virtual reality experiences for education and training", shares: 100, price: 40 }
      ];

      const createdStartups = [];
      for (const startup of startupNames) {
        const { data: startupData, error: startupError } = await supabase
          .from("startups")
          .insert({
            game_id: game.id,
            name: startup.name,
            slug: startup.name.toLowerCase().replace(/\s+/g, '-'),
            description: startup.description,
            total_shares: startup.shares,
            primary_shares_remaining: Math.floor(startup.shares * 0.7), // 30% pre-sold
            last_vwap_price: startup.price
          })
          .select()
          .single();

        if (startupError) throw startupError;
        createdStartups.push({ ...startupData, initialPrice: startup.price });
      }

      // Create demo participants
      const demoParticipants = [
        { name: "Angel Smith", role: "angel", budget: 100000 },
        { name: "VC Partners", role: "vc", budget: 1000000 },
        { name: "Tech Founder", role: "founder", budget: 10000 },
        { name: "Serial Angel", role: "angel", budget: 100000 }
      ];

      const createdParticipants = [];
      for (const participant of demoParticipants) {
        const demoUserId = crypto.randomUUID();
        
        // Create demo user
        await supabase.from("users").insert({
          id: demoUserId,
          first_name: participant.name.split(' ')[0],
          last_name: participant.name.split(' ')[1] || ''
        });

        // Create participant
        const { data: participantData, error: participantError } = await supabase
          .from("participants")
          .insert({
            game_id: game.id,
            user_id: demoUserId,
            role: participant.role as "founder" | "angel" | "vc" | "organizer",
            initial_budget: participant.budget,
            current_cash: participant.budget * 0.7 // 30% already invested
          })
          .select()
          .single();

        if (participantError) throw participantError;
        createdParticipants.push(participantData);
      }

      // Create initial demo trades
      for (let i = 0; i < createdStartups.length; i++) {
        const startup = createdStartups[i];
        const participant = createdParticipants[i % createdParticipants.length];
        
        // Create some initial trades to establish pricing
        const tradeQuantity = 20 + Math.floor(Math.random() * 10);
        const tradePrice = startup.initialPrice + (Math.random() - 0.5) * 10;
        
        try {
          // Insert trade directly (simulating accepted primary market trade)
          await supabase.from("trades").insert({
            game_id: game.id,
            startup_id: startup.id,
            seller_participant_id: null, // Primary market
            buyer_participant_id: participant.id,
            qty: tradeQuantity,
            price_per_share: tradePrice,
            market_type: 'primary'
          });

          // Update participant cash
          await supabase
            .from("participants")
            .update({ 
              current_cash: participant.current_cash - (tradeQuantity * tradePrice)
            })
            .eq("id", participant.id);

          // Create position
          await supabase.from("positions").insert({
            participant_id: participant.id,
            startup_id: startup.id,
            qty_total: tradeQuantity,
            avg_cost: tradePrice
          });

        } catch (error) {
          console.log("Demo trade creation error (non-critical):", error);
        }
      }

      toast.success("🎉 Demo game created! Check it out to explore how the platform works.");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to create demo game: " + error.message);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">
            Welcome back! 👋
          </h2>
          <p className="text-gray-600 mb-4">
            Manage your games and track your investments in the startup ecosystem
          </p>
          
          {ownedGames.length === 0 && participations.length === 0 && (
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center text-gray-900">
                      <Crown className="h-5 w-5 mr-2 text-orange-600" />
                      Try our Demo Game!
                    </h4>
                    <p className="text-sm text-gray-600">
                      Experience the full Stox with pre-configured startups and demo data.
                    </p>
                  </div>
                  <Button onClick={createDemoGame} className="shrink-0 bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
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
              <h3 className="text-xl font-semibold text-gray-900">Your Games</h3>
              <Button onClick={() => navigate("/games/new")} className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Game
              </Button>
            </div>
            
            <div className="space-y-4">
              {ownedGames.length === 0 ? (
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">
                      You haven't created any games yet.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => navigate("/games/new")} className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Game
                      </Button>
                      <Button variant="outline" onClick={createDemoGame} className="border-gray-200 text-gray-700 hover:bg-gray-50">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Try Demo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                ownedGames.map((game) => (
                  <Card key={game.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group bg-white border-gray-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center group-hover:text-orange-600 transition-colors text-gray-900">
                            {game.name}
                            {game.name.includes("Demo") && (
                              <Sparkles className="h-4 w-4 ml-2 text-orange-600 animate-pulse" />
                            )}
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
                  <Card key={participation.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/games/${participation.games.id}/me`)}
                          className="flex-1"
                        >
                          My Portfolio
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/games/${participation.games.id}/discover`)}
                          className="flex-1"
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