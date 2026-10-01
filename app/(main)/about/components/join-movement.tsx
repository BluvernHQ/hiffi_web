import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function DecorativeImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute", className)}>
      <Image src={src} alt={alt} fill className="object-contain" sizes="200px" />
    </div>
  );
}

export default function JoinMovement() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-0 top-0 z-0 h-28 w-56 md:h-40 md:w-72">
        <Image
          src="/whyHiffiTopShade.png"
          alt=""
          fill
          className="object-contain object-left-top"
          sizes="288px"
        />
      </div>

      <DecorativeImage
        src="/loudSpeaker.png"
        alt=""
        className="right-4 top-8 z-0 h-28 w-28 md:right-12 md:top-12 md:h-40 md:w-40"
      />
      <DecorativeImage
        src="/star.png"
        alt=""
        className="left-[8%] top-[42%] z-0 h-20 w-20 md:left-[12%] md:h-28 md:w-28"
      />
      <DecorativeImage
        src="/chat.png"
        alt=""
        className="right-[6%] top-[38%] z-0 h-24 w-24 md:right-[10%] md:h-32 md:w-32"
      />
      <DecorativeImage
        src="/hand.png"
        alt=""
        className="bottom-0 right-0 z-0 h-44 w-44 md:h-56 md:w-56 lg:h-64 lg:w-64"
      />

      <div
        className="pointer-events-none absolute bottom-8 left-6 z-0 max-w-[11rem] rotate-[-4deg] bg-zinc-900 px-4 py-5 shadow-lg md:bottom-12 md:left-12 md:max-w-[13rem]"
        style={{
          clipPath:
            "polygon(2% 8%, 8% 2%, 92% 0%, 98% 6%, 100% 88%, 94% 96%, 6% 100%, 0% 92%)",
        }}
        aria-hidden
      >
        <div className="mb-2 h-3 w-10 bg-primary/90" />
        <p className="font-serif text-lg font-bold leading-tight text-white md:text-xl">
          FOR THE
          <br />
          FANS
        </p>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="relative mb-4 inline-flex items-center justify-center">
          <div className="relative h-14 w-36 md:h-16 md:w-44">
            <Image
              src="/whyHiffiTopShade.png"
              alt=""
              fill
              className="object-contain"
              sizes="176px"
            />
          </div>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold uppercase tracking-wide text-white md:text-2xl">
            JOIN
          </span>
        </div>

        <div className="mb-3 flex items-center justify-center gap-1.5" aria-hidden>
          <span className="h-6 w-0.5 bg-primary" />
          <span className="h-8 w-0.5 bg-primary" />
          <span className="h-6 w-0.5 bg-primary" />
        </div>

        <div className="mb-4 w-full max-w-md">
          <Image
            src="/heartWithLines.png"
            alt=""
            width={320}
            height={80}
            className="mx-auto h-auto w-48 md:w-56"
          />
        </div>

        <h2 className="text-[clamp(2.5rem,10vw,5.5rem)] font-bold uppercase leading-[0.92] tracking-tighter text-black">
          THE MOVEMENT
        </h2>

        <p className="mt-6 max-w-xl text-sm leading-relaxed text-zinc-800 md:text-base">
          Discover trending artists, emerging sounds, and the culture shaping today&apos;s music scene.
          Explore what listeners are vibing with right now.
        </p>

        <div className="mt-10 flex w-full max-w-2xl flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <Button
            asChild
            className="h-11 rounded-full bg-primary px-8 text-sm font-semibold hover:bg-primary/90"
          >
            <Link href="/signup">Join Hiffi</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-zinc-900 bg-white px-8 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            <Link href="/creator/apply">Become an Artist</Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-full bg-primary px-8 text-sm font-semibold hover:bg-primary/90"
          >
            <Link href="#for-fans">Become a fan</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
