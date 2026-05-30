import type { Metadata } from 'next'

import { LEGAL_LAST_UPDATED, LegalLayout, LegalSection } from '@/components/legal/LegalLayout'

const SUPPORT_PHONE = '+234 813 146 6596'
const WHATSAPP_BUSINESS_PHONE = '+1 680 240 2281'

export const metadata: Metadata = {
  title: 'Refund Policy | Prometheus Studio',
  description: 'Prometheus Studio 30-day money-back guarantee for purchases processed by Paddle.',
}

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      description="Prometheus Studio — 30-Day Money-Back Guarantee"
      currentPath="/refund"
      lastUpdated={LEGAL_LAST_UPDATED}
    >
      <LegalSection title="1. Money-Back Guarantee">
        <p>
          We want you to be fully satisfied with Prometheus Studio. If you are not happy with your purchase for any
          reason, contact us at support@prometheusstudio.tech, {SUPPORT_PHONE}, or WhatsApp {WHATSAPP_BUSINESS_PHONE}
          within 30 days of your transaction for a full refund. No questions asked.
        </p>
      </LegalSection>

      <LegalSection title="2. How Refunds Are Processed">
        <p>
          Refunds are processed by our Merchant of Record, Paddle.com Market Ltd. Approved refunds are returned to your
          original payment method. Processing times depend on Paddle and your payment provider, typically 5–10 business
          days.
        </p>
      </LegalSection>

      <LegalSection title="3. Cancellations">
        <p>
          You may cancel your subscription at any time to stop future renewal charges. Cancellation does not
          automatically refund prior charges. To cancel, use the &quot;Manage subscription&quot; link in your Paddle
          receipt email, or contact support@prometheusstudio.tech.
        </p>
      </LegalSection>

      <LegalSection title="4. Statutory Rights">
        <p>
          Nothing in this policy limits your statutory consumer rights under the laws of your jurisdiction, including
          withdrawal rights where applicable.
        </p>
      </LegalSection>

      <LegalSection title="5. Contact">
        <p>
          For refund or cancellation requests: support@prometheusstudio.tech | {SUPPORT_PHONE} | WhatsApp{' '}
          {WHATSAPP_BUSINESS_PHONE}
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
