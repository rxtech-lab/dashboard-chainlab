import { AppSidebar } from "@/components/header/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-grow flex-col">{children}</main>
    </SidebarProvider>
  );
}
