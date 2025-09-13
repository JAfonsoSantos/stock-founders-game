import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar/AppSidebar";
import { Header } from "@/components/header/Header";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex flex-col w-full">
        <div className="flex flex-1 relative">
          <AppSidebar />
          <div className="flex-1 flex flex-col md:pl-16">
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