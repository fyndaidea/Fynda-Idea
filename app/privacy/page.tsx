import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import {
  PRODUCT_CONTACT_EMAIL,
  PRODUCT_DOMAIN,
  PRODUCT_NAME,
  PRODUCT_SITE_URL,
} from "@/lib/brand/product";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${PRODUCT_NAME} (${PRODUCT_DOMAIN}) collects, uses, and protects your information.`,
};

const mailClass =
  "font-medium text-[color:var(--foreground)] underline-offset-2 hover:underline";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`This Privacy Policy explains how ${PRODUCT_NAME} (“we”, “us”) collects, uses, and shares information when you use ${PRODUCT_SITE_URL} and related services.`}
    >
      <LegalSection title="Who we are">
        <p>
          {PRODUCT_NAME} is operated at{" "}
          <a href={PRODUCT_SITE_URL} className={mailClass}>
            {PRODUCT_DOMAIN}
          </a>
          . It is a curated collection of startup and product ideas. For privacy questions, contact{" "}
          <a href={`mailto:${PRODUCT_CONTACT_EMAIL}`} className={mailClass}>
            {PRODUCT_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>We may collect:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-medium text-[color:var(--foreground)]">Account information</strong> —
            email address, display name, password (stored by our auth provider), and profile details you choose
            to provide.
          </li>
          <li>
            <strong className="font-medium text-[color:var(--foreground)]">Content you submit</strong> —
            idea submissions, feedback, and similar inputs.
          </li>
          <li>
            <strong className="font-medium text-[color:var(--foreground)]">Usage data</strong> — pages viewed,
            searches, clicks, device/browser type, approximate location (from IP), and diagnostic logs needed to
            run and secure the service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use information">
        <p>We use information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide, maintain, and improve {PRODUCT_NAME}</li>
          <li>Create and authenticate accounts, and secure the service</li>
          <li>Review submissions, publish or reject ideas, and moderate content</li>
          <li>Send service messages (for example, password resets)</li>
          <li>Provide optional features such as favorites and dashboards</li>
          <li>Analyze usage in aggregate to improve search, curation, and reliability</li>
          <li>Comply with law and protect against abuse or fraud</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection title="Cookies and similar technologies">
        <p>
          We use cookies and similar technologies for sign-in sessions, preferences, and essential site
          operation. Some features will not work if cookies are disabled. You can control cookies in your
          browser settings.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          We use trusted processors to run {PRODUCT_NAME}, which may include hosting, authentication, databases,
          email delivery, and analytics. Those providers process data only as needed to provide their services to
          us and under their own privacy terms.
        </p>
      </LegalSection>

      <LegalSection title="Sharing">
        <p>We may share information:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>With service providers who help us operate {PRODUCT_NAME}</li>
          <li>When you choose to make content public (for example, a published idea or profile name)</li>
          <li>If required by law, legal process, or to protect rights, safety, and the integrity of the service</li>
          <li>In connection with a merger, acquisition, or sale of assets, with notice where required</li>
        </ul>
      </LegalSection>

      <LegalSection title="Data retention and security">
        <p>
          We retain account, submission, and related data for as long as your account is active or as needed to
          operate the service, resolve disputes, and meet legal obligations. We use reasonable technical and
          organizational safeguards, including encryption in transit. No method of transmission or storage is
          completely secure.
        </p>
      </LegalSection>

      <LegalSection title="Your rights and choices">
        <p>
          Depending on where you live, you may have rights to access, correct, delete, or export personal data,
          or to object to or restrict certain processing. You can update some account details in the product and
          contact us to make a privacy request. We will respond within a reasonable time.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          {PRODUCT_NAME} is not directed at children under 13 (or the minimum age required in your region). We
          do not knowingly collect personal information from children. If you believe a child has provided us
          data, contact us and we will take appropriate steps.
        </p>
      </LegalSection>

      <LegalSection title="International users">
        <p>
          If you access {PRODUCT_NAME} from outside the country where we operate, your information may be
          processed in other countries that may have different data-protection rules.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this Privacy Policy from time to time. The “Last updated” date at the top will change
          when we do. Continued use of {PRODUCT_SITE_URL} after changes means you accept the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this Privacy Policy? Email{" "}
          <a href={`mailto:${PRODUCT_CONTACT_EMAIL}`} className={mailClass}>
            {PRODUCT_CONTACT_EMAIL}
          </a>{" "}
          or visit{" "}
          <a href={PRODUCT_SITE_URL} className={mailClass}>
            {PRODUCT_DOMAIN}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
