import type { Metadata } from 'next'

import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout'

const LEGAL_ENTITY_DECLARATION =
  'This platform, Prometheus Studio, is owned and operated by the legal entity Prometheus AI.'

export const metadata: Metadata = {
  title: 'Privacy Policy | Prometheus Studio',
  description: 'Read the Privacy Policy for Prometheus Studio.',
}

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description={LEGAL_ENTITY_DECLARATION}
      currentPath="/privacy"
    >
      <LegalSection title="1. Information We Collect">
        <p>
          We collect information to provide and secure Prometheus Studio. This includes:
        </p>
        <ul className="list-disc list-inside">
          <li>Account Data: Name, email address, company name, and workspace credentials.</li>
          <li>
            Financial Data: Processed entirely by our Merchant of Record, Paddle. We do not store your
            raw credit card numbers on our servers.
          </li>
          <li>
            Media &amp; Usage Data: Raw video files, audio, uploaded branding assets, motion preferences,
            and interaction logs within the Prometheus UI.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <p>Your data is used strictly to operate the Prometheus infrastructure:</p>
        <ul className="list-disc list-inside">
          <li>To process, render, and export your cinematic content.</li>
          <li>To manage your premium workspace and team seats.</li>
          <li>
            To communicate system updates, pipeline architecture changes, or billing notices.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Data Storage and Cloud Processing">
        <p>
          To provide high-speed rendering, your data is processed using AWS (us-east-1), Google Cloud Platform,
          and Cloudflare. Media assets associated with active workspaces are retained to allow for fast
          revisions. If an account is terminated, user-uploaded media and cached renders are scheduled
          for automated deletion within 30 days.
        </p>
      </LegalSection>

      <LegalSection title="4. Sharing with Third Parties">
        <p>We do not sell your personal data or media. We only share data with:</p>
        <ul className="list-disc list-inside">
          <li>Paddle.com: For payment processing and subscription management.</li>
          <li>
            AWS, Google Cloud Platform, and Cloudflare: Strictly for the hosting and GPU rendering of your content.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Your Rights">
        <p>
          You have the right to access, correct, export, or delete your personal data and media assets
          at any time. To execute a complete workspace deletion, contact us at support@prometheusstudio.tech.
        </p>
      </LegalSection>

      <LegalSection title="6. AI Training Data Policy (The Enterprise Promise)">
        <p>
          We respect the proprietary nature of our clients&apos; content. Prometheus AI does not use your
          private, uploaded brand Inputs or generated Outputs to train our foundational AI models. Your
          content remains siloed within your workspace environment. This policy applies to all data
          types including raw footage, audio, text, branding assets, and rendered outputs.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies and Tracking Technologies">
        <p>
          Prometheus Studio uses essential cookies to maintain your session and workspace state. We do not use
          third-party advertising cookies or tracking pixels. Analytics data is collected anonymously
          to improve platform performance and is not linked to your personal identity.
        </p>
      </LegalSection>

      <LegalSection title="7A. Consent and GDPR">
        <p>
          For users in the EU/EEA and UK, we rely on essential cookies only and do not use tracking or advertising
          cookies. We process personal data under lawful bases of contract performance and legitimate interest. You
          have the right to access, rectify, erase, restrict processing, and port your data. To exercise these rights,
          contact support@prometheusstudio.tech.
        </p>
      </LegalSection>

      <LegalSection title="8. International Data Transfers">
        <p>
          Your data may be processed by cloud infrastructure providers in multiple jurisdictions to
          ensure optimal rendering performance. All transfers are protected by standard contractual
          clauses and enterprise-grade encryption both in transit and at rest.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or
          legal requirements. We will notify you of any material changes via email or through the
          Prometheus Studio workspace interface. Continued use of the service after changes constitutes
          acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact Us">
        <p>
          If you have any questions about this Privacy Policy or our data practices, please contact us
          at support@prometheusstudio.tech.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
