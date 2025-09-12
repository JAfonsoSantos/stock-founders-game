import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameProfile } from "@/components/GameProfile";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface GameData {
  name: string;
  description?: string;
  logo_url?: string;
  hero_image_url?: string;
  starts_at: string;
  ends_at: string;
  currency: string;
  locale: string;
  allow_secondary: boolean;
  show_public_leaderboards: boolean;
  circuit_breaker: boolean;
  max_price_per_share: number | null;
  default_budgets: {
    founder: number;
    angel: number;
    vc: number;
  };
  organizer?: {
    name: string;
    avatar?: string;
  };
  participants_count?: number;
  startups_count?: number;
}

export default function GamePreview() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    loadGameData();
  }, [gameId]);

  const loadGameData = async () => {
    try {
      // Fetch game details
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;

      // Check if user is the owner
      if (game.owner_user_id !== user?.id) {
        toast.error("Access denied - you don't have permission to preview this game");
        navigate("/");
        return;
      }

      // Fetch organizer info
      const { data: organizer } = await supabase
        .from("users")
        .select("first_name, last_name, avatar_url")
        .eq("id", game.owner_user_id)
        .single();

      // Fetch participant count
      const { count: participantCount } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("game_id", gameId);

      // Fetch startup count
      const { count: startupCount } = await supabase
        .from("startups")
        .select("*", { count: "exact", head: true })
        .eq("game_id", gameId);

      // Fetch default budgets
      const { data: roles } = await supabase
        .from("game_roles")
        .select("role, default_budget")
        .eq("game_id", gameId);

      const budgets = roles?.reduce((acc, role) => {
        acc[role.role as keyof typeof acc] = role.default_budget;
        return acc;
      }, { founder: 10000, angel: 100000, vc: 1000000 }) || { founder: 10000, angel: 100000, vc: 1000000 };

      setGameData({
        name: game.name,
        description: game.description,
        logo_url: undefined, // Will be added later
        hero_image_url: undefined, // Will be added later
        starts_at: game.starts_at,
        ends_at: game.ends_at,
        currency: game.currency,
        locale: game.locale,
        allow_secondary: game.allow_secondary,
        show_public_leaderboards: game.show_public_leaderboards,
        circuit_breaker: game.circuit_breaker,
        max_price_per_share: game.max_price_per_share,
        default_budgets: budgets,
        organizer: organizer ? {
          name: `${organizer.first_name} ${organizer.last_name}`.trim(),
          avatar: organizer.avatar_url
        } : undefined,
        participants_count: participantCount || 0,
        startups_count: startupCount || 0,
      });
    } catch (error: any) {
      console.error("Error loading game data:", error);
      toast.error("Failed to load game data");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/games/${gameId}/organizer`);
  };

  const handleEdit = (type?: 'logo' | 'header') => {
    navigate(`/games/${gameId}/settings`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Game not found</h2>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go back to organizer dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameProfile
      gameData={gameData}
      isPreview={true}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}