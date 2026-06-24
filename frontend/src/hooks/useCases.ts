import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createCase,
  deleteCase,
  fetchCase,
  fetchCases,
  generateCaseEmbedding,
  importCsv,
  rebuildEmbeddings,
  toggleCase,
  updateCase,
} from "@/api/cases"
import type { CaseFilters } from "@/api/cases"

export function useCases(filters: CaseFilters = {}) {
  return useQuery({
    queryKey: ["cases", filters],
    queryFn: () => fetchCases(filters),
    staleTime: 10_000,
  })
}

export function useCase(id: number | null) {
  return useQuery({
    queryKey: ["case", id],
    queryFn: () => fetchCase(id!),
    enabled: id != null,
    staleTime: 30_000,
  })
}

export function useCreateCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] })
      toast.success("案例已创建")
    },
    onError: (e: Error) => toast.error(`创建失败: ${e.message}`),
  })
}

export function useUpdateCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateCase(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["cases"] })
      qc.invalidateQueries({ queryKey: ["case", vars.id] })
      toast.success("案例已更新")
    },
    onError: (e: Error) => toast.error(`更新失败: ${e.message}`),
  })
}

export function useDeleteCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] })
      toast.success("案例已删除")
    },
    onError: (e: Error) => toast.error(`删除失败: ${e.message}`),
  })
}

export function useToggleCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleCase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] })
    },
    onError: (e: Error) => toast.error(`切换失败: ${e.message}`),
  })
}

export function useImportCsv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: importCsv,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["cases"] })
      toast.success(`导入 ${result.imported} 条，跳过 ${result.skipped} 条`)
    },
    onError: (e: Error) => toast.error(`导入失败: ${e.message}`),
  })
}

export function useGenerateEmbedding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: generateCaseEmbedding,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["cases"] })
      qc.invalidateQueries({ queryKey: ["case", result.case_id] })
      toast.success("向量已生成")
    },
    onError: (e: Error) => toast.error(`生成失败: ${e.message}`),
  })
}

export function useRebuildEmbeddings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: rebuildEmbeddings,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["cases"] })
      toast.success(`正在重建 ${result.rebuilt} 条案例的向量`)
    },
    onError: (e: Error) => toast.error(`重建失败: ${e.message}`),
  })
}
