import { useQuery } from "@tanstack/react-query"
import { fetchPublicSettings } from "@/api/settings"
import { cn } from "@/lib/utils"

export function TopBar() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  })

  const mockMode = data?.mock_mode ?? true
  const keys = data?.keys ?? { dashscope: "missing", deepseek: "missing" }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[--zx-line] bg-[--zx-stage]/60 px-6">
      <div className="text-xs text-[--zx-muted]">
        RAG 舆情处置建议辅助生成系统
      </div>
      <div className="flex items-center gap-4">
        {/* API Key 状态 */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs",
            keys.dashscope === "configured" ? "text-[--zx-success]" : "text-[--zx-muted]"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              keys.dashscope === "configured" ? "bg-[--zx-success]" : "bg-[--zx-muted]"
            )}
          />
          Embedding
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs",
            keys.deepseek === "configured" ? "text-[--zx-success]" : "text-[--zx-muted]"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              keys.deepseek === "configured" ? "bg-[--zx-success]" : "bg-[--zx-muted]"
            )}
          />
          LLM
        </span>
        {/* Mock 模式指示灯 */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            mockMode
              ? "bg-[--zx-success]/10 text-[--zx-success]"
              : "bg-[--zx-blue]/10 text-[--zx-blue-soft]"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              mockMode ? "bg-[--zx-success]" : "bg-[--zx-blue]"
            )}
          />
          {isLoading ? "…" : mockMode ? "Mock 模式" : "真实模型"}
        </span>
      </div>
    </header>
  )
}
