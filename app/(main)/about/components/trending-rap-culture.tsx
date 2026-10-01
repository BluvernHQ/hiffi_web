import Image from "next/image";
import Link from "next/link";
import { Flame, Music2, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    src: "/fanImage3.png",
    alt: "Hip hop graffiti art",
    className: "left-0 top-8 z-10 w-[42%] -rotate-12",
  },
  {
    src: "/aboutImage1.png",
    alt: "Performer silhouette on stage",
    className: "left-[28%] top-0 z-20 w-[38%] -rotate-6",
  },
  {
    src: "/AboutImage2.png",
    alt: "Artist portrait",
    className: "right-0 top-6 z-30 w-[44%] rotate-6",
  },
] as const;

const FEATURES: { icon: LucideIcon; text: string }[] = [
  { icon: Flame, text: "Discover rising stars and top performers." },
  { icon: Music2, text: "Listen to the hottest tracks breaking now." },
  { icon: Ticket, text: "Access events, drops & content made for fans." },
];

function StackedCard({ src, alt, className }: (typeof CARDS)[number]) {
  return (
    <div
      className={cn(
        "absolute aspect-[3/4] overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl",
        className
      )}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 40vw, 220px" />
    </div>
  );
}

export default function TrendingRapCulture() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/trendingRapBackground.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
      </div>

      {/* Blend from white Why Hiffi section above */}
      <div className="pointer-events-none absolute left-0 top-0 z-[1] h-28 w-56 md:h-36 md:w-72">
        <Image
          src="/whyHiffiTopShade.png"
          alt=""
          fill
          className="object-contain object-left-top"
          sizes="288px"
        />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-20">
        <div className="relative mx-auto h-[min(52vh,26rem)] w-full max-w-md lg:mx-0 lg:max-w-lg lg:h-[min(58vh,30rem)]">
          {CARDS.map((card) => (
            <StackedCard key={card.src} {...card} />
          ))}
        </div>

        <div className="flex flex-col text-white">
          <h2 className="text-[clamp(2rem,6vw,3.75rem)] font-bold uppercase leading-[0.95] tracking-tight">
            TRENDING RAP{" "}
            <span className="text-white/45">CULTURE</span>
          </h2>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/90 md:text-base">
            Stay ahead of the culture with trending artists, chart-topping releases, exclusive
            content, and unforgettable fan experiences all in one place.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col gap-2">
                <Icon className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
                <p className="text-xs leading-snug text-white/85 sm:text-sm">{text}</p>
              </div>
            ))}
          </div>

          <Button
            asChild
            variant="outline"
            className="mt-10 h-11 w-fit rounded-full border-white bg-transparent px-10 text-sm font-bold tracking-wide text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/">EXPLORE NOW</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
