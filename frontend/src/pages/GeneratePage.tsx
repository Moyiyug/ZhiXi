import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EventInputPanel } from "@/components/generate/EventInputPanel"
import { ProfileEditor } from "@/components/generate/ProfileEditor"
import { RetrievalTimeline } from "@/components/generate/RetrievalTimeline"
import { RetrievedCaseCard } from "@/components/generate/RetrievedCaseCard"
import { EvidencePackDrawer } from "@/components/generate/EvidencePackDrawer"
import { useGenerateProfile } from "@/hooks/useGenerateProfile"
import { useRetrieveCases, useBuildEvidencePack } from "@/hooks/useRetrieve"
import { createReport } from "@/api/reports"
import type { CurrentEventProfile, RetrievedCaseItem, EvidencePackResponse } from "@/types/api"

type Phase = "input" | "profile-loading" | "profile-ready" | "retrieve-loading" | "results-ready"

export function GeneratePage() {
  const navigate = useNavigate()
  const [eventText, setEventText] = useState("")
  const [profile, setProfile] = useState<CurrentEventProfile | null>(null)
  const [results, setResults] = useState<RetrievedCaseItem[] | null>(null)
  const [evidencePack, setEvidencePack] = useState<EvidencePackResponse | null>(null)
  const [epOpen, setEpOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>("input")

  const profileMut = useGenerateProfile()
  const retrieveMut = useRetrieveCases()
  const evidenceMut = useBuildEvidencePack()
  const reportMut = useMutation({
    mutationFn: (data: { input_event_text: string; profile: unknown; evidence_pack: unknown; generate_now: boolean }) =>
      createReport(data),
    onSuccess: (data: unknown) => {
      const d = data as { id: number }
      toast.success("报告已生成")
      navigate(`/reports/${d.id}`)
    },
    onError: (e: Error) => toast.error(`报告生成失败: ${e.message}`),
  })

  const handleGenerateProfile = useCallback(() => {
    if (eventText.length < 50) return
    setPhase("profile-loading")
    profileMut.mutate(
      { eventText },
      {
        onSuccess: (data: unknown) => {
          setProfile(data as CurrentEventProfile)
          setPhase("profile-ready")
        },
        onError: () => setPhase("input"),
      }
    )
  }, [eventText, profileMut])

  const handleRetrieve = useCallback(() => {
    if (!profile) return
    const merged = { ...profile }
    setPhase("retrieve-loading")
    retrieveMut.mutate(
      { eventText, profile: merged, topK: 3 },
      {
        onSuccess: (data: unknown) => {
          const d = data as { results: RetrievedCaseItem[] }
          setResults(d.results ?? [])
          evidenceMut.mutate(
            { eventText, profile: merged, topK: 3 },
            {
              onSuccess: (ep: unknown) => {
                setEvidencePack(ep as EvidencePackResponse)
              },
            }
          )
          setPhase("results-ready")
        },
        onError: () => setPhase("profile-ready"),
      }
    )
  }, [eventText, profile, retrieveMut, evidenceMut])

  const handleGenerateReport = useCallback(() => {
    if (!profile || !evidencePack) return
    reportMut.mutate({
      input_event_text: eventText,
      profile,
      evidence_pack: evidencePack,
      generate_now: true,
    })
  }, [eventText, profile, evidencePack, reportMut])

  const handleProfileUpdate = useCallback((patch: Partial<CurrentEventProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : null))
  }, [])

  return (
    <div className="flex h-full gap-0">
      {/* 左栏：输入 */}
      <div className="w-[480px] shrink-0 overflow-auto border-r border-[--zx-line] p-6">
        <EventInputPanel
          value={eventText}
          onChange={setEventText}
          onSubmit={handleGenerateProfile}
          isLoading={phase === "profile-loading"}
        />
      </div>

      {/* 右栏：结果 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 画像 */}
        {(phase === "profile-loading" || phase === "profile-ready" || phase === "retrieve-loading" || phase === "results-ready") && (
          <div className="mb-6">
            <ProfileEditor
              profile={profile}
              isLoading={phase === "profile-loading"}
              onUpdate={handleProfileUpdate}
              onRetrieve={handleRetrieve}
              isRetrieving={phase === "retrieve-loading"}
            />
          </div>
        )}

        {/* 检索动效 */}
        {phase === "retrieve-loading" && <RetrievalTimeline />}

        {/* 检索结果 */}
        {phase === "results-ready" && results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[--zx-canvas]">
                检索到 {results.length} 条参考案例
              </p>
              <Button variant="outline" size="sm" onClick={() => setEpOpen(true)}>
                查看 Evidence Pack
              </Button>
            </div>

            {results.map((r, i) => (
              <RetrievedCaseCard key={r.case_id} result={r} index={i} />
            ))}

            {/* 生成报告 */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerateReport}
              disabled={reportMut.isPending}
            >
              {reportMut.isPending ? "生成中…" : "生成三段式报告"}
            </Button>
          </div>
        )}

        {/* 初始占位 */}
        {phase === "input" && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[--zx-muted]">在左侧输入事件文本，开始智能分析</p>
          </div>
        )}
      </div>

      {/* Evidence Pack 抽屉 */}
      {evidencePack && (
        <EvidencePackDrawer
          queryText={evidencePack.query_text}
          retrievedCases={evidencePack.retrieved_cases}
          limitations={evidencePack.limitations}
          open={epOpen}
          onClose={() => setEpOpen(false)}
        />
      )}
    </div>
  )
}
