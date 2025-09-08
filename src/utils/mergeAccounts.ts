import { supabase } from "@/integrations/supabase/client";

// Merges any demo/CSV-created profile rows for the given email into the current auth user.
// If oldUserId is provided, merges that specific profile.
export async function mergeAccounts(newUserId: string, email: string, oldUserId?: string) {
  try {
    const { data, error } = await supabase.functions.invoke('merge-accounts', {
      body: {
        newUserId,
        email,
        oldUserId,
      }
    });

    if (error) {
      console.error('Error merging accounts:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to merge accounts:', error);
    throw error;
  }
}