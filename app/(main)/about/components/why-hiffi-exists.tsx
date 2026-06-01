import Image from "next/image";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGES = [
  { label: "Artist First", className: "top-[12%] left-[2%] xl:left-[4%]" },
  { label: "Fair Pay", className: "top-[12%] right-[2%] xl:right-[4%]" },
  { label: "Real Ownership", className: "bottom-[12%] left-[2%] xl:left-[4%]" },
  { label: "Fan Connection", className: "bottom-[12%] right-[2%] xl:right-[4%]" },
] as const;

function ValueBadge({ label, className }: (typeof BADGES)[number]) {
  return (
    <div
      className={cn(
        "absolute z-30 flex items-center gap-2 rounded-full border border-primary bg-white px-4 py-2 shadow-sm",
        className
      )}
    >
      <Star className="h-4 w-4 shrink-0 fill-[#F5B301] text-[#F5B301]" aria-hidden />
      <span className="whitespace-nowrap text-sm font-medium text-zinc-700">{label}</span>
    </div>
  );
}

export default function WhyHiffiExists() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">

      {/* Background */}
      <Image
        src="/lightsBackground.png"
        alt=""
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority
      />

      {/* Chain — absolute, full width, vertically centered */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="flex w-full items-center">
          <div className="w-1/2 overflow-hidden">
            <Image
              src="/chainLeft.png"
              alt=""
              width={726}
              height={897}
              sizes="50vw"
              className="ml-auto h-auto w-full object-cover object-right"
            />
          </div>
          <div className="w-1/2 overflow-hidden">
            <Image
              src="/chainRight.png"
              alt=""
              width={726}
              height={897}
              sizes="50vw"
              className="h-auto w-full object-cover object-left"
            />
          </div>
        </div>
      </div>

      {/* WHY HIFFI — top center */}
      <h2 className="absolute top-[10%] left-1/2 z-20 -translate-x-1/2 text-center text-[clamp(2.5rem,8vw,6.75rem)] font-bold uppercase leading-none tracking-tighter text-white">
        WHY HIFFI
      </h2>

      {/* EXISTS — bottom center */}
      <h2 className="absolute bottom-[20%] left-1/2 z-20 -translate-x-1/2 text-center text-[clamp(3rem,10vw,8rem)] font-bold uppercase leading-none tracking-tighter text-primary">
        EXISTS
      </h2>

      {/* Badges */}
      {BADGES.map((badge) => (
        <ValueBadge key={badge.label} {...badge} />
      ))}

    </section>
  );
}