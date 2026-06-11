// These terms govern your use of the software provided by Prometheus AI.
import type { Metadata } from 'next'

import { LegalLayout, LegalSection, LegalSubsection } from '@/components/legal/LegalLayout'

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
        <p>{TERMS_OPENING}.</p>
        <p>
          By accessing prometheusstudio.tech, creating an account, starting a checkout, or using our
          services, you agree to these Terms. If you do not agree, do not use Prometheus Studio.
        </p>
      </LegalSection>

      <LegalSection title="2. Product and Deliverables">
        <p>
          Prometheus Studio is a professional video editing and production workspace for filmmakers and motion designers.
          Paid plans include AI-assisted transcription, captioning, motion templates, HD export, cloud project storage,
          and rendering tools. All AI features are assistive and require human creative direction.
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
            motion graphics, captions, timing notes, and other outputs generated from your Inputs.
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
          AI-assisted outputs may contain mistakes, artifacts, caption timing errors, similarity to other
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

      <LegalSection title="7A. Prohibited AI and Content Uses">
        <p>
          Prometheus Studio’s AI features are assistive only and do not autonomously generate cinematic video. The
          platform may not be used to create, generate, or distribute: (a) realistic or stylized human faces,
          likenesses, or avatars without explicit written consent; (b) deepfakes, face swaps, or voice impersonations;
          (c) non-consensual intimate imagery; (d) content that infringes third-party copyrights, trademarks, or trade
          secrets. Violations result in immediate termination and reporting to relevant authorities.
        </p>
      </LegalSection>

      <LegalSection title="8. Refunds, Cancellation, and Support">
        <p>
          We offer a 30-day money-back guarantee. If you are not satisfied with Prometheus Studio for any reason,
          contact support@prometheusstudio.tech within 30 days of purchase for a full refund. No questions asked.
          Refunds are processed by our Merchant of Record, Paddle, and returned to the original payment method. You may
          cancel your subscription at any time through Paddle’s billing portal or by contacting support.
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
          conflict of law principles. If you have questions, contact us using the details below.
        </p>
        <p>Email: support@prometheusstudio.tech</p>
        <p>Phone: +234 813 146 6596</p>
        <p>Business WhatsApp: +1 680 240 2281</p>
        <p>Official Registered Business Address: support@prometheusstudio.tech</p>
      </LegalSection>
    </LegalLayout>
  )
}
