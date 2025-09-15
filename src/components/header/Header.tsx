import { GameSearch } from "./GameSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { useGameContext } from "@/context/GameContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function Header() {
  const { currentGameId, activeGames } = useGameContext();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isMobile = useIsMobile();

  const handleChartClick = () => {
    if (currentGameId) {
      navigate(`/games/${currentGameId}/me`);
    } else if (activeGames.length === 1) {
      navigate(`/games/${activeGames[0].id}/me`);
    } else if (activeGames.length > 1) {
      // Show game selection modal (to be implemented)
      toast.info(t('header.selectGame'));
    } else {
      toast.info(t('header.noActiveGames'));
    }
  };

  return (
    <header className={cn(
      "h-12 lg:h-14 border-b border-gray-200 flex items-center gap-2 lg:gap-4 bg-gray-50",
      isMobile ? "px-4" : "px-4 lg:pl-20"
    )}>
      <div className="flex-1 flex items-center justify-between gap-2 lg:gap-4">
        {/* Game Search */}
        <div className={cn(
          "flex-1",
          isMobile ? "max-w-[240px]" : "lg:flex-none lg:w-80"
        )}>
          <GameSearch />
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Setup Button - Hidden on mobile to save space */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/setup')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          
          {/* Notifications */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}