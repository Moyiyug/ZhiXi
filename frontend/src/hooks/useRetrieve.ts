import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { buildEvidencePack, retrieveCases } from "@/api/rag"

export function useRetrieveCases() {
  return useMutation({
    mutationFn: ({
      eventText,
      profile,
      topK = 3,
    }: {
      eventText: string
      profile: unknown
      topK?: number
    }) => retrieveCases(eventText, profile, topK),
    onError: (e: Error) => toast.error(`检索失败: ${e.message}`),
  })
}

export function useBuildEvidencePack() {
  return useMutation({
    mutationFn: ({
      eventText,
      profile,
      topK = 3,
    }: {
      eventText: string
      profile: unknown
      topK?: number
    }) => buildEvidencePack(eventText, profile, topK),
    onError: (e: Error) => toast.error(`证据包构建失败: ${e.message}`),
  })
}
