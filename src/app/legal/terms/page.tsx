'use client';

import { PageTransition } from '@/components/PageTransition';

export default function TermsPage() {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20 prose prose-neutral dark:prose-invert">
        <h1>Terms & Conditions</h1>
        <p>
          These Terms & Conditions (&quot;Terms&quot;) govern your access to and
          use of Trust Edge Bank, N.A. (&quot;Trust Edge&quot;) websites, mobile
          applications, and banking services (collectively, the
          &quot;Services&quot;). By accessing the Services, you agree to be
          bound by these Terms.
        </p>

        <h2>1. Eligibility and account registration</h2>
        <p>
          You represent that you are of legal age to form a binding contract and
          have not been barred from using the Services under applicable laws.
          You agree to provide accurate, current, and complete information
          during registration and to keep it updated.
        </p>

        <h2>2. Account security</h2>
        <p>
          You are responsible for maintaining the confidentiality of your
          credentials and restricting access to your devices. Notify us
          immediately of any suspected unauthorized activity. Trust Edge is not
          responsible for losses arising from compromised credentials where you
          failed to implement reasonable safeguards.
        </p>

        <h2>3. Use of the Services</h2>
        <p>
          You agree to use the Services only for lawful purposes and in
          accordance with these Terms and applicable law. You will not interfere
          with the normal operation of the Services, attempt unauthorized
          access, or use the Services in a manner that could harm Trust Edge or
          others.
        </p>

        <h2>4. Fees and rates</h2>
        <p>
          We disclose fees and rates associated with accounts and services in
          product documentation and disclosures. We may update fees with notice
          as required by law. You authorize applicable fees to be debited from
          your accounts.
        </p>

        <h2>5. Transactions and limitations</h2>
        <p>
          Certain transaction limits and holds may apply to protect account
          security and comply with regulations. We may decline or reverse any
          transaction that appears fraudulent, violates these Terms, or is not
          permitted by law.
        </p>

        <h2>6. Compliance and verification</h2>
        <p>
          You authorize Trust Edge to perform identity verification, sanctions
          screening, and ongoing monitoring as required by law. We may request
          additional documentation at any time.
        </p>

        <h2>7. Third-party services</h2>
        <p>
          The Services may link to third-party sites or integrate with
          third-party providers. Trust Edge does not control and is not responsible
          for third parties’ content, products, or services.
        </p>

        <h2>8. Intellectual property</h2>
        <p>
          The Services, including content, trademarks, and software, are owned
          by or licensed to Trust Edge and protected by law. You receive a limited,
          non-exclusive, non-transferable right to use the Services for their
          intended purpose.
        </p>

        <h2>9. Disclaimer of warranties</h2>
        <p>
          THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS
          AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
          INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. THIS DISCLAIMER MAY NOT APPLY IN SOME JURISDICTIONS.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRUST EDGE AND ITS AFFILIATES
          SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
          OR EXEMPLARY DAMAGES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
          DAMAGES.
        </p>

        <h2>11. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Trust Edge from claims, damages,
          and expenses arising from your use of the Services, violation of these
          Terms, or infringement of rights of a third party.
        </p>

        <h2>12. Suspension and termination</h2>
        <p>
          We may suspend or terminate access to the Services at any time for any
          reason, including suspected fraud, violation of these Terms, or
          regulatory requirements. You may close your account as permitted by
          applicable product terms.
        </p>

        <h2>13. Changes to the Services and Terms</h2>
        <p>
          We may modify the Services or these Terms with notice as required by
          law. Continued use after changes become effective constitutes
          acceptance of the revised Terms.
        </p>

        <h2>14. Governing law and disputes</h2>
        <p>
          These Terms are governed by the laws of the jurisdiction where your
          account is opened, without regard to conflicts of law. Disputes will
          be resolved pursuant to the dispute resolution provisions in your
          account agreements, which may include arbitration.
        </p>

        <h2>15. Contact</h2>
        <p>
          For questions about these Terms, contact us via the Contact page or by
          mail at the address listed in your account documentation.
        </p>

        <p className="text-sm text-muted-foreground">Effective: Oct 2025</p>
      </div>
    </PageTransition>
  );
}
