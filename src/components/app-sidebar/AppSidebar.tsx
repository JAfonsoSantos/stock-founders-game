import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Home, Store, Trophy, ArrowLeftRight } from "lucide-react";
import { useGameContext } from "@/context/GameContext";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";
import { SelectActiveGameModal } from "@/components/modals/SelectActiveGameModal";
import { useState } from "react";

export function AppSidebar() {
  const { currentGameId, activeGames } = useGameContext();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showGameModal, setShowGameModal] = useState(false);

  const handleGameNavigation = () => {
    if (!currentGameId && activeGames.length === 0) {
      toast.info(t('sidebar.noActiveGames'));
      navigate('/');
      return;
    }

    if (currentGameId) {
      navigate(`/games/${currentGameId}/discover`);
    } else if (activeGames.length === 1) {
      navigate(`/games/${activeGames[0].id}/discover`);
    } else {
      setShowGameModal(true);
    }
  };

  const handleTransactionsNavigation = () => {
    if (!currentGameId && activeGames.length === 0) {
      toast.info(t('sidebar.noActiveGames'));
      navigate('/');
      return;
    }

    if (currentGameId) {
      navigate(`/games/${currentGameId}/me`);
    } else if (activeGames.length === 1) {
      navigate(`/games/${activeGames[0].id}/me`);
    } else {
      setShowGameModal(true);
    }
  };


  return (
    <TooltipProvider>
      <Sidebar 
        variant="sidebar" 
        collapsible="none"
        className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-16 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))] z-20"
      >
        {/* Main Navigation - Icons Only */}
        <SidebarContent className="p-2 pt-2 flex flex-col items-center">
          <SidebarMenu className="space-y-2 flex flex-col items-center">
            {/* Home */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => navigate('/')}
                    className="h-8 w-8 justify-center p-0 hover:bg-[hsl(var(--sidebar-accent))] rounded-lg"
                    size="sm"
                  >
                    <Home className="h-4 w-4" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  Home
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Store */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => navigate('/discover')}
                    className="h-8 w-8 justify-center p-0 hover:bg-[hsl(var(--sidebar-accent))] rounded-lg"
                    size="sm"
                  >
                    <Store className="h-4 w-4" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.discover')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Game (active) */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleGameNavigation}
                    className="h-8 w-8 justify-center p-0 hover:bg-[hsl(var(--sidebar-accent))] rounded-lg"
                    size="sm"
                  >
                    <Trophy className="h-4 w-4" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.games')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Transfers */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleTransactionsNavigation}
                    className="h-8 w-8 justify-center p-0 hover:bg-[hsl(var(--sidebar-accent))] rounded-lg"
                    size="sm"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.transactions')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

      </Sidebar>

      {/* Game Selection Modal */}
      <SelectActiveGameModal 
        open={showGameModal}
        onOpenChange={setShowGameModal}
      />
    </TooltipProvider>
  );
}