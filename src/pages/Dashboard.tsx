import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Plus, Users, TrendingUp, Settings, Play, Sparkles, Crown, User, LogOut, Clock, Store, UserPlus } from "lucide-react";
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
  logo_url?: string;
  hero_image_url?: string;
  owner_user_id: string;
  asset_singular?: string;
}

interface Participation {
  id: string;
  role: string;
  initial_budget: number;
  current_cash: number;
  games: Game;
}

interface Venture {
  id: string;
  name: string;
  logo_url?: string;
  slug: string;
}

interface ExtendedGame extends Game {
  isOwner: boolean;
  participationData?: Participation;
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
  const [userVenture, setUserVenture] = useState<Venture | null>(null);
  const [venturesByGame, setVenturesByGame] = useState<Record<string, Venture | null>>({});
  const [ventureLoadingState, setVentureLoadingState] = useState<Record<string, boolean>>({});
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

  const fetchUserVenture = async (gameId: string, participantId: string) => {
    // Set loading state
    setVentureLoadingState(prev => ({ ...prev, [gameId]: true }));
    
    try {
      console.log(`Fetching venture for game ${gameId}, participant ${participantId}`);
      
      // Use maybeSingle() to get exactly one result or null - this prevents array issues
      const { data: founderMember, error } = await supabase
        .from('founder_members')
        .select(`
          ventures (
            id,
            name,
            logo_url,
            slug
          )
        `)
        .eq('participant_id', participantId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching founder_members:', error);
        throw error;
      }

      if (founderMember?.ventures) {
        console.log(`Found venture for game ${gameId}:`, founderMember.ventures);
        const venture = founderMember.ventures as Venture;
        
        setVenturesByGame(prev => ({
          ...prev,
          [gameId]: venture
        }));
        
        // Keep the old userVenture for backward compatibility with priorityGame
        if (gameId === priorityGame?.id) {
          setUserVenture(venture);
        }
      } else {
        console.log(`No venture found in founder_members for game ${gameId} and participant ${participantId}`);
        // If no founder_member link found, try to find orphan ventures and auto-fix
        await checkAndFixOrphanVentures(gameId, participantId);
      }
    } catch (error: any) {
      console.error('Error in fetchUserVenture for game:', gameId, 'participant:', participantId, error);
      // Clear any venture data for this game to prevent stale state
      setVenturesByGame(prev => ({
        ...prev,
        [gameId]: undefined
      }));
      
      // Only try orphan venture fix if it's not a PGRST116 (no rows) error
      if (!error.code || error.code !== 'PGRST116') {
        await checkAndFixOrphanVentures(gameId, participantId);
      }
    } finally {
      // Always clear loading state
      setVentureLoadingState(prev => ({ ...prev, [gameId]: false }));
    }
  };

  const checkAndFixOrphanVentures = async (gameId: string, participantId: string) => {
    try {
      // Check if there are ventures in this game where the user is a founder but not linked
      const { data: orphanVentures } = await supabase
        .from('ventures')
        .select('id, name, slug, logo_url')
        .eq('game_id', gameId);

      if (orphanVentures && orphanVentures.length > 0) {
        // Try to call the fix function (this might help in some cases)
        try {
          const { data } = await supabase.rpc('fix_orphan_ventures');
          console.log('Auto-fix orphan ventures result:', data);
        } catch (fixError) {
          console.log('Could not auto-fix orphan ventures:', fixError);
        }

        // Retry fetching the venture after attempting fix
        const { data: retryFounderMembers } = await supabase
          .from('founder_members')
          .select(`
            ventures (
              id,
              name,
              logo_url,
              slug
            )
          `)
          .eq('participant_id', participantId)
          .limit(1);
        
        const founderMember = retryFounderMembers?.[0];

        if (founderMember?.ventures) {
          setVenturesByGame(prev => ({
            ...prev,
            [gameId]: founderMember.ventures as Venture
          }));
          if (gameId === priorityGame?.id) {
            setUserVenture(founderMember.ventures as Venture);
          }
          return;
        }
      }

      // If still no venture found, set as null
      setVenturesByGame(prev => ({
        ...prev,
        [gameId]: null
      }));
      if (gameId === priorityGame?.id) {
        setUserVenture(null);
      }
    } catch (error) {
      console.log('Error checking for orphan ventures:', error);
      setVenturesByGame(prev => ({
        ...prev,
        [gameId]: null
      }));
      if (gameId === priorityGame?.id) {
        setUserVenture(null);
      }
    }
  };

  // Get active games (pre_market or open status)
  const activeOwnedGames = ownedGames.filter(game => 
    game.status === 'pre_market' || game.status === 'open'
  );
  
  // Include draft games for participants so they can see games they're invited to
  const activeParticipations = participations.filter(participation => 
    participation.games.status === 'draft' || 
    participation.games.status === 'pre_market' || 
    participation.games.status === 'open'
  );
  
