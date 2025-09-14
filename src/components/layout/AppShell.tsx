import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar/AppSidebar";
import { Header } from "@/components/header/Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className={cn(
        "w-full flex flex-col",
        isMobile ? "h-screen" : "min-h-screen"
      )}>
        <div className="flex flex-1 relative overflow-hidden">
          <AppSidebar />
          <div className="flex-1 flex flex-col pl-16 overflow-hidden">
            <Header />
            <main className={cn(
              "flex-1 bg-background overflow-auto",
              isMobile ? "px-2" : "px-4 md:px-0"
            )}>
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}