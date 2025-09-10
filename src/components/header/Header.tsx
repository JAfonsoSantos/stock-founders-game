import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GameSearch } from "./GameSearch";
import { BarChart3 } from "lucide-react";
import { useGameContext } from "@/context/GameContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSidebar } from "@/components/ui/sidebar";

export function Header() {
  const { currentGameId, activeGames } = useGameContext();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const { profile, displayName, initials } = useUserProfile(user);
  const { toggleSidebar } = useSidebar();

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
    <header className="h-14 border-b flex items-center px-4 gap-4 bg-background">
      {/* Avatar - Mobile sidebar trigger only */}
      <button 
        onClick={toggleSidebar}
        className="h-10 w-10 shrink-0 border-2 border-border/20 rounded-full overflow-hidden bg-transparent p-0 md:pointer-events-none md:cursor-default"
      >
        <Avatar className="h-full w-full">
          <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>
      
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