import type { Metadata } from 'next'

import { LEGAL_LAST_UPDATED, LegalLayout, LegalSection, LegalSubsection } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Refund Policy | Prometheus',
  description: 'Read the Refund Policy for Prometheus.',
}

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      description="Because Prometheus provides access to intensive, high-cost Cloud GPU rendering and proprietary AI motion processing, our refund policy is strictly governed by compute usage."
      currentPath="/refund"
    >
      <LegalSection title="1. The 14-Day Conditional Guarantee">
        <p>
          If you purchase a Prometheus subscription (Core, Studio, or Cinema tier) and realize the
          platform does not fit your workflow, you may request a full refund within fourteen (14) days
          of your initial purchase, PROVIDED THAT:
        </p>
        <ul className="list-disc list-inside">
          <li>
            You have not exported/rendered more than five (5) minutes of final high-fidelity video
            outputs.
          </li>
          <li>You have not invited multiple external team members to utilize workspace resources.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Exhaustion of Compute">
        <p>
          Because GPU rendering incurs immediate, unrecoverable hard costs to our infrastructure, no
          refunds will be granted to accounts that have exceeded the 5-minute final render limit,
          regardless of whether the request falls within the 14-day window.
        </p>
      </LegalSection>

      <LegalSection title="3. Subscription Cancellations">
        <p>
          You may cancel your subscription at any time via your billing dashboard. Cancellation
          prevents future billing, but you will retain access to your Prometheus workspace and
          rendering capabilities until the end of your current paid billing cycle. We do not prorate
          or refund partial months of service.
        </p>
      </LegalSection>

      <LegalSection title="4. How to Request a Refund">
        <p>
          All refund requests must be routed through our Merchant of Record, Paddle, or by emailing us
          directly at [Your Support Email] with your workspace ID and receipt. Our team will review
          your GPU compute log to verify eligibility based on the terms above.
        </p>
        <p>Last updated: {LEGAL_LAST_UPDATED}</p>
      </LegalSection>
    </LegalLayout>
  )
}
