'use client';

import { PageTransition } from '@/components/PageTransition';

export default function PrivacyPage() {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20 prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p>
          This Privacy Policy describes how Trust Edge Bank, N.A.
          (&quot;Trust Edge,&quot; &quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;) collects, uses, discloses, and safeguards personal
          information in connection with our websites, mobile applications, and
          banking services (collectively, the &quot;Services&quot;). By using
          the Services, you agree to the practices described in this Policy.
        </p>

        <h2>1. Information we collect</h2>
        <p>
          We collect information in three primary ways: (1) information you
          provide directly to us; (2) information collected automatically; and
          (3) information received from third parties in accordance with
          applicable law.
        </p>
        <h3>1.1 Information you provide</h3>
        <ul>
          <li>
            Account and identity data, such as name, email address, phone
            number, date of birth, government identifiers, and mailing address.
          </li>
          <li>
            Financial data, such as account numbers, balances, transaction
            history, payment instrument details, and account preferences.
          </li>
          <li>
            Support communications and survey responses, including feedback,
            inquiries, and call/chat recordings where permitted by law.
          </li>
        </ul>
        <h3>1.2 Information collected automatically</h3>
        <ul>
          <li>
            Usage data, such as pages viewed, features used, and interactions
            with in-app elements.
          </li>
          <li>
            Device and log data, such as IP address, browser type, operating
            system, unique device identifiers, crash logs, and diagnostic data.
          </li>
          <li>
            Location data where enabled, used to support security, fraud
            prevention, and location-based features.
          </li>
        </ul>
        <h3>1.3 Information from third parties</h3>
        <ul>
          <li>
            Identity verification partners for KYC/AML checks and sanctions
            screening.
          </li>
          <li>
            Credit bureaus and financial institutions, in connection with loan
            applications and account linking.
          </li>
          <li>
            Service providers and analytics partners that help us maintain and
            improve the Services.
          </li>
        </ul>

        <h2>2. How we use information</h2>
        <ul>
          <li>
            Provide, operate, and improve the Services and customer support.
          </li>
          <li>
            Authenticate users and secure accounts; detect and prevent fraud.
          </li>
          <li>Process transactions and fulfill contractual obligations.</li>
          <li>Comply with legal, regulatory, and reporting obligations.</li>
          <li>Communicate about products, features, and important updates.</li>
          <li>Perform research and analytics to enhance user experience.</li>
        </ul>

        <h2>3. Legal bases for processing (EEA/UK)</h2>
        <p>
          Where applicable, we rely on the following legal bases: performance of
          a contract; compliance with legal obligations; legitimate interests
          (e.g., product security and improvement); and consent where required.
        </p>

        <h2>4. How we share information</h2>
        <ul>
          <li>
            With service providers under binding contracts who process data on
            our behalf (e.g., cloud hosting, analytics, customer support).
          </li>
          <li>
            With financial partners and payment networks to process
            transactions.
          </li>
          <li>
            With law enforcement, regulators, or other parties when required by
            law or to protect rights, safety, and security.
          </li>
          <li>
            In connection with a business transfer, merger, or acquisition.
          </li>
        </ul>
        <p>
          We do not sell your personal information. We do not permit service
          providers to use personal information for their own marketing.
        </p>

        <h2>5. Data retention</h2>
        <p>
          We retain personal information for as long as necessary to provide the
          Services, comply with legal obligations (including recordkeeping and
          audit requirements), resolve disputes, and enforce agreements.
        </p>

        <h2>6. Security</h2>
        <p>
          We implement organizational, technical, and physical safeguards to
          help protect personal information, including encryption, access
          controls, monitoring, and regular testing. No security method is
          infallible; users should also protect their credentials and devices.
        </p>

        <h2>7. Your choices and rights</h2>
        <ul>
          <li>Access, correct, or delete certain personal information.</li>
          <li>Opt out of marketing communications at any time.</li>
          <li>
            Depending on jurisdiction, exercise data subject rights (e.g.,
            portability, restriction, objection). Submit requests via our
            Contact page.
          </li>
        </ul>

        <h2>8. International data transfers</h2>
        <p>
          Where personal information is transferred across borders, we implement
          appropriate safeguards, such as Standard Contractual Clauses, and
          require recipients to protect information in accordance with
          applicable laws.
        </p>

        <h2>9. Children’s privacy</h2>
        <p>
          Our Services are not directed to children under 13 (or other age as
          defined by local law). We do not knowingly collect personal
          information from children without appropriate consent.
        </p>

        <h2>10. Changes to this Policy</h2>
        <p>
          We may update this Policy from time to time. Material changes will be
          notified via the Services or by other reasonable means. The “Last
          Updated” date reflects the most recent changes.
        </p>

        <h2>11. Contact us</h2>
        <p>
          Questions or requests related to this Policy can be submitted through
          our Contact page or by mail to Trust Edge Bank, N.A., Attn: Privacy, at
          our listed address.
        </p>

        <p className="text-sm text-muted-foreground">Last updated: Oct 2025</p>
      </div>
    </PageTransition>
  );
}
