import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, Menu, Share2, ShoppingCart, BarChart3, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameContext } from "@/context/GameContext";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";
import { SelectActiveGameModal } from "@/components/modals/SelectActiveGameModal";
import { useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";

export function AppSidebar() {
  const { signOut } = useAuth();
  const { currentGameId, activeGames } = useGameContext();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showGameModal, setShowGameModal] = useState(false);
  const { user } = useAuth();
  const { profile, displayName, initials } = useUserProfile(user);

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
        className="w-20 bg-background border-r border-border/20"
      >
        {/* Avatar and Main Navigation */}
        <SidebarContent className="p-3 pt-6 flex flex-col items-center">
          <SidebarMenu className="space-y-3 flex flex-col items-center">
            {/* Menu Icon */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => navigate('/discover')}
                    className="h-10 w-10 justify-center p-0 hover:bg-accent/50 rounded-lg"
                    size="sm"
                  >
                    <Menu className="h-5 w-5 text-foreground/70" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  Menu
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Home */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => navigate('/discover')}
                    className="h-10 w-10 justify-center p-0 hover:bg-accent/50 rounded-lg"
                    size="sm"
                  >
                    <Home className="h-5 w-5 text-foreground/70" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.discover')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Share */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleGameNavigation}
                    className="h-10 w-10 justify-center p-0 hover:bg-accent/50 rounded-lg"
                    size="sm"
                  >
                    <Share2 className="h-5 w-5 text-foreground/70" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.games')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Shopping Cart */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleTransactionsNavigation}
                    className="h-10 w-10 justify-center p-0 hover:bg-accent/50 rounded-lg"
                    size="sm"
                  >
                    <ShoppingCart className="h-5 w-5 text-foreground/70" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.transactions')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Chart */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleTransactionsNavigation}
                    className="h-10 w-10 justify-center p-0 hover:bg-accent/50 rounded-lg"
                    size="sm"
                  >
                    <BarChart3 className="h-5 w-5 text-foreground/70" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  Analytics
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        {/* Footer with Settings and Logout */}
        <SidebarFooter className="p-3 pb-6 flex flex-col items-center">
          <SidebarMenu className="space-y-3 flex flex-col items-center">
            {/* Settings */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => navigate('/settings')}
                    className="h-10 w-10 justify-center p-0 hover:bg-accent/50 rounded-lg"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 text-foreground/70" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t('sidebar.settings')}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* STOX Logo */}
            <SidebarMenuItem>
              <div className="flex items-center justify-center py-2 mt-4">
                <span className="text-xs font-bold text-foreground/40">STOX</span>
              </div>
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