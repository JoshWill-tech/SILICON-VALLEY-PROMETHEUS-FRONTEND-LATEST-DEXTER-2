import type { Metadata } from 'next'

import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Refund Policy | Prometheus',
  description: 'Comprehensive Refund Policy for Prometheus AI.',
}

export default function RefundPage() {
  return (
    <LegalLayout
      title="Comprehensive Refund Policy"
      description="Effective Date: May 23, 2026 Product / Entity: Prometheus AI (prometheusstudio.tech)"
      currentPath="/refund"
    >
      <LegalSection title="1. Introduction and Merchant of Record">
        <p>
          This Refund Policy governs the conditions under which refunds are issued for subscriptions, products, and services purchased through Prometheus AI.
        </p>
        <p>
          Our order process, tax calculation, and transaction execution are conducted exclusively by our online reseller and Merchant of Record, Paddle.com Market Ltd (&quot;Paddle&quot;). By completing a purchase, you are entering into a direct financial transaction with Paddle. Consequently, Paddle handles all financial transaction processing, billing customer service inquiries, and the technical execution of approved returns and refunds.
        </p>
      </LegalSection>

      <LegalSection title="2. The 14-Day Satisfaction Guarantee">
        <p>
          Prometheus AI offers a strict, conditional 14-day money-back guarantee for first-time purchasers. If you are unsatisfied with the quality or functionality of our service, you are entitled to request a full refund within exactly fourteen (14) calendar days from the exact timestamp of your initial transaction.
        </p>
        <p>
          This guarantee is subject to the conditions and exclusions explicitly detailed in Sections 3 and 4 of this policy.
        </p>
      </LegalSection>

      <LegalSection title="3. Eligibility and Exclusions">
        <p>
          To prevent abuse of our high-performance computing resources and AI generation infrastructure, the 14-day refund policy is subject to the following strict limitations:
        </p>
        <ul className="list-disc list-inside">
          <li>
            First-Time Purchases Only: The 14-day guarantee applies solely to your initial subscription or first purchase. It does not apply to subsequent subscription renewals, tier upgrades, or additional compute credits purchased after the initial term.
          </li>
          <li>
            Subscription Renewals: Failure to cancel an active subscription prior to your designated renewal date does not constitute grounds for a refund. It is the user&apos;s sole responsibility to manage their subscription status via the billing dashboard.
          </li>
          <li>
            Fair Usage and Abuse: Prometheus AI reserves the right to deny a refund request if we determine, at our sole discretion, that the user has excessively consumed system resources (e.g., mass-generating and exporting video renders) in a manner that constitutes exploitation of the 14-day window.
          </li>
          <li>
            Violation of Terms: No refunds will be issued to users whose accounts have been suspended or terminated due to a violation of our Terms of Service or Acceptable Use Policy.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Refund Request Procedure">
        <p>
          To initiate a refund under the 14-day guarantee, the request must be submitted formally before the expiration of the fourteen-day period.
        </p>
        <ol className="list-decimal list-inside">
          <li>
            Submission: You must submit a written refund request via email to our official support channel at{' '}
            <a
              href="mailto:support@prometheusstudio.tech"
              className="transition-colors hover:text-white"
            >
              support@prometheusstudio.tech
            </a>
            .
          </li>
          <li>
            Required Documentation: Your request must include the email address associated with your Prometheus AI account and the official Paddle Order ID/Receipt Number provided to you at the time of purchase.
          </li>
          <li>
            Authorization: Upon receiving and reviewing your request, the Prometheus team will evaluate your account for eligibility. If approved, we will authorize Paddle.com to process the financial reversal.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title="5. Processing Timelines">
        <p>
          Once a refund is authorized by Prometheus AI and initiated by Paddle.com, the funds will be returned to the original payment method utilized during the transaction. Please note that while the refund is processed immediately on our end, your financial institution or credit card issuer may require an additional 3 to 5 business days to post the credited funds to your account statement.
        </p>
      </LegalSection>

      <LegalSection title="6. Modifications to This Policy">
        <p>
          Prometheus AI reserves the right to amend, modify, or update this Refund Policy at any time to reflect changes in legal, regulatory, or operational requirements. Any modifications will become effective immediately upon being published to this page, as indicated by the &quot;Effective Date&quot; at the top of this document.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
