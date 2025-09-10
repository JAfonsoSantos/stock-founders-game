import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GameSearch } from "./GameSearch";
import { ChartBarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameContext } from "@/context/GameContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

export function Header() {
  const { currentGameId, activeGames } = useGameContext();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const { profile, displayName, initials } = useUserProfile(user);

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
    <header className="h-14 border-b flex items-center px-4 gap-4" style={{ backgroundColor: 'hsl(var(--header-background))' }}>
      {/* Avatar trigger for sidebar */}
      <SidebarTrigger asChild>
        <button className="h-10 w-10 cursor-pointer shrink-0 border-2 border-white/10 hover:border-white/20 transition-colors rounded-full overflow-hidden bg-transparent p-0">
          <Avatar className="h-full w-full">
            <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </SidebarTrigger>
      
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
          className="shrink-0 text-white hover:bg-white/10"
        >
          <ChartBarIcon className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}