export function ReportCanvas({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-[--zx-line-strong] bg-[--zx-canvas] text-[--zx-ink] shadow-[0_0_0_1px_rgba(255,255,255,0.9),0_30px_100px_rgba(47,111,237,0.16)]">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-[--zx-blue]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-14"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(47,111,237,0.35) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <svg
        className="pointer-events-none absolute right-0 top-0 h-60 w-[42%] max-w-[500px] opacity-35 [mask-image:linear-gradient(90deg,transparent_0%,black_48%,black_100%)]"
        viewBox="0 0 500 240"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M86 34 H372 L458 92 V214" fill="none" stroke="var(--zx-line-strong)" strokeWidth="1" />
        <path d="M150 22 C218 118 304 132 492 116" fill="none" stroke="var(--zx-line)" strokeWidth="1" />
        <circle cx="284" cy="120" r="42" fill="none" stroke="var(--zx-line)" strokeWidth="0.9" />
        <circle cx="284" cy="120" r="14" fill="none" stroke="var(--zx-blue)" strokeWidth="1" />
        <path d="M360 72 L430 118 L430 184" fill="none" stroke="var(--zx-blue)" strokeDasharray="5 8" strokeWidth="0.8" />
      </svg>
      <svg
        className="pointer-events-none absolute bottom-0 left-5 hidden h-24 w-72 opacity-25 sm:block"
        viewBox="0 0 288 96"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 80 C58 34 104 54 152 28 S238 8 288 42" fill="none" stroke="var(--zx-line)" strokeDasharray="6 10" strokeWidth="0.9" />
        <path d="M32 76 h72 M32 88 h118" stroke="var(--zx-line-strong)" strokeWidth="0.8" />
      </svg>
      <div className="relative z-10 p-7 md:p-10">{children}</div>
    </section>
  )
}
