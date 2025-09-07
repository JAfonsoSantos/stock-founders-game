import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeGame(gameId: string) {
  const [gameData, setGameData] = useState<any>(null);

  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          console.log('Game update:', payload);
          if (payload.eventType === 'UPDATE') {
            setGameData(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return gameData;
}

export function useRealtimeStartups(gameId: string) {
  const [startups, setStartups] = useState<any[]>([]);

  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`startups:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'startups',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('Startup update:', payload);
          if (payload.eventType === 'UPDATE') {
            setStartups(prev => prev.map(s => 
              s.id === payload.new.id ? payload.new : s
            ));
          } else if (payload.eventType === 'INSERT') {
            setStartups(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return { startups, setStartups };
}

export function useRealtimeTrades(gameId: string) {
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`trades:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('New trade:', payload);
          setTrades(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return { trades, setTrades };
}

export function useRealtimeNotifications(participantId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!participantId) return;

    const channel = supabase
      .channel(`notifications:${participantId}`)
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
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participantId]);

  return { notifications, setNotifications };
}