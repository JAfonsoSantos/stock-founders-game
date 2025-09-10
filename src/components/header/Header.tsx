import { SidebarTrigger } from "@/components/ui/sidebar";
import { GameSearch } from "./GameSearch";
import { ChartBarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameContext } from "@/context/GameContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useI18n } from "@/hooks/useI18n";

export function Header() {
  const { currentGameId, activeGames } = useGameContext();
  const navigate = useNavigate();
  const { t } = useI18n();

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
    <header className="h-14 border-b bg-card flex items-center px-4 gap-4">
      {/* Avatar trigger for sidebar - hidden, sidebar opens on avatar click */}
      <SidebarTrigger className="opacity-0 pointer-events-none" />
      
      <div className="flex-1 flex items-center gap-4">
        {/* Game Search */}
        <div className="flex-1 max-w-md">
          <GameSearch />
        </div>
        
        {/* Chart/Dashboard Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleChartClick}
          className="shrink-0"
        >
          <ChartBarIcon className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}