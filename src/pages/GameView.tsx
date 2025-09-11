import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameProfile } from "@/components/GameProfile";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function GameView() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<any>(null);
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    if (gameId) {
      loadGameData();
    }
  }, [gameId]);

  const loadGameData = async () => {
    try {
      setLoading(true);

      // Get game data
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select(`
          *,
          game_roles (
            role,
            default_budget
          )
        `)
        .eq('id', gameId)
        .single();

      if (gameError) {
        console.error('Error loading game:', gameError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Game not found"
        });
        navigate('/');
        return;
      }

      // Get organizer info from auth users metadata
      const { data: ownerProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', game.owner_user_id)
        .single();

      // Check if user is already a participant
      const { data: participant } = await supabase
        .from('participants')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', user?.id)
        .single();

      // Get participants count
      const { count: participantsCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameId);

      // Get startups count
      const { count: startupsCount } = await supabase
        .from('startups')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameId);

      // Convert game roles to default budgets
      const defaultBudgets = {
        founder: game.game_roles?.find((r: any) => r.role === 'founder')?.default_budget || 10000,
        angel: game.game_roles?.find((r: any) => r.role === 'angel')?.default_budget || 100000,
        vc: game.game_roles?.find((r: any) => r.role === 'vc')?.default_budget || 1000000,
      };

      const formattedGameData = {
        name: game.name,
        description: "", // Add description field to games table if needed
        logo_url: "", // Add logo_url field to games table if needed
        hero_image_url: "", // Add hero_image_url field to games table if needed
        starts_at: game.starts_at,
        ends_at: game.ends_at,
        currency: game.currency,
        locale: game.locale,
        allow_secondary: game.allow_secondary,
        show_public_leaderboards: game.show_public_leaderboards,
        circuit_breaker: game.circuit_breaker,
        max_price_per_share: game.max_price_per_share,
        default_budgets: defaultBudgets,
        organizer: {
          name: (ownerProfile?.first_name && ownerProfile?.last_name) 
            ? `${ownerProfile.first_name} ${ownerProfile.last_name}` 
            : ownerProfile?.email || 'Event Organizer',
          avatar: ownerProfile?.avatar_url,
        },
        participants_count: participantsCount || 0,
        startups_count: startupsCount || 0,
      };

      setGameData(formattedGameData);
      setCanJoin(!participant && game.status === 'pre_market');
    } catch (error) {
      console.error('Error loading game data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load game data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    try {
      // Navigate to join page for this specific game
      navigate(`/join/${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join game"
      });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Game not found</h2>
          <p className="text-gray-600 mb-4">The game you're looking for doesn't exist or you don't have access to it.</p>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameProfile
      gameData={gameData}
      isPreview={false}
      onBack={handleBack}
      onJoinGame={canJoin ? handleJoinGame : undefined}
    />
  );
}