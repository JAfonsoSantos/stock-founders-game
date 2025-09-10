import { useGameContext } from "@/context/GameContext";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SelectActiveGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SelectActiveGameModal({ open, onOpenChange }: SelectActiveGameModalProps) {
  const { activeGames, setCurrentGameId } = useGameContext();
  const { t } = useI18n();

  const handleSelectGame = (gameId: string) => {
    setCurrentGameId(gameId);
    onOpenChange(false);
    // Navigation will be handled by the calling component
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pre_market': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'results': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('modal.selectGame.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {activeGames.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t('modal.selectGame.noGames')}
            </p>
          ) : (
            activeGames.map((game) => (
              <div
                key={game.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{game.name}</h4>
                  <Badge className={getStatusColor(game.status)}>
                    {game.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {format(new Date(game.starts_at), 'PPP')} - {format(new Date(game.ends_at), 'PPP')}
                </div>
                <Button
                  onClick={() => handleSelectGame(game.id)}
                  className="w-full"
                  size="sm"
                >
                  {t('modal.selectGame.select')}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}