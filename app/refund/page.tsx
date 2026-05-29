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
      description="Prometheus Studio purchases are processed by Paddle as Merchant of Record, and refunds are governed by Paddle's Refund Policy and applicable law."
      currentPath="/refund"
      lastUpdated={LEGAL_LAST_UPDATED}
    >
      <LegalSection title="1. Refund Eligibility and 14-Day Discretionary Window">
        <p>
          Refunds for Prometheus Studio purchases are governed by Paddle&apos;s Refund Policy and any
          mandatory consumer rights that apply. Unless applicable law requires otherwise, transactions
          are non-refundable and non-exchangeable.
        </p>
        <p>
          For jurisdictions without statutory withdrawal rights, Paddle may review discretionary refund
          requests submitted within 14 calendar days of the transaction date. Submitting a request within
          this period does not guarantee a refund. Paddle may approve a full refund, approve a partial
          refund, or decline the request.
        </p>
        <p>
          Refunds will not be issued where there is evidence of fraud, refund abuse, or other
          manipulative behaviour. Your statutory consumer rights are not limited by this policy.
        </p>
      </LegalSection>

      <LegalSection title="2. Statutory Rights, Renewals, and Cancellations">
        <p>
          Statutory withdrawal or cancellation rights may apply for consumers in the EU/EEA/UK/CH, TR,
          IL, KR, BR, CN, CA, and SG. Timing and eligibility vary by jurisdiction. For all other refunds,
          Paddle decides eligibility at its discretion unless mandatory local law requires otherwise.
        </p>
        <p>
          Withdrawal rights do not apply to downloaded, streamed, or otherwise used digital content where
          you gave express consent to waive those rights. Subscription renewals are non-refundable except
          where applicable law or Paddle&apos;s policy requires or permits a refund.
        </p>
        <p>
          You may cancel a subscription at any time to prevent future renewal charges. Add-ons linked to
          a main subscription expire when the main subscription ends, unless otherwise stated.
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
          Prometheus AI does not make final refund eligibility decisions for transactions processed by
          Paddle.
        </p>
      </LegalSection>

      <LegalSection title="4. How to Request a Refund">
        <p>
          To request a refund, use the &quot;Manage subscription&quot; or &quot;View receipt&quot; link in your
          Paddle transaction confirmation email, the support link in your Paddle receipt or billing page,
          or Paddle&apos;s buyer support site and select the refund request option.
        </p>
        <p>
          If you cannot locate your Paddle receipt or transaction details, contact
          support@prometheusstudio.tech as a routing contact with your account email, Paddle receipt
          email, transaction date, and reason for the request.
        </p>
      </LegalSection>

      <LegalSection title="5. Technical Issues">
        <p>
          If a technical issue prevents you from accessing the paid service or receiving the deliverables
          described for your purchase, contact support@prometheusstudio.tech first so Prometheus AI can
          attempt to resolve the issue. If the issue remains unresolved, escalate the request to Paddle
          support through your receipt, billing page, or Paddle&apos;s buyer support site.
        </p>
      </LegalSection>

      <LegalSection title="6. After a Refund">
        <p>
          If a refund is issued, access to the refunded subscription, add-on, export credit, or digital
          product will cease. Refunded transactions may not be reused for future service access.
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
          {' '}for reference. The Paddle policy version in effect at the time of your transaction
          governs that transaction, not the live linked version.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
