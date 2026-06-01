import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function JoinMovement() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Image
          src="/lightsBackground.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="relative mb-6 inline-flex items-center justify-center px-2">
          <span
            className="absolute inset-0 -skew-x-6 rounded-sm bg-primary"
            aria-hidden
            style={{ transform: "rotate(-3deg) scale(1.08, 1.15)" }}
          />
          <span className="relative px-6 py-1 text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">
            JOIN
          </span>
        </div>

        <h2 className="text-[clamp(2.75rem,11vw,6.5rem)] font-bold uppercase leading-[0.9] tracking-tighter text-white">
          THE
        </h2>
        <h2 className="-mt-1 text-[clamp(3rem,12vw,7rem)] font-bold uppercase leading-none tracking-tighter text-primary">
          MOVEMENT
        </h2>

        <p className="mt-6 max-w-xl text-sm font-light leading-relaxed text-white/85 md:text-base">
          Discover trending artists, emerging sounds, and the culture shaping today&apos;s music scene.
          Explore what listeners are vibing with right now.
        </p>

        <div className="mt-10 flex w-full max-w-2xl flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <Button
            asChild
            className="h-11 rounded-full bg-primary px-8 text-sm font-semibold hover:bg-primary/90 sm:text-base"
          >
            <Link href="/signup">Join Hiffi</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className={cn(
              "h-11 rounded-full border-white/90 bg-transparent px-8 text-sm font-semibold text-white",
              "hover:bg-white/10 hover:text-white"
            )}
          >
            <Link href="/creator/apply">Become an Artists</Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-full bg-primary px-8 text-sm font-semibold hover:bg-primary/90 sm:text-base"
          >
            <Link href="#for-fans">Become a fan</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
