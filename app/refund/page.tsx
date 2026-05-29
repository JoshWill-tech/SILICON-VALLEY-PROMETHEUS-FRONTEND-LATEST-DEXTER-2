import type { Metadata } from 'next'

import { LEGAL_LAST_UPDATED, LegalLayout, LegalSection } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Refund Policy | Prometheus Studio',
  description: 'Refund Policy for Prometheus Studio purchases from Prometheus AI processed by Paddle.',
}

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      description="Prometheus AI offers a clear 14-day refund policy for Prometheus Studio purchases made through prometheusstudio.tech."
      currentPath="/refund"
      lastUpdated={LEGAL_LAST_UPDATED}
    >
      <LegalSection title="1. 14-Day Refund Policy">
        <p>
          Prometheus AI provides a fourteen (14) day refund policy for Prometheus Studio. If you request
          a refund within 14 calendar days of the original transaction date, we will approve a full refund
          for that transaction, except where there is evidence of fraud, refund abuse, chargeback abuse,
          or a transaction that has already been refunded.
        </p>
        <p>
          This policy applies to first-time subscription purchases and one-time digital purchases made
          through prometheusstudio.tech. Your statutory consumer rights are not limited by this policy.
        </p>
      </LegalSection>

      <LegalSection title="2. Renewals and Cancellations">
        <p>
          Subscription renewals are non-refundable after the 14-day window unless required by applicable
          law or caused by a billing error. You may cancel a subscription at any time to prevent future
          renewal charges. Cancellation does not remove access already paid for during the active billing
          period unless a refund is issued for that period.
        </p>
        <p>
          If you believe a renewal was charged in error, contact us at support@prometheusstudio.tech or
          use the Paddle support links in your receipt.
        </p>
      </LegalSection>

      <LegalSection title="3. Merchant of Record">
        <p>
          Payments, invoices, taxes, subscriptions, and approved refund processing are handled by
          Paddle.com Market Ltd or another Paddle group company acting as Merchant of Record and
          authorized reseller.
        </p>
        <p>
          Refunds approved under this policy are normally returned to the original payment method through
          Paddle. Processing times may depend on Paddle, your payment provider, and your bank.
        </p>
      </LegalSection>

      <LegalSection title="4. How to Request a Refund">
        <p>
          To request a refund, contact support@prometheusstudio.tech with your account email, Paddle
          receipt email, transaction date, and reason for the request. You may also use the &quot;Manage
          subscription&quot; or support link in your Paddle receipt.
        </p>
        <p>
          We review refund requests promptly and will provide instructions for any additional
          information needed to locate the transaction.
        </p>
      </LegalSection>

      <LegalSection title="5. Technical Issues">
        <p>
          If a technical issue prevents you from accessing the paid service or receiving the deliverables
          described for your purchase, contact support@prometheusstudio.tech. We will attempt to resolve
          the issue. If we cannot resolve it and your request is within the 14-day window, we will
          approve a refund under this policy.
        </p>
      </LegalSection>

      <LegalSection title="6. After a Refund">
        <p>
          If a refund is issued, access to the refunded subscription, add-on, export credit, or digital
          product may be cancelled or reduced. Refunded transactions may not be reused for future service
          access.
        </p>
        <p>
          Paddle&apos;s live Refund Policy is available at{' '}
          <a
            href="https://www.paddle.com/legal/refund-policy"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            https://www.paddle.com/legal/refund-policy
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
