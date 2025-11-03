import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Content */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 md:p-12">
          <div className="text-gray-900 dark:text-gray-100 [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:mb-2 [&_h1]:leading-tight [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-5 [&_ul]:pl-7 [&_ul]:list-disc [&_ul_ul]:mt-2 [&_ul_ul]:mb-2 [&_li]:mb-2 [&_li]:leading-relaxed [&_hr]:my-10 [&_hr]:border-gray-200 [&_hr]:dark:border-gray-700 [&_strong]:font-semibold [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-700">
          <h1>ThreeLanes — Privacy Policy</h1>
        <p><strong>Last updated:</strong> November 03, 2025</p>

        <p>This Privacy Policy explains how <strong>Two Bees Consulting Ltd</strong> (Company No. 07750344), trading as <strong>ThreeLanes</strong> (&quot;<strong>ThreeLanes</strong>,&quot; &quot;<strong>we</strong>,&quot; &quot;<strong>us</strong>,&quot; or &quot;<strong>our</strong>&quot;), collects, uses, shares, and protects your information when you use our kanban web application and related services (the &quot;<strong>Service</strong>&quot;).</p>

        <p>We act as the <strong>data controller</strong> for personal data we process about you. For billing and payments, <strong>Paddle</strong> acts as our <strong>merchant of record</strong> and processes your payment data as an independent controller (and/or processor, as applicable) under its own terms and privacy notices.</p>

        <p>If you have questions, contact <strong>support@threelanes.app</strong>.</p>

        <hr />

        <h2>1. Scope</h2>
        <p>This Policy applies to the Service available worldwide and to the websites and applications we operate. It does not cover third‑party services that have their own privacy policies.</p>

        <hr />

        <h2>2. What we collect</h2>
        <h3>2.1 Account data</h3>
        <ul>
          <li>Email address, password (hashed) if you sign up with email/password.</li>
          <li>If you sign up with OAuth, we receive limited profile data from your provider (e.g., email) to create your account.</li>
          <li>Optional profile details (if added in future).</li>
        </ul>

        <h3>2.2 Product data</h3>
        <ul>
          <li>Boards, tasks, and categories you create.</li>
          <li>No file attachments, collaborators, or comments at launch.</li>
          <li>Administrative and security logs (e.g., timestamps, action types). Authorised staff may access content in a <strong>read‑only</strong> manner for support and safety.</li>
        </ul>

        <h3>2.3 Technical data</h3>
        <ul>
          <li>Device and browser information, IP address, and usage events.</li>
          <li>Cookies and similar technologies (see Section 6).</li>
          <li>Diagnostics and error logs.</li>
        </ul>

        <h3>2.4 Marketing &amp; communications</h3>
        <ul>
          <li>Your communication preferences and marketing opt‑ins.</li>
          <li>Campaign or referral information if you follow tracked links.</li>
        </ul>

        <h3>2.5 Support</h3>
        <ul>
          <li>Messages you send to support and any attachments.</li>
        </ul>

        <p>We may combine information described above for the purposes in Section 3.</p>

        <hr />

        <h2>3. Why we process your data (legal bases)</h2>
        <p>We process personal data under the UK GDPR on the following bases:</p>

        <ul>
          <li><strong>Contract</strong>: To create and administer your account; provide core features, backups, and support; handle billing via Paddle.</li>
          <li><strong>Legitimate interests</strong>: To secure and improve the Service; prevent fraud and abuse; measure and analyse usage; troubleshoot; and communicate important service updates. We balance these interests against your rights.</li>
          <li><strong>Consent</strong>: For non‑essential cookies/SDKs (e.g., analytics) and for marketing emails. You can withdraw consent at any time.</li>
        </ul>

        <hr />

        <h2>4. How we use your data</h2>
        <ul>
          <li>Provide, operate, and maintain the Service.</li>
          <li>Personalise and improve features.</li>
          <li>Communicate with you about changes, incidents, and updates.</li>
          <li>Provide support and diagnose issues (including limited, read‑only admin access to your content when needed).</li>
          <li>Process payments and manage subscriptions via Paddle.</li>
          <li>Enforce our Terms and protect the Service and users.</li>
        </ul>

        <p>We do <strong>not</strong> use your content to train AI models unless you explicitly opt in.</p>

        <hr />

        <h2>5. Sharing your data</h2>
        <p>We share personal data with the following categories of recipients, strictly as needed:</p>

        <ul>
          <li><strong>Service providers / subprocessors</strong>:
            <ul>
              <li><strong>Vercel</strong> (hosting/CDN)</li>
              <li><strong>Supabase</strong> (database &amp; authentication; London region)</li>
              <li><strong>Paddle</strong> (merchant of record for billing &amp; tax)</li>
              <li><strong>Resend</strong> (transactional email)</li>
              <li><strong>Cloudflare</strong> (network/CDN security)</li>
              <li><strong>Cookiehub</strong> (cookie consent management)</li>
              <li><strong>Seline Analytics</strong> (usage analytics)</li>
            </ul>
          </li>
          <li><strong>Professional and legal advisers</strong> where necessary.</li>
          <li><strong>Authorities</strong> when required by law or to protect rights and safety.</li>
          <li><strong>Business transfers</strong>: in connection with a merger, acquisition, or sale of assets.</li>
        </ul>

        <p>We do not sell personal data.</p>

        <hr />

        <h2>6. Cookies &amp; tracking</h2>
        <p>We use cookies and similar technologies to run the Service and, with your consent, for analytics.</p>

        <ul>
          <li><strong>Strictly necessary cookies</strong>: e.g., authentication/session, security, load‑balancing.</li>
          <li><strong>Analytics cookies/SDKs</strong>: <strong>Seline Analytics</strong> helps us understand aggregate usage.</li>
          <li><strong>Consent management</strong>: <strong>Cookiehub</strong> provides the consent banner and stores your preferences.</li>
        </ul>

        <p>You can manage consent choices at any time via the cookie banner/settings. Refusing non‑essential cookies may limit analytics functionality but not core features.</p>

        <hr />

        <h2>7. International transfers</h2>
        <p>Some providers may process data outside the UK/EEA. Where they do, we rely on lawful transfer mechanisms, such as the <strong>UK IDTA</strong> and/or <strong>EU Standard Contractual Clauses</strong>, plus supplementary measures as needed.</p>

        <hr />

        <h2>8. Retention</h2>
        <ul>
          <li><strong>Account data</strong>: for the life of your account and <strong>90 days</strong> thereafter.</li>
          <li><strong>Logs/telemetry</strong>: <strong>12 months</strong>.</li>
          <li><strong>Backups</strong>: <strong>90‑day rolling</strong>.</li>
          <li><strong>Support tickets</strong>: <strong>24 months</strong>.</li>
          <li><strong>Billing records</strong>: <strong>7 years</strong> (for tax).</li>
        </ul>

        <p>If you delete your account, your primary data is deleted within <strong>30 days</strong> and backups within <strong>90 days</strong>, subject to legal retention obligations.</p>

        <hr />

        <h2>9. Security</h2>
        <p>We take appropriate technical and organisational measures, including:</p>
        <ul>
          <li>TLS in transit; encryption at rest (Supabase).</li>
          <li><strong>Row‑Level Security (RLS)</strong> to enforce per‑user data access.</li>
          <li>Hashed passwords (managed by Supabase/Auth).</li>
          <li>Least‑privileged access for staff; secrets management through our hosting.</li>
          <li>Audit and access logs for administrative actions.</li>
          <li>Regular backups and timely security patching.</li>
        </ul>

        <p>No system is 100% secure, but we work to protect your information and notify you of significant incidents as required by law.</p>

        <hr />

        <h2>10. Your rights</h2>
        <p>Subject to legal limits, you have rights to <strong>access</strong>, <strong>rectify</strong>, <strong>erase</strong>, <strong>restrict</strong>, <strong>object</strong>, and <strong>data portability</strong>. You can also withdraw consent for marketing or analytics at any time.</p>

        <p>To exercise rights, contact <strong>support@threelanes.app</strong>. We will respond within <strong>30 days</strong>. You also have the right to complain to the <strong>UK Information Commissioner&apos;s Office (ICO)</strong> or your local authority.</p>

        <hr />

        <h2>11. Children</h2>
        <p>The Service is <strong>not directed to children under 16</strong> and we do not knowingly collect personal data from them.</p>

        <hr />

        <h2>12. Third‑party sites</h2>
        <p>Our Service may link to third‑party websites or services we do not control. Their privacy practices are governed by their own policies.</p>

        <hr />

        <h2>13. Changes to this Policy</h2>
        <p>We may update this Policy from time to time. For material changes, we will provide <strong>30 days&apos; notice</strong> (e.g., in‑app or by email). Continued use after the effective date constitutes acceptance.</p>

        <hr />

        <h2>14. Contact</h2>
        <p><strong>Data controller:</strong> Two Bees Consulting Ltd (trading as ThreeLanes)<br />
        27 Mortimer Street, London, England, W1T 3BL<br />
        <strong>Email:</strong> support@threelanes.app</p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
