import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { generateProfile } from "@/api/rag"

export function useGenerateProfile() {
  return useMutation({
    mutationFn: ({
      eventText,
      hints,
    }: {
      eventText: string
      hints?: Record<string, unknown>
    }) => generateProfile(eventText, hints),
    onError: (e: Error) => toast.error(`画像生成失败: ${e.message}`),
  })
}
