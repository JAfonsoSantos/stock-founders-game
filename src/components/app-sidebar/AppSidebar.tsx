import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, Store, Trophy, ArrowLeftRight, Settings, LogOut } from "lucide-react";
import { useGameContext } from "@/context/GameContext";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { SelectActiveGameModal } from "@/components/modals/SelectActiveGameModal";
import { useState } from "react";

export function AppSidebar() {
  const { currentGameId, activeGames } = useGameContext();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const { profile, displayName, initials } = useUserProfile(user);
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
        className="fixed left-0 top-0 h-screen w-16 bg-gray-50 border-r border-gray-200 z-20"
      >
        {/* Main Navigation - Icons Only */}
        <SidebarContent className="p-2 pt-4 flex flex-col items-center justify-between h-full">
          {/* Top Section */}
          <div className="flex flex-col items-center">
            {/* Avatar - at the top */}
            <div className="mb-4">
              <button 
                onClick={() => navigate('/profile')}
                className="h-10 w-10 shrink-0 border-2 border-gray-300 rounded-full overflow-hidden bg-transparent p-0 hover:border-gray-400 transition-colors"
              >
                <Avatar className="h-full w-full">
                  <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
            
            <SidebarMenu className="space-y-2 flex flex-col items-center">
              {/* Home */}
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => navigate('/')}
                      className="h-8 w-8 justify-center p-0 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-800"
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
                      className="h-8 w-8 justify-center p-0 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-800"
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
                      className="h-8 w-8 justify-center p-0 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-800"
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
                      className="h-8 w-8 justify-center p-0 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-800"
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
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col items-center space-y-1 pb-2">
            {/* Stox Logo */}
            <div className="text-lg font-bold text-gray-500 select-none mb-1">
              stox
            </div>
            
            {/* Settings */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => navigate('/settings')}
                    className="h-8 w-8 justify-center p-0 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-800"
                    size="sm"
                  >
                    <Settings className="h-4 w-4" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  Settings
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>

            {/* Logout */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={signOut}
                    className="h-8 w-8 justify-center p-0 hover:bg-red-100 rounded-lg text-gray-600 hover:text-red-600"
                    size="sm"
                  >
                    <LogOut className="h-4 w-4" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  Log out
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </div>
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