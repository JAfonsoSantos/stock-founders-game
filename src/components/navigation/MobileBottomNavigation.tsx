import { Home, Store, Trophy, ArrowLeftRight, User } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { useGameContext } from "@/context/GameContext";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function MobileBottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentGameId, activeGames } = useGameContext();
  const { t } = useI18n();

  const handleTransactionsNavigation = () => {
    if (!currentGameId && activeGames.length === 0) {
      toast.info(t('sidebar.noActiveGames'));
      navigate('/');
      return;
    }

    if (currentGameId) {
      navigate(`/games/${currentGameId}/trading`);
    } else if (activeGames.length === 1) {
      navigate(`/games/${activeGames[0].id}/trading`);
    } else {
      navigate('/games');
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      onClick: () => navigate('/')
    },
    {
      icon: Store,
      label: 'Venture',
      path: '/my-ventures',
      onClick: () => navigate('/my-ventures')
    },
    {
      icon: Trophy,
      label: 'Games',
      path: '/games',
      onClick: () => navigate('/games')
    },
    {
      icon: ArrowLeftRight,
      label: 'Trading',
      path: '/trading',
      onClick: handleTransactionsNavigation
    },
    {
      icon: User,
      label: 'Profile',
      path: '/profile',
      onClick: () => navigate('/profile')
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
      <nav className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors mobile-touch-target",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}