import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Venture {
  id: string;
  name: string;
  game_id: string;
}

interface AvailableFounder {
  participant_id: string;
  user_name: string;
  user_email: string;
}

interface VentureTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventures: Venture[];
  gameId: string;
  excludeParticipantId: string;
  onTransferComplete: () => void;
  onCancel: () => void;
}

export function VentureTransferDialog({
  open,
  onOpenChange,
  ventures,
  gameId,
  excludeParticipantId,
  onTransferComplete,
  onCancel,
}: VentureTransferDialogProps) {
  const [availableFounders, setAvailableFounders] = useState<AvailableFounder[]>([]);
  const [selectedFounderId, setSelectedFounderId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableFounders();
    }
  }, [open, gameId, excludeParticipantId]);

  const loadAvailableFounders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_available_founders_for_transfer', {
          p_game_id: gameId,
          p_exclude_participant_id: excludeParticipantId
        });

      if (error) throw error;
      setAvailableFounders(data || []);
    } catch (error: any) {
      console.error('Error loading available founders:', error);
      toast.error('Failed to load available founders');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedFounderId || ventures.length === 0) return;

    setTransferring(true);
    try {
      // Transfer all ventures to the selected founder
      for (const venture of ventures) {
        const { data, error } = await supabase
          .rpc('transfer_venture_ownership', {
            p_venture_id: venture.id,
            p_new_founder_participant_id: selectedFounderId
          });

        if (error) throw error;
        
        const result = data as { error?: string; success?: boolean; message?: string };
        if (result?.error) {
          throw new Error(result.error);
        }
      }

      toast.success(`Successfully transferred ${ventures.length} venture(s)`);
      onTransferComplete();
    } catch (error: any) {
      console.error('Error transferring ventures:', error);
      toast.error(`Failed to transfer ventures: ${error.message}`);
    } finally {
      setTransferring(false);
    }
  };

  const selectedFounder = availableFounders.find(f => f.participant_id === selectedFounderId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Transfer Venture Ownership
          </DialogTitle>
          <DialogDescription>
            Select a new founder to take ownership of {ventures.length > 1 ? 'these ventures' : 'this venture'}:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {ventures.map((venture) => (
              <div key={venture.id} className="flex items-center gap-2 p-2 border rounded text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{venture.name}</span>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : availableFounders.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No other founders available in this game</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select new owner:</label>
              <Select value={selectedFounderId} onValueChange={setSelectedFounderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a founder..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFounders.map((founder) => (
                    <SelectItem key={founder.participant_id} value={founder.participant_id}>
                      <div className="flex items-center gap-2">
                        <span>{founder.user_name}</span>
                        <Badge variant="outline" className="text-xs">founder</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={transferring}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={!selectedFounderId || transferring || availableFounders.length === 0}
          >
            {transferring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transferring...
              </>
            ) : (
              'Transfer Ownership'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}