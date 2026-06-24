import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CaseCard } from "@/components/cases/CaseCard"
import { CaseDetailDrawer } from "@/components/cases/CaseDetailDrawer"
import { CaseFormDialog } from "@/components/cases/CaseFormDialog"
import {
  useCases,
  useCreateCase,
  useDeleteCase,
  useImportCsv,
  useRebuildEmbeddings,
  useToggleCase,
  useUpdateCase,
} from "@/hooks/useCases"
import { DOMAIN_OPTIONS } from "@/lib/constants"
import type { CaseFormData } from "@/schemas/case.schema"
import { Upload, Plus, RefreshCw } from "lucide-react"

export function CaseLibraryPage() {
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [domain, setDomain] = useState<string>("all")
  const [enabled, setEnabled] = useState<string>("all")
  const [embeddingStatus, setEmbeddingStatus] = useState<string>("all")
  const [page, setPage] = useState(1)

  const filters = {
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(domain !== "all" ? { domain } : {}),
    ...(enabled === "true" ? { enabled: true } : enabled === "false" ? { enabled: false } : {}),
    ...(embeddingStatus !== "all" ? { embedding_status: embeddingStatus } : {}),
    page,
    page_size: 12,
  }

  const { data, isLoading, isError, refetch } = useCases(filters)
  const createMut = useCreateCase()
  const updateMut = useUpdateCase()
  const deleteMut = useDeleteCase()
  const toggleMut = useToggleCase()
  const importMut = useImportCsv()
  const rebuildMut = useRebuildEmbeddings()

  // 表单状态
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null)

  // 详情抽屉
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null)

  const items = (data?.items as unknown[]) ?? []
  const total = (data?.total as number) ?? 0
  const totalPages = Math.ceil(total / 12)

  const handleSearch = useCallback((v: string) => {
    setQ(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(v)
      setPage(1)
    }, 300)
  }, [])

  const handleImport = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) importMut.mutate(file)
    }
    input.click()
  }, [importMut])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Loading
  if (isLoading && items.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // Error
  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="mb-3 text-sm text-[--zx-danger]">加载失败，请重试</p>
          <Button variant="outline" onClick={() => refetch()}>重试</Button>
        </div>
      </div>
    )
  }

  // Empty
  if (!isLoading && items.length === 0 && !debouncedQ && domain === "all" && enabled === "all" && embeddingStatus === "all") {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="mb-2 text-lg font-medium text-[--zx-canvas]">暂无可用案例素材</p>
          <p className="mb-6 text-sm text-[--zx-muted]">
            导入 CSV 或新增案例后，系统将自动构造 embedding 文本并参与检索。
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={handleImport} variant="outline">
              <Upload className="mr-1.5 h-4 w-4" />导入 CSV
            </Button>
            <Button onClick={() => { setFormMode("create"); setEditData(null); setFormOpen(true) }}>
              <Plus className="mr-1.5 h-4 w-4" />新增案例
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => { setFormMode("create"); setEditData(null); setFormOpen(true) }}>
          <Plus className="mr-1 h-3.5 w-3.5" />新增
        </Button>
        <Button size="sm" variant="outline" onClick={handleImport}>
          <Upload className="mr-1 h-3.5 w-3.5" />导入 CSV
        </Button>
        <Button size="sm" variant="outline" onClick={() => rebuildMut.mutate()} disabled={rebuildMut.isPending}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />重建向量
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) importMut.mutate(file)
            e.target.value = ""
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="搜索案例名称…"
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-9 w-64"
        />
        <Select value={domain} onValueChange={(v) => { if (v) { setDomain(v); setPage(1) } }}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="领域" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部领域</SelectItem>
            {DOMAIN_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={enabled} onValueChange={(v) => { if (v) { setEnabled(v); setPage(1) } }}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="启用状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="true">已启用</SelectItem>
            <SelectItem value="false">已停用</SelectItem>
          </SelectContent>
        </Select>
        <Select value={embeddingStatus} onValueChange={(v) => { if (v) { setEmbeddingStatus(v); setPage(1) } }}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="向量状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="ready">已向量化</SelectItem>
            <SelectItem value="none">未向量化</SelectItem>
            <SelectItem value="pending">处理中</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-[--zx-muted]">{total} 条案例</span>
      </div>

      {/* 搜索无结果 */}
      {items.length === 0 && (
        <div className="py-12 text-center text-sm text-[--zx-muted]">
          未找到匹配案例{" "}
          <button
            className="text-[--zx-blue-soft] underline"
            onClick={() => { setQ(""); setDebouncedQ(""); setDomain("all"); setEnabled("all"); setEmbeddingStatus("all") }}
          >
            清除筛选
          </button>
        </div>
      )}

      {/* 卡片网格 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const c = item as Record<string, unknown>
          const caseId = c.id as number
          return (
            <CaseCard
              key={caseId}
              caseItem={c}
              onClick={() => { setDetailId(caseId); setDetailOpen(true) }}
              onToggle={() => toggleMut.mutate(caseId)}
            />
          )
        })}
      </div>

      {/* 分页器 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            上一页
          </Button>
          <span className="text-xs text-[--zx-muted]">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      )}

      {/* 详情抽屉 */}
      <CaseDetailDrawer
        caseId={detailId}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailId(null) }}
        onEdit={(c) => {
          setEditData(c)
          setFormMode("edit")
          setFormOpen(true)
        }}
      />

      {/* 表单 Dialog */}
      <CaseFormDialog
        mode={formMode}
        caseData={editData}
        open={formOpen}
        isLoading={formMode === "create" ? createMut.isPending : updateMut.isPending}
        onClose={() => { setFormOpen(false); setEditData(null) }}
        onSubmit={(data: CaseFormData) => {
          if (formMode === "edit" && editData?.id != null) {
            updateMut.mutate({ id: editData.id as number, data: data as unknown as Record<string, unknown> })
          } else {
            createMut.mutate(data as unknown as Record<string, unknown>)
          }
          setFormOpen(false)
          setEditData(null)
        }}
      />

      {/* 删除确认 */}
      <Dialog open={deleteTarget != null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="border-[--zx-line] bg-[--zx-stage] text-[--zx-canvas]">
          <DialogHeader>
            <DialogTitle>确定删除案例「{deleteTarget?.title}」？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[--zx-muted]">此操作不可撤销，关联的 embedding 数据也将被删除。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null as unknown as { id: number; title: string } | null) }
              }}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
