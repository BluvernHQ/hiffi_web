"use client"

import Link from "next/link"
import { CookieSettingsButton } from "@/components/cookies/cookie-consent-banner"

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Cookie Policy</h1>

      <div className="space-y-8 text-foreground/90">
        <p className="italic text-muted-foreground">Last updated: September 5, 2026</p>

        <section className="space-y-4">
          <p className="leading-relaxed">
            This Cookie Policy explains how Kinimi Corporation (“Hiffi,” “we,” “our,” or “us”) uses
            cookies and similar technologies on the Hiffi website and related services (the
            “Platform”). It should be read together with our{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="leading-relaxed">
            You can change your cookie preferences at any time using{" "}
            <CookieSettingsButton className="inline font-medium text-primary hover:underline" />.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">What are cookies?</h2>
          <p className="leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They help
            the site remember your preferences, keep you signed in, measure performance, and
            understand how the Platform is used. Similar technologies include local storage and
            session storage in your browser.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">How we use cookies</h2>
          <p className="leading-relaxed">
            We use first-party cookies set by Hiffi and, when you allow analytics, third-party
            cookies or scripts from providers such as analytics and security services. Necessary
            cookies run so the Platform works. Functional and analytics cookies run only after you
            accept them (Accept all, or via Customize).
          </p>
          <p className="leading-relaxed">
            If you reject non-essential cookies, core browsing and account features still work.
            Preference features that rely on functional cookies (for example remembering mute or
            referral attribution across visits) may not persist.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Cookie categories</h2>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Necessary</h3>
              <p className="leading-relaxed">
                Required for security, authentication, and storing your cookie choice. These do not
                require consent.
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead className="bg-muted/50 text-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Cookie</th>
                      <th className="px-3 py-2 font-medium">Purpose</th>
                      <th className="px-3 py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground/90">
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">hiffi_cookie_consent</td>
                      <td className="px-3 py-2">Stores your cookie preferences</td>
                      <td className="px-3 py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">hiffi_username</td>
                      <td className="px-3 py-2">Helps keep you signed in</td>
                      <td className="px-3 py-2">30 days</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">hiffi_password</td>
                      <td className="px-3 py-2">Helps restore your session securely on this device</td>
                      <td className="px-3 py-2">30 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Cloudflare Turnstile may set cookies for bot protection on sign-up and similar
                forms. Session tokens may also be stored in browser local storage.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Functional</h3>
              <p className="leading-relaxed">
                Remember preferences and light product features. Used only with your consent.
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead className="bg-muted/50 text-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Cookie</th>
                      <th className="px-3 py-2 font-medium">Purpose</th>
                      <th className="px-3 py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground/90">
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">hiffi_player_muted</td>
                      <td className="px-3 py-2">Remembers mute preference</td>
                      <td className="px-3 py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">hiffi_player_volume</td>
                      <td className="px-3 py-2">Remembers volume level</td>
                      <td className="px-3 py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">hiffi_preview_audio</td>
                      <td className="px-3 py-2">Hero / preview audio preference</td>
                      <td className="px-3 py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">hiffi_active_mood</td>
                      <td className="px-3 py-2">Saves selected mood mix</td>
                      <td className="px-3 py-2">7 days</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">referral_code</td>
                      <td className="px-3 py-2">Tracks who referred you</td>
                      <td className="px-3 py-2">30 days</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">referral_redirect_profile</td>
                      <td className="px-3 py-2">Where to send you after signup</td>
                      <td className="px-3 py-2">1 day</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">hiffi_guest_plays</td>
                      <td className="px-3 py-2">Guest play count for signup nudges</td>
                      <td className="px-3 py-2">Session</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">hiffi_platform</td>
                      <td className="px-3 py-2">App download page platform hint</td>
                      <td className="px-3 py-2">30 minutes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Analytics</h3>
              <p className="leading-relaxed">
                Help us understand traffic and improve the product. Loaded only with your consent.
                Providers may set their own cookies.
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Umami (product analytics)</li>
                <li>Google Analytics (when enabled)</li>
                <li>Microsoft Clarity (when enabled)</li>
                <li>Hiffi first-party analytics (when enabled)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Managing your preferences</h2>
          <p className="leading-relaxed">
            Use{" "}
            <CookieSettingsButton className="inline font-medium text-primary hover:underline" />{" "}
            to accept, reject, or customize categories at any time. You can also control cookies
            through your browser settings (block, delete, or alert on cookies). Blocking necessary
            cookies may affect sign-in and security features.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Updates</h2>
          <p className="leading-relaxed">
            We may update this Cookie Policy when our practices change. The “Last updated” date at
            the top reflects the latest revision. Significant changes may prompt you to review your
            preferences again.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="leading-relaxed">
            Questions about cookies or this policy:{" "}
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
