"use client"

import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"

export default function SupportPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Hiffi Support</h1>

        <div className="space-y-8 text-foreground/90">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">How we can help</h2>
            <p className="leading-relaxed">
              Hiffi is a global platform that helps artists stream live performances, share recorded content, and
              receive support from their audiences through voluntary payments, tips, and subscriptions. If you have any
              issues with your account, payments, streams, or have feedback or feature requests, we want to hear from you.
            </p>
            <p className="leading-relaxed">
              If you have any issues, feedback, or feature requests, contact us at{" "}
              <a
                href="mailto:care@hiffi.com"
                className="text-primary hover:underline font-medium"
              >
                care@hiffi.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Contact options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-muted/40 rounded-xl border border-border/70 space-y-2">
                <p className="font-semibold text-foreground">Email support</p>
                <p className="text-sm text-muted-foreground">
                  For general questions, account issues, or problem reports, email our support team directly.
                </p>
                <a
                  href="mailto:care@hiffi.com"
                  className="inline-flex text-sm font-medium text-primary hover:underline mt-1"
                >
                  care@hiffi.com
                </a>
              </div>

              <div className="p-5 bg-muted/20 rounded-xl border border-dashed border-border/70 space-y-2">
                <p className="font-semibold text-foreground">Platform policies</p>
                <p className="text-sm text-muted-foreground">
                  For details on how we handle your data, payments, and community standards, review our policies below.
                </p>
                <div className="flex flex-wrap gap-3 mt-1 text-sm">
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  <Link href="/terms-of-use" className="text-primary hover:underline">
                    Terms of Use
                  </Link>
                  <Link href="/payment-terms" className="text-primary hover:underline">
                    Payment Terms
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">When to contact us</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li>Issues signing in, accessing your profile, or managing your account.</li>
              <li>Questions or problems related to payments, tips, subscriptions, or payouts.</li>
              <li>Reporting bugs, abusive behavior, or content that violates our policies.</li>
              <li>Suggestions for improvements or new features you would like to see.</li>
            </ul>
          </section>

          <section className="space-y-2 text-sm text-muted-foreground">
            <p>
              We aim to respond to most support requests within{" "}
              <span className="font-medium text-foreground">1–3 business days</span>, depending on volume.
            </p>
            <p>
              For privacy-specific questions, you can also review the contact details in our{" "}
              <Link href="/privacy-policy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}

