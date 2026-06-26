import { Outlet } from "react-router-dom"
import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { StageBackground } from "@/components/zhi/StageBackground"
import { BlueprintGrid } from "@/components/zhi/BlueprintGrid"
import { GlyphBirds } from "@/components/zhi/GlyphBirds"

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[--zx-bg] text-[--zx-ink]">
      <StageBackground />
      <GlyphBirds count={5} opacity={0.04} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="relative flex-1 overflow-hidden bg-[--zx-shell] p-2 md:p-3">
          <div className="relative h-full overflow-auto rounded-lg bg-[--zx-canvas-soft]">
            <BlueprintGrid opacity={0.16} />
            <div className="relative min-h-full p-3 md:p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
