import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar/AppSidebar";
import { Header } from "@/components/header/Header";
import { MobileBottomNavigation } from "@/components/navigation/MobileBottomNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    // Mobile-first layout with bottom navigation
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto px-4 py-4 pb-20">
          {children}
        </main>
        <MobileBottomNavigation />
      </div>
    );
  }
  
  // Desktop layout with sidebar
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="w-full flex flex-col min-h-screen">
        <div className="flex flex-1 relative overflow-hidden">
          <AppSidebar />
          <div className="flex-1 flex flex-col pl-16 overflow-hidden">
            <Header />
            <main className="flex-1 bg-background overflow-auto px-4 md:px-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}