  const hasActiveGames = activeOwnedGames.length > 0 || activeParticipations.length > 0;

  // Logic to detect priority game scenario
  const allActiveGames: ExtendedGame[] = [
    ...activeOwnedGames.map(game => ({ ...game, isOwner: true })),
    ...activeParticipations.map(participation => ({ 
      ...participation.games, 
      isOwner: participation.games.owner_user_id === user?.id, // Check if user is actually the owner
      participationData: participation 
    }))
  ];

  // Remove duplicates (case where user is owner and participant of same game)
  const uniqueActiveGames = allActiveGames.filter((game, index, self) => 
    index === self.findIndex(g => g.id === game.id)
  );

  // Sort by start date (next first)
  const sortedActiveGames = uniqueActiveGames.sort((a, b) => 
    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );

  const shouldShowSingleGameCard = sortedActiveGames.length > 0;
  const priorityGame = sortedActiveGames[0];

  // Fetch venture for priority game if user is a founder
  useEffect(() => {
    if (priorityGame && !priorityGame.isOwner && priorityGame.participationData?.role === 'founder') {
      fetchUserVenture(priorityGame.id, priorityGame.participationData.id);
    }
  }, [priorityGame]);

  // Fetch ventures for all games where user is a founder
  useEffect(() => {
    const founderParticipations = activeParticipations.filter(p => p.role === 'founder');
    founderParticipations.forEach(participation => {
      fetchUserVenture(participation.games.id, participation.id);
    });
  }, [activeParticipations]);

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

