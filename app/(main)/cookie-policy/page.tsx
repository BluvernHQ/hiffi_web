"use client"

import Link from "next/link"
import { CookieSettingsButton } from "@/components/cookies/cookie-consent-banner"

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">How Hiffi uses cookies</h1>

      <div className="space-y-8 text-foreground/90">
        <p className="italic text-muted-foreground">Last updated: September 5, 2026</p>

        <section className="space-y-4">
          <p className="leading-relaxed">
            This page describes how Kinimi Corporation (“Hiffi,” “we,” “our,” or “us”) uses cookies
            and similar technologies on the Hiffi website and related services. It also explains how
            you can manage your choices.
          </p>
          <p className="leading-relaxed">
            Cookies are small pieces of text sent to your browser by a website you visit. They help
            that website remember information about your visit, which can make it easier to use the
            site again and make the service more useful to you. Similar technologies — such as local
            storage and session storage — can perform the same kind of function.
          </p>
          <p className="leading-relaxed">
            See our{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            to learn how we protect your privacy when we use cookies and other information. You can
            change your cookie preferences at any time using{" "}
            <CookieSettingsButton className="inline font-medium text-primary hover:underline" />.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Purposes of cookies and similar technologies used by Hiffi
          </h2>
          <p className="leading-relaxed">
            Hiffi may store or use cookies or similar technologies in your browser for the purposes
            described below. Necessary cookies are used so the Platform can function. Optional
            cookies (functional and analytics) are used only after you accept them — either by
            choosing Accept all or by customizing your preferences.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Necessary and security</h2>
          <p className="leading-relaxed">
            Some cookies and similar technologies are needed to keep Hiffi working safely. We use
            them to remember your cookie choices, keep you signed in on this device when you choose
            to stay signed in, and help protect the Platform against spam, abuse, and automated
            attacks on forms such as sign-up.
          </p>
          <p className="leading-relaxed">
            These technologies are treated as necessary for the service. Turning them off in your
            browser may affect sign-in and security features.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Functionality</h2>
          <p className="leading-relaxed">
            Cookies and similar technologies used for functionality help remember choices and
            preferences that make Hiffi easier to use — for example playback mute and volume,
            preview audio preferences, a selected mood mix, referral information after someone
            shares Hiffi with you, guest viewing hints that encourage sign-up, and a short-lived
            platform hint on the app download page.
          </p>
          <p className="leading-relaxed">
            These are optional. If you reject them, you can still browse and use your account; some
            preferences simply may not persist between visits.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Analytics</h2>
          <p className="leading-relaxed">
            We use cookies and similar technologies for analytics to understand how people interact
            with Hiffi. This helps us measure engagement, find problems, and improve content,
            quality, and features.
          </p>
          <p className="leading-relaxed">
            Depending on your choices, this may include our own analytics and analytics services from
            trusted partners. Those services may set their own cookies or identifiers when analytics
            is allowed.
          </p>
          <p className="leading-relaxed">
            Analytics cookies are optional and load only after you consent.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Managing your cookie choices</h2>
          <p className="leading-relaxed">
            When you first visit Hiffi, you can accept all cookies, reject optional cookies, or
            customize categories. You can update that choice later with{" "}
            <CookieSettingsButton className="inline font-medium text-primary hover:underline" />{" "}
            (also linked from our site footer).
          </p>
          <p className="leading-relaxed">
            Most browsers also let you manage how cookies are set, view or delete cookies, or block
            them for specific sites. Browser controls vary; check your browser’s help pages for
            details. Blocking all cookies, including necessary ones, may limit how Hiffi works for
            you.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Updates</h2>
          <p className="leading-relaxed">
            We may update this page when our practices change. The “Last updated” date above shows
            when it was last revised. If we make significant changes, we may ask you to review your
            cookie preferences again.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="leading-relaxed">
            Questions about cookies on Hiffi:{" "}
            <a href="mailto:care@hiffi.com" className="font-medium text-primary hover:underline">
              care@hiffi.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
