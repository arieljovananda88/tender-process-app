import { Outlet, useNavigate } from "react-router-dom"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useAccount } from "wagmi"
import { useEffect } from "react"

export function DashboardLayout() {
  const navigate = useNavigate()
  
  const { isConnected } = useAccount()
  useEffect(() => {
    if (!isConnected) {
      navigate("/login")
    }
  }, [isConnected])

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