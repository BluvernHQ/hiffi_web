import Image from "next/image";
import { cn } from "@/lib/utils";

const BADGES = [
  { label: "Artist First", className: "top-[18%] left-[4%] md:top-[22%] md:left-[8%]" },
  { label: "Fair Play", className: "top-[18%] right-[4%] md:top-[22%] md:right-[8%]" },
  { label: "Real Ownership", className: "bottom-[28%] left-[4%] md:bottom-[30%] md:left-[8%]" },
  { label: "Fan Connection", className: "bottom-[28%] right-[4%] md:bottom-[30%] md:right-[8%]" },
] as const;

function ValueBadge({ label, className }: (typeof BADGES)[number]) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-full bg-zinc-800 px-4 py-2.5 shadow-md",
        className
      )}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden />
      <span className="whitespace-nowrap text-sm font-medium text-white">{label}</span>
    </div>
  );
}

export default function WhyHiffiExists() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-0 top-0 z-0 h-28 w-56 md:h-36 md:w-72">
        <Image
          src="/whyHiffiTopShade.png"
          alt=""
          fill
          className="object-contain object-left-top"
          sizes="(max-width: 768px) 224px, 288px"
          priority
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(42vh,22rem)] overflow-hidden">
        <Image
          src="/whyHiffiCircleElement.png"
          alt=""
          fill
          className="object-cover object-bottom"
          sizes="100vw"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-20">
        <div className="mb-10 grid w-full max-w-md grid-cols-2 gap-3 sm:max-w-lg md:hidden">
          {BADGES.map((badge) => (
            <ValueBadge key={badge.label} {...badge} />
          ))}
        </div>

        <div className="relative flex w-full min-h-[min(55vh,32rem)] flex-col items-center justify-center md:min-h-[min(65vh,36rem)]">
          <div className="hidden md:contents">
            {BADGES.map((badge) => (
              <ValueBadge key={badge.label} {...badge} className={cn("absolute", badge.className)} />
            ))}
          </div>

          <h2 className="relative z-20 text-center text-[clamp(2.5rem,9vw,6.5rem)] font-bold uppercase leading-[0.9] tracking-tighter text-black">
            WHY HIFFI
          </h2>
          <h2
            className="relative z-20 -mt-1 text-center text-[clamp(3rem,11vw,8rem)] font-bold uppercase leading-none tracking-tighter text-primary [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_16%,black_100%)] [mask-image:linear-gradient(to_right,transparent_0%,black_16%,black_100%)]"
          >
            EXISTS
          </h2>
        </div>
      </div>
    </section>
  );
}
