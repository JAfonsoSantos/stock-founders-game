import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Game {
  id: string;
  name: string;
  status: string;
  starts_at: string;
  ends_at: string;
  currency: string;
  allow_secondary: boolean;
  circuit_breaker: boolean;
  circuit_breaker_active: boolean;
  circuit_breaker_until: string | null;
  created_at: string;
  locale: string;
  max_price_per_share: number | null;
  owner_user_id: string;
  show_public_leaderboards: boolean;
  updated_at: string;
}

interface GameContextType {
  currentGameId: string | null;
  activeGames: Game[];
  setCurrentGameId: (gameId: string | null) => void;
  refreshActiveGames: () => Promise<void>;
  loading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentGameId, setCurrentGameIdState] = useState<string | null>(null);
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const savedGameId = localStorage.getItem('currentGameId');
    if (savedGameId) {
      setCurrentGameIdState(savedGameId);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshActiveGames();
    }
  }, [user]);

  const setCurrentGameId = (gameId: string | null) => {
    setCurrentGameIdState(gameId);
    if (gameId) {
      localStorage.setItem('currentGameId', gameId);
    } else {
      localStorage.removeItem('currentGameId');
    }
  };

  const refreshActiveGames = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get games where user is owner or active participant
      const [ownedGamesRes, participationsRes] = await Promise.all([
        // Games owned by user
        supabase
          .from('games')
          .select('*')
          .eq('owner_user_id', user.id)
          .in('status', ['draft', 'pre_market', 'open', 'closed']),
        // Games where user is ACTIVE participant (not pending)
        supabase
          .from('participants')
          .select('games(*)')
          .eq('user_id', user.id)
          .eq('status', 'active')
      ]);

      const ownedGames = ownedGamesRes.data || [];
      const participatedGames = (participationsRes.data || [])
        .map(p => p.games)
        .filter((game): game is any => 
          game !== null && ['draft', 'pre_market', 'open', 'closed'].includes(game.status)
        );

      // Combine and deduplicate
      const allGames = [...ownedGames, ...participatedGames];
      const uniqueGames = allGames.filter((game, index, self) => 
        index === self.findIndex(g => g.id === game.id)
      );

      console.log('Active games found:', uniqueGames.map(g => ({id: g.id, name: g.name, status: g.status})));
      setActiveGames(uniqueGames);

      // Validate currentGameId is still active
      if (currentGameId && !uniqueGames.some(g => g.id === currentGameId)) {
        setCurrentGameId(null);
      }

    } catch (error) {
      console.error('Failed to load active games:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GameContext.Provider value={{
      currentGameId,
      activeGames,
      setCurrentGameId,
      refreshActiveGames,
      loading
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}