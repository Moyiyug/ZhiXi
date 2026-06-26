import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EventInputPanel } from "@/components/generate/EventInputPanel"
import { ProfileEditor } from "@/components/generate/ProfileEditor"
import { RetrievalTimeline } from "@/components/generate/RetrievalTimeline"
import { RetrievedCaseCard } from "@/components/generate/RetrievedCaseCard"
import { EvidencePackDrawer } from "@/components/generate/EvidencePackDrawer"
import { BlueprintPanel } from "@/components/zhi/BlueprintPanel"
import { useGenerateProfile } from "@/hooks/useGenerateProfile"
import { useRetrieveCases, useBuildEvidencePack } from "@/hooks/useRetrieve"
import { createReport } from "@/api/reports"
import type { CurrentEventProfile, RetrievedCaseItem, EvidencePackResponse } from "@/types/api"
import { CheckCircle2, FileText, Loader2, Search, Sparkles } from "lucide-react"

type Phase = "input" | "profile-loading" | "profile-ready" | "retrieve-loading" | "results-ready"

const REPORT_STEPS = [
  { key: "profile", label: "评估画像", description: "识别领域、诉求、热度" },
  { key: "retrieve", label: "匹配案例", description: "召回相似处置经验" },
  { key: "pack", label: "合成素材", description: "压缩 RAG 报告材料" },
  { key: "report", label: "生成报告", description: "模型阅读后润色输出" },
]

