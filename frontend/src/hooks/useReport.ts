import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { fetchReport, regenerateSegment, exportMarkdown } from "@/api/reports"

export function useReport(id: number | null) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport(id!),
    enabled: id != null,
    staleTime: 10_000,
  })
}

export function useRegenerateSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, segmentKey }: { reportId: number; segmentKey: string }) =>
      regenerateSegment(reportId, segmentKey),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["report", vars.reportId] })
      const labels: Record<string, string> = {
        analysis_and_cases: "第一段",
        strategy_and_speech: "第二段",
        disclaimer: "第三段",
      }
      toast.success(`${labels[vars.segmentKey] ?? ""} 已重新生成`)
    },
    onError: (e: Error) => toast.error(`重新生成失败: ${e.message}`),
  })
}

export function useExportMarkdown() {
  return useMutation({
    mutationFn: async (reportId: number) => {
      const md = await exportMarkdown(reportId)
      const blob = new Blob([md], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `zhixi-report-${reportId}.md`
      a.click()
      URL.revokeObjectURL(url)
      return md
    },
    onSuccess: () => toast.success("Markdown 已下载"),
    onError: (e: Error) => toast.error(`导出失败: ${e.message}`),
  })
}
