import type { Metadata } from 'next'

import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Refund Policy | Prometheus',
  description: 'Refund Policy for Prometheus AI purchases processed by Paddle.',
}

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      description="Effective Date: May 27, 2026. Product: Prometheus AI / prometheusstudio.tech."
      currentPath="/refund"
      lastUpdated="May 27, 2026"
    >
      <LegalSection title="1. Introduction and Merchant of Record">
        <p>
          Prometheus AI uses Paddle.com Market Ltd (&quot;Paddle&quot;) as its Merchant of Record and authorized reseller for purchases made through prometheusstudio.tech.
        </p>
        <p>
          Paddle handles payment processing, billing, applicable taxes, transaction records, and refund administration for those transactions. By completing a purchase, you are purchasing through Paddle under Paddle&apos;s applicable buyer terms and policies.
        </p>
      </LegalSection>

      <LegalSection title="2. Paddle-Governed Refunds">
        <p>
          All refund requests for Paddle-processed purchases are governed by Paddle&apos;s Refund Policy and Paddle Buyer Terms. Prometheus AI does not separately approve, promise, or determine refunds.
        </p>
        <p>
          Unless required by applicable law, transactions are non-refundable and non-exchangeable. Paddle may issue refunds if you exercise an applicable statutory withdrawal or refund right, or on a discretionary basis under Paddle&apos;s policy.
        </p>
      </LegalSection>

      <LegalSection title="3. No Prometheus-Side Eligibility Rules">
        <p>
          Prometheus AI does not impose separate refund restrictions based on first purchase status, subscription renewals, tier upgrades, add-ons, compute credits, account usage, resource consumption, or account status.
        </p>
        <p>
          Paddle reviews refund requests according to its own policy, transaction records, applicable consumer protection laws, and any relevant factors Paddle is permitted to consider.
        </p>
      </LegalSection>

      <LegalSection title="4. Statutory Consumer Rights">
        <p>
          Your statutory consumer rights are not limited by this policy. Where local consumer protection law gives you additional or non-waivable withdrawal, cancellation, refund, or product-defect rights, those rights continue to apply.
        </p>
        <p>
          Paddle&apos;s current Refund Policy describes country-specific statutory rights, including a fourteen (14) day statutory withdrawal period for some consumers in the European Union, EEA, Switzerland, the United Kingdom, Turkey, and Israel; a seven (7) day unconditional cancellation period for some consumers in South Korea, Brazil, China, and Canada; and a five (5) day unconditional cancellation period for some consumers in Singapore.
        </p>
        <p>
          These statutory rules may include exceptions, waivers, or different conditions depending on your country and transaction type. Paddle&apos;s policy explains how to exercise those rights and how Paddle&apos;s transaction records are used to verify eligibility and timing without overriding statutory rights.
        </p>
      </LegalSection>

      <LegalSection title="5. Discretionary Refund Requests">
        <p>
          Paddle&apos;s current discretionary refund window is fourteen (14) days from the transaction date. Submitting a request within this period does not make a refund automatic.
        </p>
        <p>
          Paddle reviews discretionary refund requests on a case-by-case basis and may consider relevant factors including the nature of the product, the reason for the request, usage or consumption, and applicable contractual terms. Paddle may approve a full refund, approve a partial refund, or decline the request.
        </p>
        <p>
          Any discretionary refund granted by Paddle is voluntary and does not create an obligation for Paddle to provide future refunds, including for similar requests.
        </p>
      </LegalSection>

      <LegalSection title="6. How to Request a Refund">
        <p>
          To withdraw, cancel, or request a refund for a Paddle-processed purchase, contact Paddle directly using one of Paddle&apos;s supported channels:
        </p>
        <ul className="list-disc list-inside">
          <li>
            use the &quot;View receipt&quot; or &quot;Manage subscription&quot; link in your Paddle transaction confirmation email;
          </li>
          <li>
            submit a request through the support link provided in your receipt or account billing page; or
          </li>
          <li>
            visit{' '}
            <a
              href="https://paddle.net"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              paddle.net
            </a>{' '}
            and select the &quot;Request refund&quot; option.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Technical Issues or Product Defects">
        <p>
          If you experience persistent technical issues with Prometheus AI, or a material product defect prevents you from accessing the features or benefits described for your purchase, please contact us first at{' '}
          <a
            href="mailto:support@prometheusstudio.tech"
            className="transition-colors hover:text-white"
          >
            support@prometheusstudio.tech
          </a>{' '}
          so we can try to resolve the issue.
        </p>
        <p>
          If the issue cannot be resolved, contact Paddle through the refund channels above and provide details of the issue and any response received from Prometheus AI. Where there is evidence of a material technical or product defect, Paddle will handle the request in accordance with its policy and applicable consumer protection laws.
        </p>
      </LegalSection>

      <LegalSection title="8. Processing and Product Access">
        <p>
          If Paddle approves a refund, Paddle will process it using the same payment method where possible and within the timeframe stated in Paddle&apos;s Refund Policy.
        </p>
        <p>
          Refund eligibility for subscriptions, add-ons, and one-time transactions follows Paddle&apos;s policy unless local law provides otherwise. Access to the relevant Prometheus AI product, subscription, add-on, or one-time transaction may end if Paddle issues a refund for that transaction.
        </p>
      </LegalSection>

      <LegalSection title="9. Paddle Policy Updates">
        <p>
          Paddle may update its Refund Policy from time to time. Paddle&apos;s current policy states that the version in effect at the time of your transaction governs that transaction.
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
