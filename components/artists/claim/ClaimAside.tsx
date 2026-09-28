import { BadgeCheck, BarChart3, Handshake, ShieldCheck, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const BENEFITS: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: BadgeCheck,
    title: "Own your profile",
    detail: "Update your photos, bio, links and videos.",
  },
  {
    icon: BarChart3,
    title: "Your exact rank",
    detail: "Private ranking dashboard: global and city rank, weekly movement, how to climb.",
  },
  {
    icon: Handshake,
    title: "Paid opportunities",
    detail: "Brand sponsorships, paid collaborations and partner offers.",
  },
  {
    icon: Sparkles,
    title: "Creator benefits",
    detail: "Worth up to $10K for select creators.",
  },
]

export function ClaimAside({
  artistName,
  accountSetupEnabled,
}: {
  artistName: string
  accountSetupEnabled: boolean
}) {
  const steps = [
    { title: "Set up your account", detail: "About 2 minutes" },
    { title: "Hiffi team review", detail: "Usually 24–48 hours" },
    {
      title: "Sign in and manage",
      detail: accountSetupEnabled
        ? "With the email and password you set"
        : "After activating from our approval email",
    },
  ]

  return (
    <aside className="space-y-8 lg:sticky lg:top-24">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          What you unlock
        </h2>
        <ul className="mt-4 space-y-4">
          {BENEFITS.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8192C]/[0.07] text-[#E8192C]">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border pt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          How it works
        </h2>
        <ol className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-semibold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="flex items-start gap-2 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Every claim for {artistName} is reviewed by a real person on the Hiffi team. Your password is
        encrypted and never shared.
      </p>
    </aside>
  )
}
