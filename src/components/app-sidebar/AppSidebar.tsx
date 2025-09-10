import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Store, Trophy, ArrowLeftRight, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameContext } from "@/context/GameContext";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";
import { SelectActiveGameModal } from "@/components/modals/SelectActiveGameModal";
import { useState } from "react";

export function AppSidebar() {
  const { signOut } = useAuth();
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <TooltipProvider>
      <Sidebar 
        variant="sidebar" 
        collapsible="offcanvas"
        className="w-16 bg-sidebar-background border-r-sidebar-border"
      >
        {/* Main Navigation - Icons Only */}
        <SidebarContent className="p-3 pt-6">
          <SidebarMenu className="space-y-4">
            {/* Discover */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => navigate('/discover')}
                    className="h-12 w-12 justify-center p-0 hover:bg-sidebar-accent"
                    size="sm"
                  >
                    <Store className="h-6 w-6 text-sidebar-foreground" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.discover')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Games */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleGameNavigation}
                    className="h-12 w-12 justify-center p-0 hover:bg-sidebar-accent"
                    size="sm"
                  >
                    <Trophy className="h-6 w-6 text-sidebar-foreground" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.games')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Transactions */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleTransactionsNavigation}
                    className="h-12 w-12 justify-center p-0 hover:bg-sidebar-accent"
                    size="sm"
                  >
                    <ArrowLeftRight className="h-6 w-6 text-sidebar-foreground" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.transactions')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        {/* Footer with STOX logo, Settings and Logout */}
        <SidebarFooter className="p-3 pb-6">
          <SidebarMenu className="space-y-3">
            {/* STOX Logo */}
            <SidebarMenuItem>
              <div className="flex items-center justify-center py-2">
                <span className="text-lg font-bold text-sidebar-foreground/60">STOX</span>
              </div>
            </SidebarMenuItem>
            
            {/* Settings */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => navigate('/settings')}
                    className="h-12 w-12 justify-center p-0 hover:bg-sidebar-accent"
                    size="sm"
                  >
                    <Settings className="h-5 w-5 text-sidebar-foreground" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.settings')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Logout */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleSignOut}
                    className="h-12 w-12 justify-center p-0 hover:bg-destructive/20 text-destructive hover:text-destructive"
                    size="sm"
                  >
                    <LogOut className="h-5 w-5" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.logout')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Game Selection Modal */}
      <SelectActiveGameModal 
        open={showGameModal}
        onOpenChange={setShowGameModal}
      />
    </TooltipProvider>
  );
}