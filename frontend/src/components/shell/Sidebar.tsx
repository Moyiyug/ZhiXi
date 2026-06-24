import { NavLink } from "react-router-dom"
import {
  Archive,
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/", label: "工作台", icon: LayoutDashboard },
  { to: "/cases", label: "案例素材库", icon: Archive },
  { to: "/generate", label: "智能生成", icon: Sparkles },
  { to: "/generate", label: "报告生成", icon: FileText },
  { to: "/settings", label: "设置", icon: Settings },
  { to: "/evaluation", label: "评估", icon: BarChart3 },
]

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[--zx-line] bg-[--zx-stage]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-[--zx-line] px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[--zx-blue] text-xs font-bold text-[--zx-white]">
          Z
        </div>
        <span className="text-sm font-semibold tracking-wide text-[--zx-canvas]">
          ZhiXi 智析
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-l-2 border-[--zx-blue] bg-[--zx-blue]/10 text-[--zx-blue-soft]"
                  : "text-[--zx-muted] hover:bg-white/5 hover:text-[--zx-canvas]"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[--zx-line] px-5 py-3">
        <p className="text-xs text-[--zx-muted]">ZhiXi v0.1 · Mock 演示版</p>
      </div>
    </aside>
  )
}