  // Countdown hook
  const useCountdown = (targetDate: string) => {
    const [timeLeft, setTimeLeft] = useState('');
    
    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const target = new Date(targetDate).getTime();
        const difference = target - now;
        
        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            setTimeLeft(`Começa em ${days} ${days === 1 ? 'dia' : 'dias'}`);
          } else if (hours > 0) {
            setTimeLeft(`Começa em ${hours} ${hours === 1 ? 'hora' : 'horas'}`);
          } else if (minutes > 0) {
            setTimeLeft(`Começa em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
          } else {
            setTimeLeft('Começando agora!');
          }
        } else {
          setTimeLeft('Evento ativo!');
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }, [targetDate]);
    
    return timeLeft;
  };

  // Single Active Game Card Component
  const SingleActiveGameCard = ({ game }: { game: ExtendedGame }) => {
    const timeLeft = useCountdown(game.starts_at);
    
    const getActionButtons = () => {
      if (game.isOwner) {
        if (game.status === 'open') {
          return [
            { text: 'Start Trading', path: `/games/${game.id}/discover`, icon: Play, variant: 'default' as const, iconOnly: false },
            { text: 'Manage Game', path: `/games/${game.id}/organizer`, icon: Settings, variant: 'outline' as const, iconOnly: false },
            { text: 'Manage Participants', path: `/games/${game.id}/participants`, icon: UserPlus, variant: 'outline' as const, iconOnly: true },
            { text: 'Manage Ventures', path: `/games/${game.id}/ventures`, icon: Store, variant: 'outline' as const, iconOnly: true }
          ];
        }
        return [
          { text: 'View Game', path: `/games/${game.id}/preview`, icon: Play, variant: 'default' as const, iconOnly: false },
          { text: 'Manage Game', path: `/games/${game.id}/organizer`, icon: Settings, variant: 'outline' as const, iconOnly: false },
          { text: 'Manage Participants', path: `/games/${game.id}/participants`, icon: UserPlus, variant: 'outline' as const, iconOnly: true },
          { text: 'Manage Ventures', path: `/games/${game.id}/ventures`, icon: Store, variant: 'outline' as const, iconOnly: true }
        ];
      }
      
      // Check if user is founder and get venture for this specific game
      const gameVenture = venturesByGame[game.id];
      const isLoadingVenture = ventureLoadingState[game.id];
      const assetName = game.asset_singular || 'Startup';
      
      console.log(`Game ${game.id} - Venture:`, gameVenture, 'Loading:', isLoadingVenture, 'Role:', game.participationData?.role);
      
      if (game.participationData?.role === 'founder') {
        // Show loading state while fetching venture
        if (isLoadingVenture) {
          return [
            { text: 'Loading...', path: '#', icon: Clock, variant: 'outline' as const, iconOnly: false }
          ];
        }
        
        // If we have venture data (not null and not undefined)
        if (gameVenture) {
          return [
            { text: 'View Game', path: `/games/${game.id}/discover`, icon: Play, variant: 'default' as const, iconOnly: false },
            { text: `Edit ${assetName}`, path: `/games/${game.id}/ventures/${gameVenture.slug}/admin`, icon: Store, variant: 'outline' as const, iconOnly: false }
          ];
        }
        
        // Only show "Create Startup" if we've finished loading and definitely have no venture
        if (gameVenture === null && !isLoadingVenture) {
          return [
            { text: `Create ${assetName}`, path: `/games/${game.id}/founder-onboarding`, icon: Plus, variant: 'default' as const, iconOnly: false }
          ];
        }
        
        // While we're still determining the venture status, show a neutral state
        return [
          { text: 'Loading...', path: '#', icon: Clock, variant: 'outline' as const, iconOnly: false }
        ];
      }
      
      if (game.status === 'open') {
        return [
          { text: 'Start Trading', path: `/games/${game.id}/discover`, icon: Play, variant: 'default' as const }
        ];
      }
      
      return [
        { text: 'View Game', path: `/games/${game.id}`, icon: Play, variant: 'default' as const }
      ];
    };

    const actionButtons = getActionButtons();
    
    return (
      <Card 
        className="mb-6 lg:mb-12 hover:shadow-lg transition-all duration-200"
      >
        <CardContent className="p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-center">
            {/* Info Section */}
            <div>
              <h2 className="text-xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2">{game.name}</h2>
              
              {game.status !== 'open' && (
                <div className="flex items-center gap-2 text-sm lg:text-lg text-orange-600 font-semibold mb-3 lg:mb-4">
                  <Clock className="h-4 w-4 lg:h-5 lg:w-5" />
                  {timeLeft}
                </div>
              )}
              
              {game.status === 'open' && (
                <div className="flex items-center gap-2 text-sm lg:text-lg text-green-600 font-semibold mb-3 lg:mb-4">
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full"></div>
                  Evento ativo!
                </div>
              )}
              
              {userVenture && (
                <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4 p-2 lg:p-3 bg-gray-50 rounded-lg">
                  {userVenture.logo_url && (
                    <img 
                      src={userVenture.logo_url} 
                      alt={userVenture.name}
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <span className="text-xs lg:text-sm text-gray-600">Your venture:</span>
                    <p className="font-semibold text-sm lg:text-base text-gray-900">{userVenture.name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-2 lg:gap-4 mb-4 lg:mb-6">
                <span className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${getStatusColor(game.status)}`}>
                  {game.status === 'draft' ? 'RASCUNHO' : 
                   game.status === 'pre_market' ? 'PRE-MARKET' : 
                   game.status === 'open' ? 'ABERTO' : game.status.toUpperCase()}
                </span>
                
                {game.participationData && (
                  <span className={`text-xs lg:text-sm px-2 lg:px-3 py-1 rounded-full font-medium text-white ${
                    game.participationData.role === 'vc' ? 'bg-purple-600' : 
                    game.participationData.role === 'angel' ? 'bg-yellow-600' : 'bg-green-600'
                  }`}>
                    {game.participationData.role.toUpperCase()}
                  </span>
                )}

                {game.isOwner && (
                  <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full font-medium">OWNER</span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 lg:gap-2">
                {actionButtons.map((button, index) => (
                  <Button 
                    key={index}
                    size={button.iconOnly ? "icon" : "sm"}
                    variant={button.variant}
                    className={`
                      ${button.variant === 'default' ? "bg-[#FF6B35] hover:bg-[#E55A2B] text-white" : ""}
                      ${!button.iconOnly && index < 2 ? "flex-1 min-w-0 text-xs lg:text-sm" : ""}
                      ${button.iconOnly ? "flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10" : "h-8 lg:h-10"}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(button.path);
                    }}
                    title={button.iconOnly ? button.text : undefined}
                  >
                    <button.icon className={button.iconOnly ? "h-3 w-3 lg:h-4 lg:w-4" : "h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2"} />
                    {!button.iconOnly && button.text}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Visual Section */}
            <div className="relative mt-4 lg:mt-0">
              {game.hero_image_url ? (
                <div 
                  className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl h-40 lg:h-64 bg-cover bg-center"
                  style={{ backgroundImage: `url(${game.hero_image_url})` }}
                >
                  <div className="absolute inset-0 bg-black/10 rounded-xl"></div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-4 lg:p-6 h-40 lg:h-64 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 lg:h-16 lg:w-16 text-orange-600 mx-auto mb-2 lg:mb-4" />
                    <p className="text-sm lg:text-base text-gray-600 font-medium">Investment Simulation</p>
                  </div>
                </div>
              )}
              
              {game.logo_url && (
                <div className="absolute top-2 left-2 lg:top-4 lg:left-4">
                  <img 
                    src={game.logo_url} 
                    alt={`${game.name} logo`}
                    className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg bg-white p-1 lg:p-2 shadow-md"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="container mx-auto px-0 py-4 lg:py-8">
        {/* Single Active Game Card - appears first if applicable */}
        {shouldShowSingleGameCard && (
          <SingleActiveGameCard game={priorityGame} />
        )}
        
        {/* Hero Section - appears after single game card or first if no single game */}
        <div className="mb-6 lg:mb-12">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-center">
                <div>
                  <h1 className="text-2xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 lg:mb-4">
                    Build your startup investment portfolio
                  </h1>
                  <p className="text-sm lg:text-lg text-gray-600 mb-4 lg:mb-6">
                    Create games, discover startups, and simulate investment strategies in a realistic market environment.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                    <Button 
                      onClick={() => navigate("/games/new")} 
                      className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 lg:px-6 py-2 lg:py-3 h-9 lg:h-11"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                      Create New Game
                    </Button>
                    <Button 
                      variant="surface" 
                      onClick={handleDemoClick}
                      size="sm"
                      disabled
                      className="opacity-60 cursor-not-allowed h-9 lg:h-11"
                    >
                      <Play className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
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

        {/* Active Games Section - only show if NOT single game scenario */}
        {hasActiveGames && !shouldShowSingleGameCard && (
          <div className="mb-6 lg:mb-12">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Active Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Active Owned Games */}
              {activeOwnedGames.map((game) => (
                <Card key={`owned-${game.id}`} className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group bg-white border-gray-200">
                  <div 
                    className="relative h-24 lg:h-32 bg-gradient-to-br from-orange-100 to-orange-50"
                    style={game.hero_image_url ? {
                      backgroundImage: `url(${game.hero_image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    } : {}}
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                    {game.logo_url && (
                      <div className="absolute top-2 left-2 lg:top-3 lg:left-3">
                        <img 
                          src={game.logo_url} 
                          alt={`${game.name} logo`}
                          className="w-6 h-6 lg:w-10 lg:h-10 rounded-lg bg-white p-0.5 lg:p-1 shadow-sm"
                        />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 lg:top-3 lg:right-3">
                      <span className={`px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                        {game.status === 'draft' ? 'DRAFT' : game.status === 'pre_market' ? 'PRE-MARKET' : 'LIVE'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 lg:bottom-3 lg:left-3">
                      <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full font-medium">OWNER</span>
                    </div>
                  </div>
                  <CardContent className="p-3 lg:p-4">
                    <h3 className="font-semibold text-sm lg:text-base text-gray-900 mb-1 lg:mb-2 truncate">{game.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-600 mb-2 lg:mb-3">
                      {new Date(game.starts_at).toLocaleDateString()} • {game.currency}
                    </p>
                    <div className="flex gap-1 lg:gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/games/${game.id}/preview`)}
                        className="flex-1 text-xs h-7 lg:h-8"
                      >
                        View Profile
                      </Button>
                      {game.status === 'open' ? (
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/games/${game.id}/discover`)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          Trade
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/games/${game.id}/organizer`)}
                          className="flex-1 bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-xs"
                        >
                          Manage
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Active Participations */}
              {activeParticipations.map((participation) => (
                <Card key={`participation-${participation.id}`} className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group bg-white border-gray-200">
                  <div 
                    className="relative h-32 bg-gradient-to-br from-blue-100 to-blue-50"
                    style={participation.games.hero_image_url ? {
                      backgroundImage: `url(${participation.games.hero_image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    } : {}}
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                    {participation.games.logo_url && (
                      <div className="absolute top-3 left-3">
                        <img 
                          src={participation.games.logo_url} 
                          alt={`${participation.games.name} logo`}
                          className="w-10 h-10 rounded-lg bg-white p-1 shadow-sm"
                        />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(participation.games.status)}`}>
                        {participation.games.status === 'draft' ? 'EM PREPARAÇÃO' : 
                         participation.games.status === 'pre_market' ? 'PRE-MARKET' : 'LIVE'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium text-white ${
                        participation.role === 'vc' ? 'bg-purple-600' : 
                        participation.role === 'angel' ? 'bg-yellow-600' : 'bg-green-600'
                      }`}>
                        {participation.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{participation.games.name}</h3>
                    <p className="text-xs text-gray-600 mb-3">
                      {participation.games.currency} {participation.current_cash.toLocaleString()} available
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(
                          participation.games.owner_user_id === user?.id 
                            ? `/games/${participation.games.id}/preview` 
                            : `/games/${participation.games.id}`
                        )}
                        className="flex-1 text-xs"
                      >
                        View Profile
                      </Button>
                      {participation.games.status === 'open' ? (
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/games/${participation.games.id}/discover`)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          Trade
                        </Button>
                      ) : participation.games.status === 'draft' ? (
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/games/${participation.games.id}`)}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs"
                        >
                          Aguardar
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/games/${participation.games.id}/me`)}
                          className="flex-1 bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-xs"
                        >
                          Portfolio
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

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