import { ShieldCheck } from "lucide-react"

const BENEFITS = [
  { title: "Own your profile", detail: "Update your photos, bio, links and videos." },
  {
    title: "Your exact rank",
    detail: "Private ranking dashboard: global and city rank, weekly movement, how to climb.",
  },
  { title: "Paid opportunities", detail: "Brand sponsorships, paid collaborations and partner offers." },
  { title: "Creator benefits", detail: "Worth up to $10K for select creators." },
]

export function ClaimAside({
  artistName,
  accountSetupEnabled,
}: {
  artistName: string
  accountSetupEnabled: boolean
}) {
  const steps = accountSetupEnabled
    ? [
        { title: "Set up your account", detail: "About 2 minutes. You're signed in right away" },
        { title: "Hiffi team review", detail: "Usually 24–48 hours" },
        { title: "Own and manage", detail: "Owner tools unlock once approved" },
      ]
    : [
        { title: "Set up your account", detail: "About 2 minutes" },
        { title: "Hiffi team review", detail: "Usually 24–48 hours" },
        { title: "Sign in and manage", detail: "After activating from our approval email" },
      ]

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <section className="relative isolate overflow-hidden rounded-[24px] bg-[#0B0B0C] p-6 text-[#F4F1EA] sm:p-7">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_100%_0%,rgba(232,25,44,0.28),transparent_60%)]"
          aria-hidden
        />
        <div className="mood-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" aria-hidden />

        <h2 className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">What you unlock</h2>
        <ul className="mt-5 space-y-5">
          {BENEFITS.map((benefit, index) => (
            <li key={benefit.title} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2">
              <span className="pt-0.5 font-mono text-[10px] tracking-[0.2em] text-[#FF6B78]">0{index + 1}</span>
              <div>
                <p className="text-sm font-semibold">{benefit.title}</p>
                <p className="mt-1 text-[13px] leading-5 text-white/55">{benefit.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[24px] border border-[#0B0B0C]/10 p-6 sm:p-7">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#77726A]">How it works</h2>
        <ol className="mt-5 space-y-0">
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex gap-3.5 pb-5 last:pb-0">
              {index < steps.length - 1 ? (
                <span className="absolute left-[11px] top-7 h-[calc(100%-1.75rem)] w-px bg-[#0B0B0C]/12" aria-hidden />
              ) : null}
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#0B0B0C]/15 bg-[#F4F1EA] text-[11px] font-semibold tabular-nums text-[#0B0B0C]/70">
                {index + 1}
              </span>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-[#0B0B0C]">{step.title}</p>
                <p className="mt-0.5 text-[13px] text-[#77726A]">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-6 flex items-start gap-2 border-t border-[#0B0B0C]/10 pt-5 text-xs leading-relaxed text-[#77726A]">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Every claim for {artistName} is reviewed by a real person on the Hiffi team. Your password is encrypted and
          never shared.
        </p>
      </section>
    </aside>
  )
}
