import Image from "next/image";
import { BarChart3, Globe, Music, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const HANGING_IMAGES = [
  {
    src: "/aboutImage1.png",
    alt: "Performer silhouette with microphone",
    rotate: "-rotate-6",
    wireHeight: "h-20 md:h-28",
  },
  {
    src: "/AboutImage2.png",
    alt: "Artist sitting on stadium bench at night",
    rotate: "rotate-3",
    wireHeight: "h-24 md:h-32",
  },
  {
    src: "/AboutImage3.png",
    alt: "Black and white stage performance",
    rotate: "rotate-6",
    wireHeight: "h-20 md:h-28",
  },
] as const;

const FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Music,
    title: "Keep More",
    description: "Your own your music. We help you earn what you deserve.",
  },
  {
    icon: BarChart3,
    title: "Grow Your Fanbase",
    description: "Build real connections and turn listeners into loyal fans.",
  },
  {
    icon: ShieldCheck,
    title: "Full Control",
    description: "You're in charge of your music, your data and your decisions.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Reach new audience around the world with no boundaries.",
  },
];

function HangingImage({
  src,
  alt,
  rotate,
  wireHeight,
}: (typeof HANGING_IMAGES)[number]) {
  return (
    <div className={`flex flex-col items-center ${rotate}`}>
      <div className={`w-px ${wireHeight} bg-primary/70`} aria-hidden />
      <div className="relative mt-1 aspect-[3/4] w-28 sm:w-36 md:w-44 lg:w-52 overflow-hidden shadow-[0_0_48px_rgba(237,28,47,0.4)]">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 30vw, 208px" />
      </div>
    </div>
  );
}

function FeatureColumn({
  icon: Icon,
  title,
  description,
  showDivider,
}: (typeof FEATURES)[number] & { showDivider: boolean }) {
  return (
    <div
      className={`flex flex-col items-center px-6 text-center lg:items-start lg:text-left ${
        showDivider ? "lg:border-l lg:border-primary/60" : ""
      }`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="mb-2 text-lg font-bold tracking-tight text-white md:text-xl">{title}</h3>
      <p className="max-w-xs text-sm leading-relaxed text-white/70 md:text-[0.9375rem]">{description}</p>
    </div>
  );
}

export default function About() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Image
          src="/lightsBackground.png"
          alt=""
          fill
          priority
          className="object-cover object-bottom"
          sizes="100vw"
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-6 pb-12 pt-28 md:pb-32 md:pt-0">
        <div className="mb-12 flex items-end justify-center gap-3 sm:gap-6 md:mb-20 md:gap-10 lg:gap-14">
          {HANGING_IMAGES.map((image) => (
            <HangingImage key={image.src} {...image} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4 lg:gap-0">
          {FEATURES.map((feature, index) => (
            <FeatureColumn key={feature.title} {...feature} showDivider={index > 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
