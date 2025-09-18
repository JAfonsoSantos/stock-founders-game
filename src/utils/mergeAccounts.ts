import { supabase } from "@/integrations/supabase/client";
import { withRetry, withCircuitBreaker, withDeduplication } from "./networkUtils";

// Merges any demo/CSV-created profile rows for the given email into the current auth user.
// If oldUserId is provided, merges that specific profile.
export async function mergeAccounts(newUserId: string, email: string, oldUserId?: string) {
  const requestKey = `merge-accounts-${newUserId}-${email}`;
  
  return withDeduplication(requestKey, () =>
    withCircuitBreaker(`merge-accounts`, () =>
      withRetry(async () => {
        console.log(`Attempting to merge accounts for ${email}`);
        
        const { data, error } = await supabase.functions.invoke('merge-accounts', {
          body: {
            newUserId,
            email,
            oldUserId,
          },
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (error) {
          console.error('Error merging accounts:', error);
          // Don't throw for network errors, just log and continue
          if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
            console.warn('Network error during account merge, continuing without merge');
            return { success: true, mergedCount: 0, skipped: true };
          }
          throw error;
        }

        console.log(`Successfully merged accounts for ${email}`);
        return data;
      }, {
        maxRetries: 1,
        baseDelay: 1000,
        maxDelay: 5000
      })
    )
  );
}