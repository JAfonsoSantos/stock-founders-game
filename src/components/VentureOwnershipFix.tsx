import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserCog } from 'lucide-react';

interface VentureOwnershipFixProps {
  ventureIdea: {
    id: string;
    name: string;
    user_id: string;
    users?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
  };
  gameId: string;
  onFixed: () => void;
}

export function VentureOwnershipFix({ ventureIdea, gameId, onFixed }: VentureOwnershipFixProps) {
  const [loading, setLoading] = useState(false);
  const [availableParticipants, setAvailableParticipants] = useState<any[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isOrphaned, setIsOrphaned] = useState(false);

  // Check if the venture idea owner is a participant in the game
  const checkIfOrphaned = async () => {
    try {
      const { data: participant, error } = await supabase
        .from('participants')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', ventureIdea.user_id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      // If no participant found, this venture idea is orphaned
      setIsOrphaned(!participant);
    } catch (error) {
      console.error('Error checking if venture is orphaned:', error);
    }
  };

  useEffect(() => {
    checkIfOrphaned();
  }, [ventureIdea.user_id, gameId]);

  const loadAvailableParticipants = async () => {
    try {
      const { data: participants, error } = await supabase
        .from('participants')
        .select(`
          id,
          user_id,
          users!inner(first_name, last_name, email)
        `)
        .eq('game_id', gameId)
        .eq('status', 'active');

      if (error) throw error;

      // Filter participants to find potential matches for account consolidation
      const ownerEmail = ventureIdea.users?.email || '';
      const potentialMatches = participants?.filter(p => {
        const participantEmail = p.users.email || '';
        // Look for similar email addresses (same local part, different domain)
        const ownerLocal = ownerEmail.split('@')[0];
        const participantLocal = participantEmail.split('@')[0];
        return ownerLocal === participantLocal && participantEmail !== ownerEmail;
      }) || [];

      setAvailableParticipants(potentialMatches);
      if (potentialMatches.length === 1) {
        setSelectedParticipant(potentialMatches[0].user_id);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error('Failed to load participants');
    }
  };

  const handleOpenDialog = () => {
    setShowDialog(true);
    loadAvailableParticipants();
  };

  const handleTransferOwnership = async () => {
    if (!selectedParticipant) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('transfer_venture_idea_ownership', {
        p_venture_idea_id: ventureIdea.id,
        p_new_user_id: selectedParticipant
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success(`Ownership transferred successfully! ${ventureIdea.name} can now be invited to the game.`);
      setShowDialog(false);
      onFixed();
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(error.message || 'Failed to transfer ownership');
    } finally {
      setLoading(false);
    }
  };

  if (!isOrphaned) return null;

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleOpenDialog}
          className="text-orange-600 border-orange-200 hover:bg-orange-50"
        >
          <UserCog className="h-4 w-4 mr-1" />
          Fix Owner
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fix Venture Ownership</AlertDialogTitle>
          <AlertDialogDescription>
            The venture "{ventureIdea.name}" belongs to a user who is not a participant in this game.
            Transfer ownership to a game participant to make it available for invitation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Current Owner:</p>
            <Badge variant="outline" className="text-orange-600">
              {ventureIdea.users?.email} (Not in game)
            </Badge>
          </div>
          
          {availableParticipants.length > 0 ? (
            <div>
              <p className="text-sm font-medium mb-2">Transfer to:</p>
              <div className="space-y-2">
                {availableParticipants.map(participant => (
                  <label key={participant.user_id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="participant"
                      value={participant.user_id}
                      checked={selectedParticipant === participant.user_id}
                      onChange={(e) => setSelectedParticipant(e.target.value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">
                      {participant.users.first_name} {participant.users.last_name} ({participant.users.email})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No suitable participants found with similar email addresses.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleTransferOwnership}
            disabled={!selectedParticipant || loading}
          >
            {loading ? 'Transferring...' : 'Transfer Ownership'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}