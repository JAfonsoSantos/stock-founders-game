import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { syncUserProfile } from '@/utils/syncUserProfile';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function useUserProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // First try to sync user profile from user_metadata (especially for Google OAuth users)
      await syncUserProfile(user);

      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        // If no profile in users table, use auth user data
        setProfile({
          id: user.id,
          first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
          last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
          email: user.email || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
        });
      } else if (data) {
        // Use database profile (which should now be synced with Google data)
        setProfile(data);
      } else {
        // This shouldn't happen after sync, but as a fallback
        const fallbackProfile = {
          id: user.id,
          first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
          last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
          email: user.email || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
        };
        setProfile(fallbackProfile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      // Fallback to auth user data
      setProfile({
        id: user.id,
        first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
        last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
        email: user.email || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (!profile) return null;
    
    const firstName = profile.first_name?.trim();
    const lastName = profile.last_name?.trim();
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return profile.email;
    }
  };

  const getInitials = () => {
    if (!profile) return '';
    
    const firstName = profile.first_name?.trim();
    const lastName = profile.last_name?.trim();
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (lastName) {
      return lastName[0].toUpperCase();
    } else if (profile.email) {
      return profile.email[0].toUpperCase();
    }
    return 'U';
  };

  return {
    profile,
    loading,
    displayName: getDisplayName(),
    initials: getInitials(),
    refreshProfile: fetchProfile
  };
}