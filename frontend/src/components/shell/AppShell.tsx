import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { StageBackground } from "@/components/zhi/StageBackground"

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-[--zx-bg] text-[--zx-canvas]">
      <StageBackground />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
