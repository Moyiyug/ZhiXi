import { NavLink } from "react-router-dom"
import {
  Archive,
  BarChart3,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/", label: "工作台", icon: LayoutDashboard },
  { to: "/generate", label: "评估报告", icon: Sparkles },
  { to: "/evaluation", label: "事件评估", icon: BarChart3 },
  { to: "/cases", label: "案例入库", icon: Archive },
  { to: "/settings", label: "设置", icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex w-16 shrink-0 flex-col border-r border-[--zx-shell-line] bg-[--zx-shell] text-[--zx-shell-text] transition-[width] duration-200",
          collapsed ? "md:w-16" : "md:w-60"
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center justify-center gap-2 border-b border-[--zx-shell-line] px-2",
            collapsed ? "md:justify-center" : "md:justify-start md:px-4"
          )}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[--zx-blue] text-xs font-bold text-[--zx-white]">
            Z
          </div>
          <span
            className={cn(
              "hidden min-w-0 flex-1 truncate text-sm font-semibold tracking-wide text-[--zx-shell-text] md:inline",
              collapsed && "md:hidden"
            )}
          >
            ZhiXi 智析
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="hidden text-[--zx-muted] hover:text-[--zx-blue] md:inline-flex"
                  onClick={onToggle}
                  aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
                />
              }
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? "展开侧边栏" : "收起侧边栏"}</TooltipContent>
          </Tooltip>
        </div>

        <nav className={cn("flex-1 space-y-0.5 px-2 py-4", collapsed ? "md:px-2" : "md:px-3")}>
          {NAV_ITEMS.map((item) => (
            <Tooltip key={item.to}>
              <TooltipTrigger
                render={
                  <NavLink
                    to={item.to}
                    aria-label={item.label}
                    className={({ isActive }) =>
                      cn(
                        "flex h-9 items-center justify-center rounded-lg px-2 text-sm transition-colors",
                        collapsed ? "md:justify-center md:gap-0" : "md:justify-start md:gap-3 md:px-3",
                        isActive
                          ? "border-l-2 border-[--zx-blue] bg-[--zx-blue]/10 text-[--zx-shell-text]"
                          : "text-[--zx-muted] hover:bg-[--zx-panel] hover:text-[--zx-shell-text]"
                      )
                    }
                  />
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className={cn("hidden truncate md:inline", collapsed && "md:hidden")}>{item.label}</span>
              </TooltipTrigger>
              <TooltipContent side="right" className={collapsed ? undefined : "md:hidden"}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <div className={cn("hidden border-t border-[--zx-shell-line] px-5 py-3 md:block", collapsed && "md:hidden")}>
          <p className="text-xs text-[--zx-muted]">ZhiXi v0.2 · 演示版</p>
        </div>
      </aside>
    </TooltipProvider>
  )
}
