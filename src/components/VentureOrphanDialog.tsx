import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, UserX, Trash2 } from "lucide-react";

interface Venture {
  id: string;
  name: string;
  game_id: string;
}

interface VentureOrphanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventures: Venture[];
  participantName: string;
  onTransferVentures: (ventures: Venture[]) => void;
  onDeleteVentures: (ventures: Venture[]) => void;
  onCancel: () => void;
}

export function VentureOrphanDialog({
  open,
  onOpenChange,
  ventures,
  participantName,
  onTransferVentures,
  onDeleteVentures,
  onCancel,
}: VentureOrphanDialogProps) {
  const [selectedAction, setSelectedAction] = useState<'transfer' | 'delete' | null>(null);

  const handleAction = () => {
    if (selectedAction === 'transfer') {
      onTransferVentures(ventures);
    } else if (selectedAction === 'delete') {
      onDeleteVentures(ventures);
    }
    setSelectedAction(null);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-destructive" />
            Venture Ownership Issue
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              <strong>{participantName}</strong> is the only founder of the following venture(s):
            </p>
            
            <div className="space-y-2">
              {ventures.map((venture) => (
                <div key={venture.id} className="flex items-center gap-2 p-2 border rounded">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{venture.name}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              Removing this participant will leave {ventures.length > 1 ? 'these ventures' : 'this venture'} without a founder. 
              What would you like to do?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3">
          <Button
            variant={selectedAction === 'transfer' ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => setSelectedAction('transfer')}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Transfer to another founder
          </Button>
          
          <Button
            variant={selectedAction === 'delete' ? "destructive" : "outline"}
            className="w-full justify-start"
            onClick={() => setSelectedAction('delete')}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {ventures.length > 1 ? 'ventures' : 'venture'} completely
          </Button>
        </div>

        <AlertDialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel Removal
          </Button>
          <Button 
            onClick={handleAction} 
            disabled={!selectedAction}
            variant={selectedAction === 'delete' ? 'destructive' : 'default'}
          >
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}