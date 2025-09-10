import { useState } from "react";
import { Store, Trophy, ArrowLeftRight, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGameContext } from "@/context/GameContext";
import { useI18n } from "@/hooks/useI18n";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SelectActiveGameModal } from "@/components/modals/SelectActiveGameModal";
import { toast } from "sonner";

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { profile, displayName, initials } = useUserProfile(user);
  const { currentGameId, activeGames } = useGameContext();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showGameModal, setShowGameModal] = useState(false);

  const handleDiscoverClick = () => {
    navigate('/');
  };

  const handleGameClick = () => {
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

  const handleTransactionsClick = () => {
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

  const menuItems = [
    {
      id: 'discover',
      icon: Store,
      label: t('sidebar.discover'),
      onClick: handleDiscoverClick,
    },
    {
      id: 'game',
      icon: Trophy,
      label: t('sidebar.competition'),
      onClick: handleGameClick,
    },
    {
      id: 'transactions',
      icon: ArrowLeftRight,
      label: t('sidebar.transactions'),
      onClick: handleTransactionsClick,
    },
  ];

  const SidebarItem = ({ item }: { item: typeof menuItems[0] }) => {
    const content = (
      <SidebarMenuButton 
        onClick={item.onClick}
        className="w-full flex items-center justify-center p-3 hover:bg-accent"
      >
        <item.icon className="h-5 w-5" />
        {!collapsed && <span className="ml-2">{item.label}</span>}
      </SidebarMenuButton>
    );

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-3">
          {/* Avatar trigger */}
          <Button
            variant="ghost"
            className="w-full p-2 flex items-center justify-center"
            onClick={() => {}} // Sidebar toggle is handled by the SidebarTrigger
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="ml-2 text-left overflow-hidden">
                <div className="text-sm font-medium truncate">
                  {displayName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </div>
              </div>
            )}
          </Button>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarItem item={item} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-2 border-t">
          <div className="flex flex-col space-y-1">
            {/* Stox Logo */}
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-3'} py-2`}>
              <div className="text-lg font-bold text-primary">
                {collapsed ? 'S' : 'stox'}
              </div>
            </div>

            <div className="flex space-x-1">
              {/* Settings */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/settings')}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      {t('sidebar.settings')}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {/* Logout */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={signOut}
                      className="flex-1"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      {t('sidebar.logout')}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SelectActiveGameModal 
        open={showGameModal}
        onOpenChange={setShowGameModal}
      />
    </>
  );
}