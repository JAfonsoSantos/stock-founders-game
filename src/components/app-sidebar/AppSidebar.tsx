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

export function AppSidebar() {
  const { currentGameId, activeGames } = useGameContext();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const { profile, displayName, initials } = useUserProfile(user);

  const handleGameNavigation = () => {
    // Always navigate to games list page
    navigate('/games');
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
      // If multiple games, navigate to games page to select one
      navigate('/games');
    }
  };


  return (
    <TooltipProvider>
      <Sidebar 
        variant="sidebar" 
        collapsible="none"
        className="fixed left-0 top-0 h-screen w-16 bg-sidebar border-r border-sidebar-border z-50 overflow-hidden"
      >
        {/* Main Navigation - Icons Only */}
        <SidebarContent className="p-2 pt-4 flex flex-col items-center justify-between h-full bg-sidebar">
          {/* Top Section */}
          <div className="flex flex-col items-center">
            {/* Avatar - at the top */}
            <div className="mb-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="h-10 w-10 shrink-0 border-2 border-sidebar-border rounded-full overflow-hidden bg-transparent p-0 hover:border-sidebar-accent transition-colors"
                  >
                    <Avatar className="h-full w-full">
                      <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
                      <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {displayName} Profile
                </TooltipContent>
              </Tooltip>
            </div>
            
            <SidebarMenu className="space-y-2 flex flex-col items-center">
              {/* Home */}
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => navigate('/')}
                      className="h-8 w-8 justify-center p-0 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground"
                      size="sm"
                    >
                      <Home className="h-4 w-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  Dashboard
                </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>

              {/* Store */}
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => navigate('/my-ventures')}
                      className="h-8 w-8 justify-center p-0 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground"
                      size="sm"
                    >
                      <Store className="h-4 w-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    My Venture
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>

              {/* Game (active) */}
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={handleGameNavigation}
                      className="h-8 w-8 justify-center p-0 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground"
                      size="sm"
                    >
                      <Trophy className="h-4 w-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    Games
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>

              {/* Transfers */}
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={handleTransactionsNavigation}
                      className="h-8 w-8 justify-center p-0 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground"
                      size="sm"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    Inbox
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col items-center gap-[4px] pb-1 min-h-[80px] justify-end">
            <div className="text-lg font-bold text-sidebar-foreground leading-none tracking-tight select-none">stox</div>
            
            <Tooltip>
              <TooltipTrigger asChild>
              <button
                onClick={() => navigate('/profile')}
                className="mt-[2px] h-7 w-7 flex items-center justify-center rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">Settings</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={signOut}
                  className="mt-[2px] h-7 w-7 flex items-center justify-center rounded-lg text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">Log out</TooltipContent>
            </Tooltip>
          </div>
        </SidebarContent>

      </Sidebar>
    </TooltipProvider>
  );
}