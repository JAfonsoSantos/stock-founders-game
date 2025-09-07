import { supabase } from "@/integrations/supabase/client";

export async function mergeAccounts(oldUserId: string, newUserId: string, email: string) {
  try {
    const { data, error } = await supabase.functions.invoke('merge-accounts', {
      body: {
        oldUserId,
        newUserId,
        email
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