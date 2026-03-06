"use client"

import Link from "next/link"

export default function PaymentTermsPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Payment Terms, Refund and Cancellation Policy</h1>
        
        <div className="space-y-8 text-foreground/90">
          <p className="text-muted-foreground italic">Effective Date: February 14, 2026</p>
          
          <section className="space-y-4">
            <p className="leading-relaxed">
              These Payment Terms (“Terms”) set out the rules for making and receiving payments through the Platform Hiffi (“we,” “our,” or “us”) platform, which includes our website, mobile application, and related services (collectively, the “Platform”). These Terms are a legally binding agreement between you and the Platform, whether you are an audience member making a payment or an artist receiving a payout.
            </p>
            <p className="leading-relaxed">
              By using the Platform’s payment features, you agree to be bound by these Payment Terms, along with our <Link href="/terms-of-use" className="text-primary hover:underline">Terms of Use</Link> and <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>. If you do not agree, you must not use the payment features of the Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Nature of Payments</h2>
            <p className="leading-relaxed">
              All monetary contributions made by audience members to artists on the Platform are strictly commercial in nature and represent voluntary support payments, tips, subscriptions, or other forms of paid access in appreciation of content provided through the Platform. Such payments are not donations, charitable contributions, or gifts, and no tax treatment applicable to donations shall apply. The Platform acts as a facilitator, enabling secure processing of these payments between audience members and artists. Platform complies with applicable state money transmission laws and operates payment processing through licensed payment service providers. All payments are subject to the Bank Secrecy Act (BSA) and Anti-Money Laundering (AML) regulations administered by FinCEN.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Payment Processing</h2>
            <p className="leading-relaxed">
              All transactions on the Platform are processed through secure third-party payment gateways integrated into the Platform. By making or receiving a payment, you authorise us to receive funds on your behalf, deduct any applicable platform facilitation fee or service commission, and remit the balance to the intended recipient in accordance with these Payment Terms. We do not store full payment card details on our servers; all sensitive payment information is handled in compliance with Payment Card Industry Data Security Standard (PCI DSS) v4.0 requirements, including encryption of cardholder data both in transit and at rest, secure network architecture, and regular security testing. We are not a bank and do not provide banking services; payment services are provided by our third-party payment processors under their terms.
            </p>
            <p className="leading-relaxed">
              Kinimi Corporation maintains PCI DSS compliance through third-party validated payment processors and undergoes periodic security assessments. Cardholder data is tokenized where possible, and access to payment information is restricted to authorized personnel only. We implement industry-standard fraud detection tools, velocity checks, and risk-based authentication measures to prevent unauthorized transactions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Platform Facilitation Fee or Commission</h2>
            <p className="leading-relaxed">
              We deduct a platform facilitation fee or service commission from each transaction to cover the costs of operating and maintaining the Platform, including hosting, streaming infrastructure, moderation, and payment processing charges. The applicable percentage or amount will be communicated to artists during onboarding and may be updated from time to time with prior notice. The deducted amount will be reflected in settlement statements issued to the artist.
            </p>
            <p className="leading-relaxed">
              Fee changes will be notified to artists at least thirty (30) days in advance via email and in-platform notification. Artists who do not wish to accept the revised fee structure may terminate their account before the effective date of the change.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Artist Payouts</h2>
            <p className="leading-relaxed">
              All amounts due to artists will be calculated net of the platform facilitation fee, applicable taxes, and any chargebacks or refunds processed during the relevant period. Payouts will be made to the bank account or payment method designated by the artist during registration. Artists must complete Know Your Customer (KYC) verification, including submission of government-issued identification, Social Security Number (SSN) or Employer Identification Number (EIN) for US-based artists, Individual Taxpayer Identification Number (ITIN) where applicable, proof of address, and verified bank account details, before receiving payouts. Kinimi Corporation reserves the right to withhold payouts until KYC verification is successfully completed.
            </p>
            <p className="leading-relaxed">
              For artists receiving payments exceeding $600 USD in a calendar year, Kinimi Coporation will issue IRS Form 1099-K or other applicable tax forms as required by US tax law. International artists may be subject to IRS Form W-8BEN or W-8BEN-E requirements and applicable withholding taxes under US tax treaties.
            </p>
            <p className="leading-relaxed">
              Kinimi Coporation reserves the right to conduct enhanced due diligence for artists whose transactions exceed certain thresholds, exhibit unusual patterns, or originate from high-risk jurisdictions. Payouts may be delayed or withheld pending completion of such reviews or if accounts are flagged for potential money laundering, fraud, or other suspicious activity in accordance with FinCEN guidance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Payout Schedule</h2>
            <p className="leading-relaxed">
              Unless otherwise agreed in writing, payouts will be processed on a monthly basis, subject to applicable minimum payout thresholds. The actual time taken for funds to reflect in the artist’s account will depend on the payment processor, banking systems, and the artist’s country of residence. We are not responsible for delays, holds, or rejections caused by third-party processors or financial institutions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Taxes and Withholding</h2>
            <p className="leading-relaxed">
              Artists are solely responsible for determining and paying any taxes, duties, or levies applicable to amounts they receive through the Platform in their respective jurisdictions. Where required by law, we will deduct applicable withholding taxes at source and issue relevant tax documentation. Artists agree to provide accurate tax information and to indemnify Kinimi Corporation against any claims, liabilities, or penalties arising from their failure to comply with tax obligations.
            </p>
            <p className="leading-relaxed">
              US-based artists are responsible for reporting all income received through the Platform on their federal and state tax returns. Kinimi Coporation will provide annual tax statements (Form 1099-K) to eligible artists and to the Internal Revenue Service as required. International artists receiving payments may be subject to US withholding tax under IRC Section 1441-1443 unless exempt under an applicable tax treaty. Artists must provide accurate IRS Form W-9 (US persons) or Form W-8BEN/W-8BEN-E (non-US persons) to establish their tax status and treaty benefits, if applicable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Chargebacks, Refunds, and Disputes</h2>
            <p className="leading-relaxed">
              In the event of a chargeback, refund, or reversal initiated by an audience member, we reserve the right to deduct the corresponding amount from the artist’s future payouts, along with any associated fees charged by the payment processor. We may, at its sole discretion, issue refunds to audience members where required by law, where a transaction is found to be fraudulent, or where content or benefits promised were not delivered.
            </p>
            <p className="leading-relaxed">
              Artists acknowledge that excessive chargebacks may result in account suspension or termination, as required by payment processor regulations. Artists with chargeback ratios exceeding 1% of total transactions or exceeding industry thresholds set by card networks may be subject to additional monitoring, holding periods on payouts, or account restrictions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Fraud Prevention and Compliance</h2>
            <p className="leading-relaxed">
              We monitor transactions for fraud, money laundering, terrorist financing, and other unlawful activities in compliance with the Bank Secrecy Act (BSA), Anti-Money Laundering (AML) regulations, and Office of Foreign Assets Control (OFAC) sanctions programs. Kinimi Corporation maintains a comprehensive AML program that includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Customer identification and verification procedures (CIP)</li>
              <li>Transaction monitoring for suspicious patterns, including structuring, rapid movement of funds, and transactions involving high-risk jurisdictions</li>
              <li>Suspicious Activity Report (SAR) filing with FinCEN when required by law</li>
              <li>Currency Transaction Report (CTR) filing for transactions exceeding $10,000 USD</li>
              <li>OFAC sanctions screening to prevent transactions with blocked persons or entities</li>
              <li>Record retention in accordance with federal requirements (minimum 5 years)</li>
            </ul>
            <p className="leading-relaxed">
              We reserve the right to place holds on funds, suspend accounts, freeze transactions, or reverse payments if suspicious activity is detected, or if we are required to do so by law, court order, payment processor directive, or regulatory authority. Artists and audience members must cooperate fully in any investigation related to payment disputes, fraud, or suspected illegal activity, including providing additional documentation upon request. Failure to cooperate may result in permanent account suspension and forfeiture of pending payouts.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Currency and Exchange Rates</h2>
            <p className="leading-relaxed">
              All transactions on the Platform are processed in the currency shown at the time of payment. If your payment or payout involves a currency different from your local currency, the exchange rate and any conversion fees will be set by the payment processor or your bank. We do not set these rates or fees, and the final amount you are charged or receive may differ slightly from the amount shown due to these conversions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Limitation of Liability for Payments</h2>
            <p className="leading-relaxed">
              While Kinimi Corporation takes commercially reasonable measures to ensure secure and reliable payment processing, we are not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Failures or delays caused by payment processors, banking institutions, or card networks;</li>
              <li>Unauthorised transactions resulting from your failure to maintain account security; or</li>
              <li>Losses resulting from currency conversion or fluctuating exchange rates.</li>
              <li>Delays, holds, or account freezes resulting from fraud investigations, AML/sanctions screening, or regulatory compliance requirements.</li>
            </ul>
            <p className="leading-relaxed">
              Your sole remedy for any payment-related issue is to contact our support team, who will work with you and, where necessary, our payment partners to attempt to resolve the matter. To the maximum extent permitted by law, Kinimi Coporation&apos;s total liability for any payment-related claims shall not exceed the lesser of (i) the amount of the disputed transaction, or (ii) $500 USD. This limitation applies regardless of the form of action, whether in contract, tort, strict liability, or otherwise.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">11. Refunds and Cancellations</h2>
            <div className="space-y-4">
              <p>
                <span className="font-semibold">11.1 Audience-Initiated Cancellations and Refunds:</span> Payments made through the Platform for voluntary support, tips, or subscriptions are generally non-refundable, as they are intended to support the artist for content already delivered or made available, subject to applicable state consumer protection laws that may provide additional refund rights. However, if you have been charged in error, if the payment was unauthorised, or if the promised subscription benefits were not delivered by the artist, you may contact our support team within seven (7) days of the transaction to request a review. Requests made after this period may not be eligible for consideration. Refund requests must be submitted through our designated support channels with transaction details, reason for request, and supporting evidence where applicable. We will respond to refund requests within five (5) business days of receipt.
              </p>
              <p>
                <span className="font-semibold">11.2 Artist-Initiated Refunds:</span> Artists may, at their discretion, authorise refunds to audience members if there is a valid reason, for example, technical issues during a paid live stream or inability to provide paid access to exclusive content. When an artist agrees to a refund, we will process it through the original payment method, and any applicable platform facilitation fees or payment processor charges may be deducted.
              </p>
              <p>
                <span className="font-semibold">11.3 Refund Processing and Timeframes:</span> Approved refunds will be processed back to the original payment method within a reasonable period, typically within 7–14 business days, depending on the payment processor and financial institution. We are not responsible for delays caused by the payment processor, banks, or card issuers. In cases where refunds are processed to credit cards, cardholders should allow one to two billing cycles for the refund to appear on their statement.
              </p>
              <p>
                <span className="font-semibold">11.4 Chargebacks and Reversals:</span> If an audience member disputes a payment directly with their bank or payment provider (a “chargeback”), we reserve the right to deduct the disputed amount and any associated fees from the artist’s future payouts. Where the dispute is found in favour of the audience member, the transaction will be reversed, and the artist will bear the cost of the reversal. Artists agree to cooperate in chargeback dispute resolution by providing evidence of content delivery, transaction authorization, and terms of sale. Kinimi Coporation will represent artists in chargeback disputes where appropriate, but final decisions rest with the card issuer. Artists with excessive chargebacks may be required to maintain a reserve account or may face account termination.
              </p>
              <p>
                <span className="font-semibold">11.5 Platform-Initiated Refunds:</span> Kinimi Corporation may, in its sole discretion, issue refunds or credits to audience members if:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>There is evidence of fraud or unauthorised use of an account;</li>
                <li>The payment was made in error due to a technical fault in the Platform;</li>
                <li>Required content or benefits were not provided by the artist;</li>
                <li>We are required to do so by law or payment processor rules or regulatory directive; or</li>
                <li>The transaction violates OFAC sanctions, AML regulations, or other applicable financial compliance requirements.</li>
              </ul>
              <p>
                <span className="font-semibold">11.6 Non-Refundable Items:</span> Unless otherwise required by applicable consumer protection law in your state of residence, payments for the following are non-refundable:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Completed voluntary support payments/tips;</li>
                <li>Platform service fees; and</li>
                <li>Transactions outside the dispute window.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">12. Contact Information for Payment Disputes</h2>
            <div className="space-y-4">
              <p className="leading-relaxed">
                For payment-related questions, disputes, or issues, please contact:
              </p>
              <div className="p-6 bg-muted/30 rounded-xl border border-border space-y-2">
                <p><span className="font-semibold">Email:</span> <a href="mailto:care@hiffi.com" className="text-primary hover:underline">care@hiffi.com</a></p>
                <p><span className="font-semibold">Mailing Address:</span> 8 The Green STE A, Dover, Kent County, 19901</p>
                <p><span className="font-semibold">Business Hours:</span> 10 AM to 6 PM (GMT-5)</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">13. Record Retention and Audit Rights</h2>
            <p className="leading-relaxed">
              Kinimi Corporation maintains transaction records, payment history, and related documentation for a minimum of five (5) years as required by the Bank Secrecy Act and IRS regulations. Artists and audience members agree to maintain their own records of transactions and to provide supporting documentation if requested in connection with tax audits, payment disputes, or regulatory investigations.
            </p>
            <p className="leading-relaxed">
              Kinimi Corporation reserves the right to audit artist accounts to verify compliance with these Payment Terms, including reviewing transaction patterns, content delivery, and customer communications. Artists must cooperate with such audits and provide requested documentation within ten (10) business days of notice.
            </p>
          </section>

          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">Last Revised: February 14, 2026</p>
            <p className="text-sm text-muted-foreground mt-2">© 2026 Kinimi Corporation. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  )
}
