'use client';

import { PageTransition } from '@/components/PageTransition';

export default function CookiePage() {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20 prose prose-neutral dark:prose-invert">
        <h1>Cookie Policy</h1>
        <p>
          This Cookie Policy explains how Trust Edge Bank, N.A. (&quot;Trust Edge&quot;)
          uses cookies and similar technologies (collectively,
          &quot;cookies&quot;) when you visit our websites or use our
          applications and Services.
        </p>

        <h2>1. What are cookies?</h2>
        <p>
          Cookies are small text files placed on your device that store
          information about your visit. They are widely used to make websites
          work or function more efficiently, as well as to provide reporting
          information.
        </p>

        <h2>2. Types of cookies we use</h2>
        <ul>
          <li>
            <strong>Essential cookies</strong>: Required for core functionality
            such as authentication, security, and accessibility. These cannot be
            switched off in our systems.
          </li>
          <li>
            <strong>Performance cookies</strong>: Help us measure and improve
            site performance by understanding how visitors use our Services.
          </li>
          <li>
            <strong>Functional cookies</strong>: Enable enhanced functionality
            and personalization, such as remembering preferences.
          </li>
          <li>
            <strong>Analytics cookies</strong>: Provide aggregated insights
            about usage patterns to improve products and user experience.
          </li>
          <li>
            <strong>Advertising cookies</strong>: May be used to deliver
            relevant ads and measure campaign performance where applicable.
          </li>
        </ul>

        <h2>3. How we use cookies</h2>
        <ul>
          <li>To keep you signed in and maintain session security.</li>
          <li>To remember preferences and personalize content.</li>
          <li>To analyze traffic and improve the Services.</li>
          <li>To support fraud detection and abuse prevention.</li>
        </ul>

        <h2>4. Third-party cookies</h2>
        <p>
          Some cookies are set by third parties that provide services on our
          behalf, such as analytics or embedded content. We do not control third
          parties’ cookie practices and recommend reviewing their policies.
        </p>

        <h2>5. Your choices</h2>
        <p>
          You can manage cookies through your browser or device settings, where
          you can block or delete cookies. If you disable certain cookies, parts
          of the Services may not function properly.
        </p>

        <h2>6. Do Not Track</h2>
        <p>
          Our Services do not currently respond to &quot;Do Not Track&quot;
          signals because there is no consistent industry standard.
        </p>

        <h2>7. Changes to this Policy</h2>
        <p>
          We may update this Cookie Policy from time to time. Changes will be
          posted here with an updated effective date.
        </p>

        <h2>8. Contact us</h2>
        <p>
          If you have questions about our use of cookies, contact us via the
          Contact page.
        </p>

        <p className="text-sm text-muted-foreground">Last updated: Oct 2025</p>
      </div>
    </PageTransition>
  );
}
