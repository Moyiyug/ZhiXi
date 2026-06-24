export function ReportCanvas({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-sm border border-white/10 bg-[--zx-canvas] text-[--zx-ink] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_100px_rgba(47,111,237,0.16)]">
      {/* 淡网格纹理 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(47,111,237,0.35) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="relative p-8 md:p-10">{children}</div>
    </section>
  )
}
