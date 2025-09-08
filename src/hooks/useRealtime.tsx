import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeConfig {
  table: string;
  gameId?: string;
  onUpdate?: (payload: any) => void;
  onInsert?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealtimeSubscription(config: RealtimeConfig) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Create unique channel name
    const channelName = `${config.table}_${config.gameId || 'global'}_${Date.now()}`;
    
    console.log(`Setting up realtime subscription for ${config.table}`, { gameId: config.gameId });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: config.table,
          filter: config.gameId ? `game_id=eq.${config.gameId}` : undefined
        },
        (payload) => {
          console.log(`Real-time update for ${config.table}:`, payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              config.onInsert?.(payload);
              break;
            case 'UPDATE':
              config.onUpdate?.(payload);
              break;
            case 'DELETE':
              config.onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${config.table}:`, status);
      });

    channelRef.current = channel;

    return () => {
      console.log(`Cleaning up realtime subscription for ${config.table}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [config.table, config.gameId]);

  return channelRef.current;
}

// Hook for startup price updates
export function useStartupPriceUpdates(gameId: string, onPriceUpdate: (startup: any) => void) {
  return useRealtimeSubscription({
    table: 'startups',
    gameId,
    onUpdate: (payload) => {
      // Only trigger if VWAP price changed
      if (payload.new.last_vwap_price !== payload.old.last_vwap_price) {
        onPriceUpdate(payload.new);
      }
    }
  });
}

// Hook for new trades
export function useTradeUpdates(gameId: string, onNewTrade: (trade: any) => void) {
  return useRealtimeSubscription({
    table: 'trades',
    gameId,
    onInsert: (payload) => {
      onNewTrade(payload.new);
    }
  });
}

// Hook for portfolio updates
export function usePositionUpdates(participantId: string, onPositionUpdate: (position: any) => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`positions_${participantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
          filter: `participant_id=eq.${participantId}`
        },
        (payload) => {
          console.log('Position update:', payload);
          onPositionUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participantId, onPositionUpdate]);
}

// Hook for game status updates
export function useGameUpdates(gameId: string, onGameUpdate: (game: any) => void) {
  return useRealtimeSubscription({
    table: 'games',
    onUpdate: (payload) => {
      if (payload.new.id === gameId) {
        onGameUpdate(payload.new);
      }
    }
  });
}

// Hook for notification updates
export function useNotificationUpdates(participantId: string, onNotification: (notification: any) => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`notifications_${participantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `to_participant_id=eq.${participantId}`
        },
        (payload) => {
          console.log('New notification:', payload);
          onNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participantId, onNotification]);
}