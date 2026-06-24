import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { caseSchema, type CaseFormData } from "@/schemas/case.schema"
import {
  DEMAND_OPTIONS,
  DOMAIN_OPTIONS,
  HEAT_OPTIONS,
  STRATEGY_OPTIONS,
} from "@/lib/constants"

interface CaseFormDialogProps {
  mode: "create" | "edit"
  caseData?: Record<string, unknown> | null
  open: boolean
  isLoading: boolean
  onClose: () => void
  onSubmit: (data: CaseFormData) => void
}

export function CaseFormDialog({
  mode,
  caseData,
  open,
  isLoading,
  onClose,
  onSubmit,
}: CaseFormDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: "",
      domain: "其他",
      public_demands: [],
      heat_level: 3,
      effect_score: undefined,
      strategy_types: [],
      event_description: "",
      strategy_text: "",
    },
  })

  useEffect(() => {
    if (mode === "edit" && caseData && open) {
      reset({
        title: (caseData.title as string) ?? "",
        domain: ((caseData.domain as string) ?? "其他") as "文化传播类" | "思想政治教育类" | "政府管理类" | "技术分析类" | "其他",
        public_demands: (caseData.public_demands as string[]) ?? [],
        heat_level: (caseData.heat_level as number) ?? 3,
        effect_score: (caseData.effect_score as number) ?? undefined,
        strategy_types: (caseData.strategy_types as string[]) ?? [],
        event_description: (caseData.event_description as string) ?? "",
        strategy_text: (caseData.strategy_text as string) ?? "",
        case_code: (caseData.case_code as string) ?? null,
        notes: (caseData.notes as string) ?? null,
      })
    } else if (mode === "create" && open) {
      reset({
        title: "", domain: "其他" as const, public_demands: [], heat_level: 3,
        effect_score: undefined, strategy_types: [],
        event_description: "", strategy_text: "",
      })
    }
  }, [mode, caseData, open, reset])

  const selectedDemands = watch("public_demands")
  const selectedStrategies = watch("strategy_types")
  const heatLevel = watch("heat_level")
  const effectScore = watch("effect_score")

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto border-[--zx-line] bg-[--zx-stage] text-[--zx-canvas]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新增案例" : "编辑案例"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 标题 */}
          <div>
            <label className="text-sm text-[--zx-muted]">案例名称 *</label>
            <Input {...register("title")} className="mt-1" />
            {errors.title && <p className="mt-1 text-xs text-[--zx-danger]">{errors.title.message}</p>}
          </div>
          {/* 领域 */}
          <div>
            <label className="text-sm text-[--zx-muted]">所属领域 *</label>
            <Select value={watch("domain")} onValueChange={(v) => setValue("domain", v as "文化传播类" | "思想政治教育类" | "政府管理类" | "技术分析类" | "其他")}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAIN_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* 公众诉求 */}
          <div>
            <label className="text-sm text-[--zx-muted]">公众诉求 *（多选）</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {DEMAND_OPTIONS.map((d) => (
                <Badge
                  key={d.value}
                  variant={selectedDemands?.includes(d.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const arr = selectedDemands ?? []
                    setValue(
                      "public_demands",
                      arr.includes(d.value) ? arr.filter((x) => x !== d.value) : [...arr, d.value],
                      { shouldValidate: true }
                    )
                  }}
                >
                  {d.label}
                </Badge>
              ))}
            </div>
            {errors.public_demands && <p className="mt-1 text-xs text-[--zx-danger]">{errors.public_demands.message}</p>}
          </div>
          {/* 热度等级 */}
          <div>
            <label className="text-sm text-[--zx-muted]">热度等级: {heatLevel}</label>
            <Slider
              value={[heatLevel]}
              onValueChange={(v) => setValue("heat_level", (v as number[])[0], { shouldValidate: true })}
              min={1} max={5} step={1}
              className="mt-1"
            />
            <div className="flex justify-between text-[10px] text-[--zx-muted]">
              {HEAT_OPTIONS.map((h) => <span key={h.value}>{h.label.split("—")[0].trim()}</span>)}
            </div>
          </div>
          {/* 处置效果 */}
          <div>
            <label className="text-sm text-[--zx-muted]">处置效果 (可选): {effectScore ?? "—"}</label>
            <Slider
              value={[(effectScore as number) ?? 3]}
              onValueChange={(v) => setValue("effect_score", (v as number[])[0] === 0 ? undefined : (v as number[])[0])}
              min={0} max={5} step={1}
              className="mt-1"
            />
            <div className="flex justify-between text-[10px] text-[--zx-muted]">
              <span>不填</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </div>
          {/* 策略类型 */}
          <div>
            <label className="text-sm text-[--zx-muted]">策略类型 *（多选）</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {STRATEGY_OPTIONS.map((s) => (
                <Badge
                  key={s.value}
                  variant={selectedStrategies?.includes(s.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const arr = selectedStrategies ?? []
                    setValue(
                      "strategy_types",
                      arr.includes(s.value) ? arr.filter((x) => x !== s.value) : [...arr, s.value],
                      { shouldValidate: true }
                    )
                  }}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
            {errors.strategy_types && <p className="mt-1 text-xs text-[--zx-danger]">{errors.strategy_types.message}</p>}
          </div>
          {/* 事件描述 */}
          <div>
            <label className="text-sm text-[--zx-muted]">事件核心描述 * (20-500 字)</label>
            <Textarea {...register("event_description")} rows={4} className="mt-1" />
            {errors.event_description && <p className="mt-1 text-xs text-[--zx-danger]">{errors.event_description.message}</p>}
          </div>
          {/* 策略文本 */}
          <div>
            <label className="text-sm text-[--zx-muted]">核心处置策略 * (10-300 字)</label>
            <Textarea {...register("strategy_text")} rows={3} className="mt-1" />
            {errors.strategy_text && <p className="mt-1 text-xs text-[--zx-danger]">{errors.strategy_text.message}</p>}
          </div>
          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "提交中…" : mode === "create" ? "创建" : "保存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
