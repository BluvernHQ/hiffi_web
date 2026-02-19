import Image from "next/image"

export const dynamic = "force-static"

export default function MaintenancePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/appbarlogo.png"
            alt="Hiffi"
            width={160}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            Scheduled maintenance
          </span>
        </div>

        {/* Main card */}
        <div className="rounded-3xl border border-border/80 bg-background/90 backdrop-blur-xl px-6 py-7 shadow-2xl shadow-black/30 space-y-4">
          <div className="inline-flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/25 rounded-2xl blur-2xl" />
              <div className="relative h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-foreground">!</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              We&rsquo;ll be back soon
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Hiffi is currently undergoing a short maintenance window. We expect to be back
              online in about{" "}
              <span className="font-semibold text-foreground">
                10 minutes
              </span>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-left space-y-1.5">
            <p className="text-xs md:text-sm font-medium text-foreground">
              What&rsquo;s happening?
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              We&rsquo;re rolling out updates and performance improvements so your viewing
              experience stays smooth and reliable. Some features may be temporarily
              unavailable while we finish up.
            </p>
          </div>

          <p className="text-xs md:text-sm text-muted-foreground">
            If this page is still visible after 10 minutes, try refreshing your browser.
          </p>
        </div>
      </div>
    </main>
  )
}


