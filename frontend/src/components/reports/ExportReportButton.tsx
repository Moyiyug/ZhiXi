import { Button } from "@/components/ui/button"
import { useExportMarkdown } from "@/hooks/useReport"
import { Download } from "lucide-react"

interface ExportReportButtonProps {
  reportId: number
}

export function ExportReportButton({ reportId }: ExportReportButtonProps) {
  const exportMut = useExportMarkdown()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportMut.mutate(reportId)}
      disabled={exportMut.isPending}
      className="shrink-0"
    >
      <Download className="mr-1.5 h-4 w-4" />
      {exportMut.isPending ? "导出中..." : "导出 Markdown"}
    </Button>
  )
}
