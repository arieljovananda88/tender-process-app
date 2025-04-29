import { Outlet } from "react-router-dom"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export function DashboardLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
} 