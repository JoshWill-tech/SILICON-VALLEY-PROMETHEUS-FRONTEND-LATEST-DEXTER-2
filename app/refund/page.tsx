import type { Metadata } from 'next'

import { LEGAL_LAST_UPDATED, LegalLayout, LegalSection } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Refund Policy | Prometheus',
  description: 'Read the Refund Policy for Prometheus.',
}

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      description="Standard 14-day money-back guarantee for Prometheus AI."
      currentPath="/refund"
    >
      <LegalSection title="14-Day Money-Back Guarantee">
        <p>
          We offer a 14-day money-back guarantee. If you are unsatisfied with our service for any reason, you may request a full refund within 14 days of your original purchase. To request a refund, simply email our support team at support@prometheusstudio.tech.
        </p>
      </LegalSection>

      <LegalSection title="Merchant of Record">
        <p>
          Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle handles all customer service inquiries and returns regarding billing and payments.
        </p>
      </LegalSection>
      
      <p className="text-sm text-neutral-500">
        Last updated: {LEGAL_LAST_UPDATED}
      </p>
    </LegalLayout>
  )
}
