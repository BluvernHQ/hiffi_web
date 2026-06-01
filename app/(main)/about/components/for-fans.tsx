import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Music2, PlayCircle, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES: {
  image: string;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    image: "/fanImage1.png",
    icon: MessageCircle,
    title: "REAL CONVERSATIONS",
    description: "Join discussions and connect with rap fans worldwide.",
  },
  {
    image: "/fanImage2.png",
    icon: PlayCircle,
    title: "FAN PLAYLISTS",
    description: "Explore playlists curated by the community.",
  },
  {
    image: "/fanImage3.png",
    icon: Music2,
    title: "RISING ARTISTS",
    description: "Discover emerging talent before they blow up.",
  },
  {
    image: "/fanImage4.png",
    icon: Star,
    title: "VIP ACCESS",
    description: "Unlock early releases, rewards and exclusives.",
  },
];

function FeatureCard({
  image,
  icon: Icon,
  title,
  description,
}: (typeof FEATURES)[number]) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg">
        <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 768px) 45vw, 200px" />
      </div>
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
        <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.25} aria-hidden />
      </div>
      <h3 className="text-[0.65rem] font-bold uppercase leading-tight tracking-wide text-white sm:text-xs">
        {title}
      </h3>
      <p className="text-[0.6rem] leading-snug text-white/55 sm:text-[0.65rem]">{description}</p>
    </div>
  );
}

export default function ForFans() {
  return (
    <section id="for-fans" className="relative min-h-screen w-full overflow-hidden bg-black py-16 md:py-20">
      <div className="absolute inset-0">
        <Image src="/lightsBackground.png" alt="" fill className="object-cover object-center opacity-90" sizes="100vw" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-[0_0_80px_rgba(237,28,47,0.15)]">
          <div className="relative min-h-[min(52vh,28rem)]">
            <Image
              src="/fansBackground.png"
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 1152px) 100vw, 1152px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/70" />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-28 pt-10 text-center md:px-12 md:pb-32">
              <h2 className="text-[clamp(3rem,12vw,7rem)] font-bold uppercase leading-[0.88] tracking-tighter text-white">
                FOR
              </h2>
              <h2 className="-mt-1 text-[clamp(3.25rem,13vw,7.5rem)] font-bold uppercase leading-none tracking-tighter text-primary">
                FANS
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/90 md:text-base">
                Discover trending artists, emerging sounds, and the culture shaping today&apos;s music scene.
                Explore what listeners are vibing with right now.
              </p>
              <Button
                asChild
                className="mt-7 h-11 rounded-full bg-primary px-8 text-base font-semibold hover:bg-primary/90"
              >
                <Link href="/">Explore Hiffi!</Link>
              </Button>
            </div>
          </div>

          <div className="relative z-20 -mt-14 px-3 pb-3 sm:-mt-16 sm:px-4 sm:pb-4 md:-mt-20">
            <div
              className={cn(
                "rounded-2xl border border-primary/80 bg-black/95 p-3 backdrop-blur-sm sm:p-4",
                "shadow-[0_0_24px_rgba(237,28,47,0.25)]"
              )}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-3 md:gap-4">
                {FEATURES.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
