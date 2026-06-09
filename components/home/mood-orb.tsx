"use client"

interface MoodOrbProps {
  gradient: string
  selected?: boolean
  size?: "md" | "sm"
  className?: string
}

const SIZES = {
  md: "h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20",
  sm: "h-9 w-9",
}

export function MoodOrb({ gradient, selected = false, size = "md", className = "" }: MoodOrbProps) {
  return (
    <div
      className={[
        "relative box-content rounded-full transition-shadow duration-200",
        SIZES[size],
        selected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
          : "ring-1 ring-border",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 overflow-hidden rounded-full" style={{ background: gradient }} />
      {/* Gloss highlight — cassette / vinyl sheen */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 24%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 28%, transparent 52%)",
        }}
      />
      {/* Grain texture */}
      <div className="mood-grain pointer-events-none absolute inset-0 rounded-full opacity-[0.35] mix-blend-overlay" />
      {/* Bottom weight — depth */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 50% 115%, rgba(0,0,0,0.35) 0%, transparent 55%)",
        }}
      />
    </div>
  )
}
