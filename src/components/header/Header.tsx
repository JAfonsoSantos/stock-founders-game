import { GameSearch } from "./GameSearch";
import { BarChart3 } from "lucide-react";
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
    <header className="h-14 border-b flex items-center px-4 gap-4 bg-gray-50 pl-20">
      <div className="flex-1 flex items-center justify-end gap-4">
        {/* Game Search */}
        <div className="flex-1 md:flex-none md:w-80">
          <GameSearch />
        </div>
        
        {/* Chart/Dashboard Icon in Circle */}
        <button
          onClick={handleChartClick}
          className="shrink-0 h-10 w-10 rounded-full border-2 border-border/20 hover:border-border/30 transition-colors flex items-center justify-center"
        >
          <BarChart3 className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </header>
  );
}