function ReportGenerationOverlay() {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[--zx-bg]/70 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-[--zx-line] bg-white/95 p-6 shadow-[0_24px_70px_rgba(31,64,120,0.16)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[--zx-blue]/10 text-[--zx-blue]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
          <div>
            <p className="text-base font-semibold text-[--zx-ink]">正在评估并生成处置报告</p>
            <p className="text-xs text-[--zx-muted]">模型正在阅读评估画像、压缩案例材料并润色可执行建议。</p>
          </div>
        </div>
        <div className="space-y-3">
          {["读取事件评估结果", "合并 Top-K 案例策略", "生成分析、举措和话术"].map((item, index) => (
            <div key={item} className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[--zx-blue] opacity-25"
                  style={{ animationDelay: `${index * 180}ms` }}
                />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[--zx-blue]" />
              </span>
              <span className="text-sm text-[--zx-muted]">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[--zx-track]">
          <div className="h-full w-1/2 animate-[zx-report-progress_1.4s_ease-in-out_infinite] rounded-full bg-[--zx-blue]" />
        </div>
      </Card>
    </div>
  )
}

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
    setResults(null)
    setEvidencePack(null)
    setEpOpen(false)
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
    setResults(null)
    setEvidencePack(null)
    setEpOpen(false)
    setPhase("profile-ready")
  }, [])

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-[1500px] flex-col gap-4">
      <BlueprintPanel contentClassName="p-5 md:p-6" label="Report generation line">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 border-[--zx-blue]/30 bg-[--zx-blue]/5 text-[--zx-blue-soft]">
              评估 + 报告生成
            </Badge>
            <h1 className="text-2xl font-semibold text-[--zx-ink]">评估事件并生成处置建议报告</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[--zx-muted]">
              这里是核心工作流入口：先评估事件走向与关键诉求，再匹配相似处置案例，最后由模型阅读整理后的 RAG 素材并输出三段式报告。
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4 lg:w-[620px]">
            {REPORT_STEPS.map((step, index) => {
              const done =
                (index === 0 && phase !== "input" && phase !== "profile-loading") ||
                (index === 1 && (phase === "results-ready" || reportMut.isPending)) ||
                (index === 2 && Boolean(evidencePack)) ||
                (index === 3 && reportMut.isPending)
              const active =
                (index === 0 && phase === "profile-loading") ||
                (index === 1 && phase === "retrieve-loading") ||
                (index === 2 && evidenceMut.isPending) ||
                (index === 3 && reportMut.isPending)
              return (
                <div key={step.key} className="rounded-lg border border-[--zx-line] bg-white/62 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-[--zx-ink]">{step.label}</span>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-[--zx-success]" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[--zx-blue]" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[--zx-track]" />
                    )}
                  </div>
                  <p className="text-[10px] leading-4 text-[--zx-muted]">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </BlueprintPanel>

      <div className="flex flex-col gap-4 xl:flex-row">
        <BlueprintPanel className="w-full shrink-0 xl:w-[440px]" contentClassName="p-5" label="Report input">
          <EventInputPanel
            value={eventText}
            onChange={setEventText}
            onSubmit={handleGenerateProfile}
            isLoading={phase === "profile-loading"}
          />
        </BlueprintPanel>

        <BlueprintPanel className="min-w-0 flex-1" contentClassName="min-h-[calc(100vh-18rem)] p-5" label="Evaluation / retrieval / report">
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
                <p className="text-sm font-medium text-[--zx-ink]">
                  检索到 {results.length} 条参考案例
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEpOpen(true)}
                  disabled={!evidencePack || evidenceMut.isPending}
                >
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
                disabled={reportMut.isPending || evidenceMut.isPending || !evidencePack || !results || results.length === 0}
              >
                {reportMut.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    生成报告中…
                  </>
                ) : evidenceMut.isPending ? (
                  <>
                    <Search className="mr-1.5 h-4 w-4" />
                    整理 RAG 素材…
                  </>
                ) : (
                  <>
                    <FileText className="mr-1.5 h-4 w-4" />
                    生成处置建议报告
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 初始占位 */}
          {phase === "input" && (
            <div className="flex min-h-[520px] items-center justify-center">
              <div className="grid w-full max-w-2xl gap-6 rounded-lg border border-[--zx-line] bg-white/52 p-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="relative h-52 overflow-hidden rounded-md border border-[--zx-line] bg-[--zx-panel]/70">
                  <div className="absolute left-4 top-4 font-mono text-[10px] uppercase text-[--zx-blue-soft]">event map</div>
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 220 208" aria-hidden="true">
                    <path d="M26 162 C58 92 90 112 120 66 S174 34 196 76" fill="none" stroke="var(--zx-line)" strokeDasharray="5 8" strokeWidth="1" />
                    <path d="M34 42 H142 L188 88 V166" fill="none" stroke="var(--zx-line-strong)" strokeWidth="1" />
                    <circle cx="112" cy="104" r="54" fill="none" stroke="var(--zx-line)" strokeWidth="1" />
                    <circle cx="112" cy="104" r="20" fill="none" stroke="var(--zx-blue)" strokeWidth="1.2" />
                    <circle cx="112" cy="104" r="4" fill="var(--zx-blue)" />
                    <circle cx="42" cy="158" r="6" fill="var(--zx-panel)" stroke="var(--zx-blue)" strokeWidth="1" />
                    <circle cx="178" cy="74" r="6" fill="var(--zx-panel)" stroke="var(--zx-blue)" strokeWidth="1" />
                    <path d="M42 158 L112 104 L178 74" fill="none" stroke="var(--zx-blue)" strokeDasharray="4 7" strokeWidth="0.9" />
                  </svg>
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <p className="font-mono text-[10px] uppercase text-[--zx-blue-soft]">evaluation report ready</p>
                  <h2 className="mt-3 text-xl font-semibold text-[--zx-ink]">准备评估并生成报告</h2>
                  <p className="mt-3 text-sm leading-6 text-[--zx-muted]">
                    在左侧输入事件文本后，系统会完成风险画像、案例检索和 RAG 素材合成，最终生成可导出的处置建议报告。
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-[--zx-muted]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1"><Sparkles className="h-3 w-3 text-[--zx-blue]" />评估</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1"><Search className="h-3 w-3 text-[--zx-blue]" />检索</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1"><FileText className="h-3 w-3 text-[--zx-blue]" />报告</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </BlueprintPanel>
      </div>

      {/* Evidence Pack 抽屉 */}
      {evidencePack && (
        <EvidencePackDrawer
          queryText={evidencePack.query_text}
          retrievedCases={evidencePack.retrieved_cases}
          dictionaryHints={evidencePack.dictionary_hints}
          limitations={evidencePack.limitations}
          open={epOpen}
          onClose={() => setEpOpen(false)}
        />
      )}
      {reportMut.isPending && <ReportGenerationOverlay />}
    </div>
  )
}
