// These terms govern your use of the software provided by Prometheus AI.
import type { Metadata } from 'next'

import { LEGAL_LAST_UPDATED, LegalLayout, LegalSection, LegalSubsection } from '@/components/legal/LegalLayout'

const LEGAL_ENTITY_DECLARATION =
  'This platform, Prometheus Studio, is owned and operated by the legal entity Prometheus AI.'

const TERMS_OPENING =
  'These terms govern your use of the software provided by Prometheus AI, including Prometheus Studio'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Prometheus Studio',
  description: 'Read the Terms & Conditions for Prometheus Studio.',
}

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      description={LEGAL_ENTITY_DECLARATION}
      currentPath="/terms"
    >
      <LegalSection title="1. Introduction and Agreement">
        <p>{LEGAL_ENTITY_DECLARATION}</p>
        <p>{TERMS_OPENING}.</p>
        <p>
          By accessing prometheusstudio.tech, creating an account, starting a checkout, or using our
          services, you agree to these Terms. If you do not agree, do not use Prometheus Studio.
        </p>
        <p>Last updated: {LEGAL_LAST_UPDATED}</p>
      </LegalSection>

      <LegalSection title="2. Product and Deliverables">
        <p>
          Prometheus Studio is an AI-powered cinematic video creation and motion graphics platform. Paid
          plans may include HD video exports, custom motion templates, AI transcriptions, captioning
          workflows, cloud-backed project storage, rendering workflows, and related production tools as
          described on our pricing page.
        </p>
      </LegalSection>

      <LegalSection title="3. Merchant of Record and Billing">
        <p>
          Purchases, subscriptions, taxes, invoices, payment methods, renewals, and payment support are
          processed by Paddle.com Market Ltd or another Paddle group company acting as Merchant of
          Record and authorized reseller. By completing a purchase, you also agree to Paddle&apos;s applicable
          checkout terms and buyer policies.
        </p>
        <p>
          Subscription fees, billing periods, usage limits, and plan features are shown before checkout.
          You are responsible for keeping your billing and account information accurate.
        </p>
      </LegalSection>

      <LegalSection title="4. Accounts and Access">
        <p>
          You are responsible for activity under your account and for maintaining the confidentiality of
          your login credentials. You must be at least 18 years old, or the age of majority in your
          jurisdiction, to purchase a subscription.
        </p>
        <p>
          We may suspend or terminate access if your account is used for fraud, abuse, security attacks,
          illegal activity, payment evasion, or activity that materially harms the service or other users.
        </p>
      </LegalSection>

      <LegalSection title="5. Intellectual Property and Content Ownership">
        <LegalSubsection title="Your Inputs">
          <p>
            You retain ownership of raw footage, audio, text, images, brand assets, and other materials
            you upload or submit to Prometheus Studio. You grant us a limited license to host, process,
            transmit, modify, render, and display those materials only as needed to provide and improve
            the service, secure the platform, and comply with law.
          </p>
        </LegalSubsection>
        <LegalSubsection title="Your Outputs">
          <p>
            Subject to your compliance with these Terms and applicable law, you own the finished videos,
            motion graphics, transcripts, captions, and other outputs generated from your Inputs.
          </p>
        </LegalSubsection>
        <LegalSubsection title="Our Infrastructure">
          <p>
            We retain all rights in Prometheus Studio, including software, workflows, models,
            interfaces, templates, rendering systems, documentation, branding, and platform technology.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="6. AI and Generated Content">
        <p>
          AI-assisted outputs may contain mistakes, artifacts, transcription errors, similarity to other
          content, or results that require human review. You are responsible for reviewing outputs before
          publishing, distributing, or relying on them.
        </p>
        <p>
          Prometheus Studio does not use your private uploaded Inputs or private generated Outputs to
          train foundational AI models unless you separately give us permission.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable Use">
        <p>You agree not to use Prometheus Studio to:</p>
        <ul className="list-disc list-inside">
          <li>violate laws, third-party rights, privacy rights, or intellectual property rights;</li>
          <li>
            create, upload, or distribute unlawful, harmful, abusive, exploitative, deceptive, or
            non-consensual content;
          </li>
          <li>upload content you do not have the right to use;</li>
          <li>
            reverse engineer, scrape, overload, bypass usage limits, or interfere with platform
            security, billing, rendering, or storage systems;
          </li>
          <li>resell access to the service unless we have agreed in writing.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Refunds, Cancellation, and Support">
        <p>
          Our refund terms are published at <a href="/refund" className="transition-colors hover:text-white">/refund</a>.
          You may cancel a subscription through the billing tools provided by Paddle or by contacting
          support. Cancellation stops future renewal charges but does not automatically refund past
          charges unless our Refund Policy or applicable law requires a refund.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimers and Limitation of Liability">
        <p>
          The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the fullest extent
          permitted by law, we disclaim warranties of merchantability, fitness for a particular purpose,
          non-infringement, uninterrupted availability, and error-free output.
        </p>
        <p>
          To the fullest extent permitted by law, Prometheus AI will not be liable
          for indirect, incidental, special, consequential, exemplary, or punitive damages, including lost
          profits, lost data, or business interruption.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing Law and Contact">
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to
          conflict of law principles. If you have questions, contact support@prometheusstudio.tech.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
