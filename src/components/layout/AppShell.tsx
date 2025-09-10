import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar/AppSidebar";
import { Header } from "@/components/header/Header";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex flex-col w-full">
        <Header />
        <div className="flex flex-1 relative">
          {/* Sidebar - always visible on desktop, toggle overlay on mobile */}
          <div className="hidden md:block">
            <AppSidebar />
          </div>
          {/* Mobile sidebar overlay - positioned below header */}
          <div className="md:hidden absolute top-0 left-0 z-10">
            <AppSidebar />
          </div>
          <main className="flex-1 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}