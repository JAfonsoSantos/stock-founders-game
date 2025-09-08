import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export async function syncUserProfile(user: User) {
  if (!user) return null;

  try {
    // Extract data from Google OAuth user_metadata
    const firstName = user.user_metadata?.first_name || 
                     user.user_metadata?.given_name ||
                     user.user_metadata?.full_name?.split(' ')[0] ||
                     user.user_metadata?.name?.split(' ')[0] ||
                     null;

    const lastName = user.user_metadata?.last_name ||
                    user.user_metadata?.family_name ||
                    (user.user_metadata?.full_name?.split(' ').slice(1).join(' ')) ||
                    (user.user_metadata?.name?.split(' ').slice(1).join(' ')) ||
                    null;

    const avatarUrl = user.user_metadata?.avatar_url ||
                     user.user_metadata?.picture ||
                     null;

    const email = user.email || user.user_metadata?.email || null;

    // Update or insert user profile with Google data
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error syncing user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in syncUserProfile:', error);
    return null;
  }
}