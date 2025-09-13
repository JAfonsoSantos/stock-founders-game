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
import { ConfirmDialog } from "@/components/ConfirmDialog";

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
  const [showInDevelopmentModal, setShowInDevelopmentModal] = useState(false);
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

  const handleDemoClick = () => {
    setShowInDevelopmentModal(true);
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
        {/* Hero Section */}
        <div className="mb-12">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                    Build your startup investment portfolio
                  </h1>
                  <p className="text-lg text-gray-600 mb-6">
                    Create games, discover startups, and simulate investment strategies in a realistic market environment.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => navigate("/games/new")} 
                      className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-6 py-3"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create New Game
                    </Button>
                    <Button 
                      variant="surface" 
                      onClick={handleDemoClick}
                      size="lg"
                      disabled
                      className="opacity-60 cursor-not-allowed"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Try Demo Game
                    </Button>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-6 h-64 flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Investment Simulation Platform</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Start with a popular template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Popular</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Startup Pitch Day</h3>
                <p className="text-sm text-gray-600 mb-4">Perfect for startup events and pitch competitions with multiple founders presenting.</p>
                <Button variant="surface" className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Crown className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">New</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">VC Investment Simulation</h3>
                <p className="text-sm text-gray-600 mb-4">Designed for investor events with angel investors and VCs evaluating opportunities.</p>
                <Button variant="surface" className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Innovation Challenge</h3>
                <p className="text-sm text-gray-600 mb-4">Corporate innovation challenges with multiple teams competing for investment.</p>
                <Button variant="surface" className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Welcome Message for Empty State */}
        {ownedGames.length === 0 && participations.length === 0 && (
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center text-gray-900">
                      <Crown className="h-5 w-5 mr-2 text-orange-600" />
                      Get Started with Demo Data
                    </h4>
                    <p className="text-sm text-gray-600">
                      Experience the full platform with pre-configured startups and demo data.
                    </p>
                  </div>
                  <Button onClick={handleDemoClick} disabled className="shrink-0 bg-[#FF6B35] hover:bg-[#E55A2B] text-white opacity-60 cursor-not-allowed">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                      <Button variant="surface" onClick={handleDemoClick} disabled className="opacity-60 cursor-not-allowed">
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
                              className="bg-green-600 hover:bg-green-700 text-foreground shadow-md"
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
                <Card className="bg-white border-gray-200 shadow-sm">
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

      <ConfirmDialog
        open={showInDevelopmentModal}
        onOpenChange={setShowInDevelopmentModal}
        title={t('common.inDevelopment')}
        description={t('common.inDevelopmentMessage')}
        confirmText={t('common.close')}
        cancelText=""
        onConfirm={() => setShowInDevelopmentModal(false)}
      />
    </div>
  );
}