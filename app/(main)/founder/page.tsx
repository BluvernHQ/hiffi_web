import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { absoluteUrl } from "@/lib/seo/site"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Founder Story | HIFFI",
  description:
    "Discover the story behind HIFFI, why it was created, and the vision to give independent hip hop artists greater opportunities to be discovered.",
  alternates: {
    canonical: absoluteUrl("/founder"),
  },
}

const aboutPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  mainEntity: {
    "@type": "Person",
    name: "Inoto Kinimi",
    jobTitle: "Founder",
    worksFor: {
      "@type": "Organization",
      name: "HIFFI",
    },
  },
}

export default function FounderPage() {
  return (
    <>
      <JsonLd data={aboutPageJsonLd} />
      <article className="mx-auto max-w-[1100px] px-6 py-8 sm:px-10 md:px-16 lg:px-20 xl:px-24 sm:py-12">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-md transition-colors hover:text-primary"
              >
                <Home className="h-3.5 w-3.5" aria-hidden />
                <span>Home</span>
              </Link>
            </li>
            <li aria-hidden className="text-border">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="font-medium text-foreground/80">Founder Story</li>
          </ol>
        </nav>

                                        {/* Hero Section */}
        <header className="mb-12 lg:mb-20">
          <div className="grid items-end gap-4 md:grid-cols-[1.1fr_1fr] lg:gap-0 xl:gap-2">
            
            <div className="order-2 space-y-6 md:order-1 lg:pr-8 z-10">
              <div className="mb-8 flex flex-col items-start">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                  THE FOUNDER&apos;S STORY
                </p>
                <div className="mt-3 h-[2px] w-12 bg-primary"></div>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[4rem] lg:leading-[1.05]">
                Talent is everywhere.
                <br />
                <span className="text-primary">Opportunity</span>
                <br />
                <span className="text-primary">should be too.</span>
              </h1>
              <p className="pt-4 text-[16px] text-muted-foreground/90 sm:text-[17px]">
                On why HIFFI exists, and the artists<br className="hidden sm:block" /> it was built for.
              </p>
            </div>
            
            <div className="order-1 flex justify-end md:order-2 -mr-6 sm:-mr-10 md:-mr-16 lg:-mr-20 xl:-mr-28">
              <div className="relative w-full max-w-full lg:max-w-[800px] xl:max-w-[900px]">
                <Image
                  src="/inoto-kinimi-final-photo.png"
                  alt="Inoto Kinimi, Founder of HIFFI"
                  width={1500}
                  height={1500}
                  className="w-full h-auto object-contain object-bottom"
                  priority
                />
                {/* Gentle edge fade overlays to softly blend the baked image into the page background without eating too much of the image */}
                <div className="absolute inset-y-0 left-0 w-6 sm:w-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-4 sm:w-6 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-4 sm:h-8 bg-gradient-to-b from-background to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-6 sm:h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-24">
          
          {/* Left Column: Metadata */}
          <aside className="order-2 lg:order-1">
            <div className="space-y-6 pt-2">
              <div>
                <h3 className="mb-1 text-[11px] font-medium text-muted-foreground">
                  Conceptualized
                </h3>
                <p className="font-bold text-foreground">2025</p>
              </div>
              <div>
                <h3 className="mb-1 text-[11px] font-medium text-muted-foreground">Launch</h3>
                <p className="font-bold text-foreground">14th February 2026</p>
              </div>
              <div>
                <h3 className="mb-1 text-[11px] font-medium text-muted-foreground">Founder</h3>
                <p className="font-bold text-foreground">Inoto Kinimi</p>
              </div>
            </div>
          </aside>

          {/* Right Column: Content */}
          <div className="order-1 min-w-0 space-y-12 lg:order-2">
            
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Building a platform for independent hip hop artists
              </h2>
              <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">
                <p>
                  HIFFI began with a simple idea — a global platform built for independent hip
                  hop artists, by people who believe the world should hear more real voices.
                </p>
                <p>
                  The music industry has always had incredible talent, but opportunity has
                  often been concentrated in a few places. We saw countless talented artists
                  creating powerful music, with unique stories and perspectives, who didn&apos;t get
                  the visibility they deserved. HIFFI was created to change that.
                </p>
                <p>
                  Our goal is to make it easier for artists to share their music, reach new
                  listeners and be discovered by a global audience — without the traditional
                  barriers.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Why HIFFI exists
              </h2>
              <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">
                <p>
                  Music <strong className="font-semibold text-foreground">has been part of my life</strong>{" "}
                  for as long as I can remember. I have never been an artist,{" "}
                  <strong className="font-semibold text-foreground">but I have always been a listener.</strong>{" "}
                  Over the years, I saw how many incredible artists were creating music in
                  their bedrooms, small studios and local communities, with no real way to be
                  seen.
                </p>
                <p>
                  HIFFI exists because talent is everywhere. It&apos;s in every city, every
                  language and every culture. Great music isn&apos;t limited to a few countries or
                  labels. We want to give independent hip hop artists a real opportunity to be
                  heard, appreciated and supported by a global community.
                </p>
              </div>

              <div className="my-8 overflow-hidden rounded-md bg-zinc-900 shadow-md">
                <div className="border-l-[3px] border-primary p-5 sm:p-6">
                  <p className="text-[13px] font-semibold leading-6 text-white sm:text-[14px]">
                    &quot;How many extraordinary artists has the world never heard?
                    <br />
                    <br />
                    How many incredible songs were created in bedrooms, small studios and
                    local scenes, waiting for an opportunity that never arrived?&quot;
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                We democratized creation
              </h2>
              <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">
                <p>
                  Technology has made it possible for anyone to create and share music. HIFFI
                  takes that further by building a platform where independent hip hop artists
                  can showcase their work, connect with listeners and grow their audience. We
                  believe in an open, fair and accessible space — not controlled by
                  gatekeepers, but powered by the community.
                </p>
                <p>
                  We are not just a streaming platform. We are a place for discovery, for
                  culture and for the next generation of hip hop.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Your postcode shouldn&apos;t determine how far your talent can travel
              </h2>
              <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">
                <p>
                  The next big artist could be anywhere — New York, London, Seoul, Lagos,
                  Mumbai or a small town that rarely makes the headlines. Talent is not
                  defined by location, and opportunity should not depend on where you live.
                </p>
                <p>
                  HIFFI gives artists a global stage. We want to break down borders and make
                  it possible for music fans everywhere to discover new voices, new stories
                  and new sounds.
                </p>
              </div>

              <div className="my-6 overflow-hidden rounded-sm bg-rose-50/60 dark:bg-primary/5">
                <div className="border-l-[3px] border-primary p-3 px-4">
                  <p className="text-[13px] font-bold text-foreground sm:text-[14px]">
                    Talent is everywhere. Opportunity should be too.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                From streams to careers
              </h2>
              <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">
                <p>
                  We believe the web of the music industry will be about much more than just
                  streams. HIFFI is about creating opportunities — for collaboration, for
                  recognition and for real careers. We want to connect artists with fans,
                  brands and the wider music ecosystem.
                </p>
                <p>
                  By giving artists the tools and visibility they need, we hope to help them
                  turn their passion into long-term opportunities.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Where the world discovers what comes next
              </h2>
              <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">
                <p>
                  HIFFI is a platform for the next wave of hip hop. It&apos;s where fans can
                  discover fresh talent, where artists can share their journey and where the
                  culture continues to grow. We want HIFFI to be the place the world looks to
                  when they want to find out what&apos;s next in hip hop.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                This is bigger than HIFFI
              </h2>
              <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">
                <p>
                  This is about more than one platform. It&apos;s about a movement. A future where
                  independent hip hop artists everywhere have the chance to be heard, to be
                  seen and to make an impact.
                </p>
                <p>
                  HIFFI gave me my first real chance. Now, we want to give that chance to
                  every independent artist who has a story to tell.
                </p>
              </div>

              <div className="my-6 overflow-hidden rounded-sm bg-rose-50/60 dark:bg-primary/5">
                <div className="border-l-[3px] border-primary p-3 px-4">
                  <p className="text-[13px] font-bold text-foreground sm:text-[14px]">
                    HIFFI gave me my first real chance.
                  </p>
                </div>
              </div>

              <div className="mt-12 flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-border">
                  <AvatarImage src="/inoto-kinimi-founder-photo-bg.jpg" alt="Inoto Kinimi" className="object-cover object-top" />
                  <AvatarFallback>IK</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[17px] font-bold text-foreground">Inoto Kinimi</p>
                  <p className="text-[14px] font-medium text-muted-foreground mt-0.5">Founder, HIFFI</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </article>
    </>
  )
}






