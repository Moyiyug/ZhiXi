import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface BlueprintPanelProps {
  children: ReactNode
  className?: string
  contentClassName?: string
  label?: string
}

export function BlueprintPanel({
  children,
  className,
  contentClassName,
  label = "ZhiXi / evidence blueprint",
}: BlueprintPanelProps) {
  return (
    <section className={cn("zx-blueprint-border zx-paper relative overflow-hidden rounded-lg", className)}>
      <div className="pointer-events-none absolute bottom-3 left-3 top-3 w-1 rounded-full bg-[--zx-blue]/70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[--zx-line]" />
      <div className="pointer-events-none absolute right-8 top-6 hidden font-mono text-[10px] uppercase text-[--zx-muted]/60 sm:block">
        {label}
      </div>
      <div className="pointer-events-none absolute right-0 top-0 hidden h-56 w-[44%] max-w-[560px] opacity-45 [mask-image:linear-gradient(90deg,transparent_0%,black_42%,black_100%)] sm:block">
        <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 560 224" preserveAspectRatio="none">
          <path d="M58 24 H450 L520 82 V186" fill="none" stroke="var(--zx-line)" strokeWidth="1" />
          <path d="M154 0 C170 72 236 112 348 116 S498 154 560 214" fill="none" stroke="var(--zx-line)" strokeWidth="0.8" />
          <circle cx="336" cy="104" r="58" fill="none" stroke="var(--zx-line)" strokeWidth="0.9" />
          <circle cx="336" cy="104" r="18" fill="none" stroke="var(--zx-line-strong)" strokeWidth="1" />
          <circle cx="438" cy="62" r="4" fill="var(--zx-blue)" opacity="0.55" />
          <path d="M438 62 L496 104 L496 168" fill="none" stroke="var(--zx-blue)" strokeDasharray="5 8" strokeWidth="0.8" />
          <path d="M86 64 h52 M112 38 v52" stroke="var(--zx-line-strong)" strokeWidth="1" />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-3 hidden h-28 w-80 opacity-25 sm:block">
        <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 320 112" preserveAspectRatio="none">
          <path d="M0 88 C72 24 134 52 190 28 S284 10 320 40" fill="none" stroke="var(--zx-line)" strokeDasharray="6 10" strokeWidth="0.9" />
          <path d="M40 78 h84 M40 92 h132" stroke="var(--zx-line-strong)" strokeWidth="0.8" />
          <circle cx="204" cy="32" r="11" fill="none" stroke="var(--zx-blue)" strokeWidth="0.9" />
        </svg>
      </div>
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </section>
  )
}
