import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import {
  PRODUCT_CONTACT_EMAIL,
  PRODUCT_DOMAIN,
  PRODUCT_NAME,
  PRODUCT_SITE_URL,
} from "@/lib/brand/product";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms and conditions for using ${PRODUCT_NAME} at ${PRODUCT_DOMAIN}.`,
};

const mailClass =
  "font-medium text-[color:var(--foreground)] underline-offset-2 hover:underline";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description={`These Terms of Service (“Terms”) govern your access to and use of ${PRODUCT_NAME} at ${PRODUCT_SITE_URL}. By using the site, you agree to these Terms and our Privacy Policy.`}
    >
      <LegalSection title="Agreement">
        <p>
          By accessing or using {PRODUCT_NAME}, you agree to these Terms. If you do not agree, do not use the
          service. If you use {PRODUCT_NAME} on behalf of an organization, you represent that you have authority
          to bind that organization.
        </p>
      </LegalSection>

      <LegalSection title="The service">
        <p>
          {PRODUCT_NAME} ({PRODUCT_DOMAIN}) is a curated collection of startup and product ideas. Listings,
          scores, descriptions, and related content reflect editorial judgment, public information, and user
          submissions. We may add, change, suspend, or remove features or ideas at any time.
        </p>
        <p>
          Ideas listed are informational and not investment, legal, or professional advice. Your use of any
          idea or external resource is at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="Accounts">
        <p>
          You are responsible for your account credentials and for activity under your account. Provide accurate
          information and notify us promptly if you suspect unauthorized access. We may suspend or terminate
          accounts that violate these Terms or pose a risk to the service or other users.
        </p>
      </LegalSection>

      <LegalSection title="Submissions">
        <p>
          If you submit an idea or related content, you confirm that the information is accurate to the best of
          your knowledge and that you have the right to share it. We may reject, edit, delay, or remove
          submissions that are misleading, infringing, unlawful, or otherwise inappropriate.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Misuse the site, attempt unauthorized access, or disrupt its operation</li>
          <li>Scrape or crawl the service at rates or in ways that harm performance or violate robots rules</li>
          <li>Upload malware, spam, or unlawful, harassing, or deceptive content</li>
          <li>Impersonate others or misrepresent your affiliation</li>
          <li>Use the service in violation of applicable law</li>
        </ul>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          {PRODUCT_NAME}, including its branding, design, and original content, is owned by us or our licensors.
          You may not copy, modify, or redistribute our branding or original site content without permission,
          except as allowed by law (for example, fair use).
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          {PRODUCT_NAME} is provided “as is” and “as available” without warranties of any kind, whether express
          or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do
          not guarantee that ideas, scores, or third-party links are complete, accurate, or current.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, {PRODUCT_NAME} and its operators are not liable for any
          indirect, incidental, special, consequential, or punitive damages, or for lost profits, data, or
          goodwill, arising from your use of the service. Our total liability for any claim relating to the
          service is limited to the greater of (a) the amounts you paid us for the service in the twelve months
          before the claim or (b) fifty U.S. dollars (US$50).
        </p>
      </LegalSection>

      <LegalSection title="Indemnity">
        <p>
          You agree to indemnify and hold harmless {PRODUCT_NAME} and its operators from claims arising out of
          your use of the service, your submissions, or your violation of these Terms or applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update these Terms from time to time. The “Last updated” date will change when we do. Continued
          use of {PRODUCT_SITE_URL} after changes constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms? Email{" "}
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
