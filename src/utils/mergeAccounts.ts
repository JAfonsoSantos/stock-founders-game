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
          }
        });

        if (error) {
          console.error('Error merging accounts:', error);
          throw error;
        }

        console.log(`Successfully merged accounts for ${email}`);
        return data;
      }, {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 10000
      })
    )
  );
}