export function StageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {/* 黑色径向渐变 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(47,111,237,0.14),transparent_42%),linear-gradient(180deg,#f3f7fa_0%,#dce7ee_100%)]" />
      {/* 点阵噪声 */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(31, 76, 122, 0.34) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* 顶部光晕 */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/60 to-transparent" />
    </div>
  )
}
