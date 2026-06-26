import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { CurrentEventProfile } from "@/types/api"
import { DOMAIN_OPTIONS, HEAT_OPTIONS, DEMAND_OPTIONS } from "@/lib/constants"
import { useState } from "react"

interface ProfileEditorProps {
  profile: CurrentEventProfile | null
  isLoading: boolean
  onUpdate: (patch: Partial<CurrentEventProfile>) => void
  onRetrieve: () => void
  isRetrieving: boolean
}

export function ProfileEditor({ profile, isLoading, onUpdate, onRetrieve, isRetrieving }: ProfileEditorProps) {
  const [keywordInput, setKeywordInput] = useState("")
  const canRetrieve = Boolean(profile?.public_demands?.length)

  if (isLoading) {
    return (
      <Card className="space-y-3 border-[--zx-line] bg-[--zx-stage] p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card className="flex items-center justify-center border-[--zx-line] bg-[--zx-stage] p-10">
        <p className="text-sm text-[--zx-muted]">尚未生成画像</p>
      </Card>
    )
  }

  const handleAddKeyword = () => {
    const kw = keywordInput.trim()
    if (kw && !(profile.risk_keywords ?? []).includes(kw)) {
      onUpdate({ risk_keywords: [...(profile.risk_keywords ?? []), kw] })
    }
    setKeywordInput("")
  }

  return (
    <Card className="space-y-4 border-[--zx-line] bg-[--zx-stage] p-5">
      {/* 摘要 */}
      <div>
        <p className="mb-1 text-xs text-[--zx-muted]">事件摘要</p>
        <p className="line-clamp-3 text-sm leading-relaxed text-[--zx-ink]">{profile.event_summary}</p>
      </div>

      <Separator className="bg-[--zx-line]" />

      {/* 领域 */}
      <div>
        <p className="mb-1 text-xs text-[--zx-muted]">所属领域</p>
        <Select
          value={profile.domain}
          onValueChange={(v) => { if (v) onUpdate({ domain: v }) }}
          disabled={isRetrieving}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOMAIN_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 热度 */}
      <div>
        <p className="mb-1 text-xs text-[--zx-muted]">热度等级: {profile.heat_level}</p>
        <Slider
          value={[profile.heat_level]}
          onValueChange={(v) => onUpdate({ heat_level: (v as number[])[0] })}
          min={1} max={5} step={1}
          className="w-full"
          disabled={isRetrieving}
        />
        <div className="flex justify-between text-[10px] text-[--zx-muted]">
          {HEAT_OPTIONS.map((h) => <span key={h.value}>{h.value}</span>)}
        </div>
      </div>

      {/* 公众诉求 */}
      <div>
        <p className="mb-1 text-xs text-[--zx-muted]">公众诉求</p>
        <div className="flex flex-wrap gap-1">
          {DEMAND_OPTIONS.map((d) => {
            const selected = (profile.public_demands ?? []).includes(d.value)
            return (
              <Badge
                key={d.value}
                variant={selected ? "default" : "outline"}
                className={isRetrieving ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                onClick={() => {
                  if (isRetrieving) return
                  const arr = profile.public_demands ?? []
                  onUpdate({
                    public_demands: selected
                      ? arr.filter((x) => x !== d.value)
                      : [...arr, d.value],
                  })
                }}
              >
                {d.label}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* 风险关键词 */}
      <div>
        <p className="mb-1 text-xs text-[--zx-muted]">风险关键词</p>
        <div className="mb-1.5 flex flex-wrap gap-1">
          {(profile.risk_keywords ?? []).map((kw) => (
            <Badge
              key={kw}
              variant="secondary"
              className="cursor-pointer"
              onClick={() =>
                onUpdate({
                  risk_keywords: (profile.risk_keywords ?? []).filter((x) => x !== kw),
                })
              }
            >
              {kw} ×
            </Badge>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddKeyword() } }}
            placeholder="添加关键词"
            className="h-8 text-xs"
            disabled={isRetrieving}
          />
          <Button size="sm" variant="outline" onClick={handleAddKeyword} disabled={isRetrieving}>添加</Button>
        </div>
      </div>

      {/* 置信度 */}
      <div>
        <p className="mb-1 text-xs text-[--zx-muted]">
          置信度 {(profile.confidence * 100).toFixed(0)}%
          {profile.profile_source && (
            <span className="ml-1 opacity-60">
              ({profile.profile_source === "rule" ? "规则提取" : profile.profile_source === "mixed" ? "混合提取" : profile.profile_source})
            </span>
          )}
        </p>
        <div className="h-2 w-full rounded-full bg-[--zx-track]">
          <div
            className="h-full rounded-full bg-[--zx-blue] transition-all"
            style={{ width: `${profile.confidence * 100}%` }}
          />
        </div>
      </div>

      {profile.inferred_strategy_direction && profile.inferred_strategy_direction.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-[--zx-muted]">建议策略方向</p>
          <div className="flex flex-wrap gap-1">
            {profile.inferred_strategy_direction.map((s) => (
              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {profile.platforms && profile.platforms.length > 0 && (
        <p className="text-xs text-[--zx-muted]">
          涉及平台: {profile.platforms.join(" / ")}
        </p>
      )}

      <Separator className="bg-[--zx-line]" />

      {!canRetrieve && (
        <p className="text-xs text-[--zx-danger]">至少保留一个公众诉求后才能检索。</p>
      )}
      <Button className="w-full" onClick={onRetrieve} disabled={isRetrieving || !canRetrieve}>
        {isRetrieving ? "检索中…" : "检索参考案例"}
      </Button>
    </Card>
  )
}
