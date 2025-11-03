import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Content */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 md:p-12">
          <div className="text-gray-900 dark:text-gray-100 [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:mb-2 [&_h1]:leading-tight [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-5 [&_ul]:pl-7 [&_ul]:list-disc [&_ul_ul]:mt-2 [&_ul_ul]:mb-2 [&_li]:mb-2 [&_li]:leading-relaxed [&_hr]:my-10 [&_hr]:border-gray-200 [&_hr]:dark:border-gray-700 [&_strong]:font-semibold [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-700">
          <h1>ThreeLanes — Terms of Service</h1>
        <p><strong>Last updated:</strong> November 03, 2025</p>

        <p>These Terms of Service (&quot;<strong>Terms</strong>&quot;) are a legally binding agreement between you and <strong>Two Bees Consulting Ltd</strong> (Company No. 07750344), trading as <strong>ThreeLanes</strong>, with registered address at <strong>27 Mortimer Street, London, England, W1T 3BL</strong> (&quot;<strong>ThreeLanes</strong>,&quot; &quot;<strong>we</strong>,&quot; &quot;<strong>us</strong>,&quot; or &quot;<strong>our</strong>&quot;). By creating an account, accessing, or using ThreeLanes (the &quot;<strong>Service</strong>&quot;), you agree to these Terms.</p>

        <p>If you do not agree, do not use the Service.</p>

        <hr />

        <h2>1. Who we are</h2>
        <p>ThreeLanes is an online kanban board web application with a simple three‑lane workflow (To‑Do, Doing, Done). The Service is provided to users worldwide from England.</p>

        <p><strong>Contact:</strong> support@threelanes.app</p>

        <p><strong>Merchant of Record:</strong> Payments are handled by <strong>Paddle</strong> (our merchant of record). Paddle may appear on your statements and will process taxes, invoices, and refunds in accordance with applicable consumer laws and these Terms.</p>

        <hr />

        <h2>2. Eligibility &amp; accounts</h2>
        <ul>
          <li><strong>Minimum age.</strong> The Service is not directed to children under 16. You must be at least 16 to use the Service.</li>
          <li><strong>Account.</strong> One individual user per account. You are responsible for keeping your login credentials confidential and for all activities under your account.</li>
          <li><strong>OAuth &amp; email signup.</strong> You may sign up using OAuth (e.g., a third‑party identity provider) or email/password. If you use OAuth, we receive limited profile information (e.g., email) from your provider to create your account.</li>
        </ul>

        <hr />

        <h2>3. Plans, limits &amp; definitions</h2>
        <p>We currently offer the following plans and limits. We may update or add plans from time to time (see Section 10).</p>

        <h3>3.1 Free</h3>
        <ul>
          <li><strong>Boards:</strong> 1 board per account</li>
          <li><strong>Active tasks:</strong> up to <strong>100 active tasks per board</strong></li>
          <li><strong>Archived tasks:</strong> up to <strong>1,000 archived tasks in total per account</strong></li>
          <li><strong>Archive retention:</strong> <strong>90 days</strong></li>
          <li><strong>Features:</strong> core features; email notifications</li>
        </ul>

        <h3>3.2 Pro</h3>
        <ul>
          <li><strong>Boards:</strong> <strong>Unlimited</strong> boards (currently <strong>capped at 500 boards per account</strong>)</li>
          <li><strong>Active tasks:</strong> up to <strong>100 active tasks per board</strong></li>
          <li><strong>Archived tasks:</strong> up to <strong>200,000 archived tasks in total per account</strong></li>
          <li><strong>Archive retention:</strong> <strong>unlimited</strong></li>
          <li><strong>Features:</strong> advanced features. (Priority support and enhanced security are <strong>not included at launch</strong>.)</li>
        </ul>

        <h3>3.3 Definitions</h3>
        <ul>
          <li><strong>Active tasks</strong> are tasks that exist in the To‑Do, Doing, or Done lanes.</li>
          <li><strong>Archived tasks</strong> are tasks you move to Archive. Archived tasks do not count toward the active task limit.</li>
        </ul>

        <p>We may implement reasonable <strong>technical or rate limits</strong> to protect the Service.</p>

        <hr />

        <h2>4. Pricing, billing &amp; taxes</h2>
        <ul>
          <li><strong>Prices.</strong> Pro is <strong>$6/month</strong> (USD) or <strong>£5/month</strong> (GBP), depending on your billing location. Annual plans are <strong>$60/year</strong> or <strong>£50/year</strong>.</li>
          <li><strong>Billing.</strong> Paddle bills you on our behalf and may charge applicable taxes (e.g., VAT) based on your location. You authorise Paddle to store and charge your payment method for recurring fees until you cancel.</li>
          <li><strong>Receipts &amp; invoices</strong> are provided by Paddle.</li>
        </ul>

        <hr />

        <h2>5. Trials, refunds &amp; cooling‑off</h2>
        <ul>
          <li><strong>Trials and coupons.</strong> None at launch (unless we state otherwise in‑app).</li>
          <li><strong>30‑day money‑back guarantee.</strong> We offer an unconditional <strong>30‑day refund on your first purchase</strong> of Pro. Renewals are excluded except where required by law.</li>
          <li><strong>UK/EU cooling‑off.</strong> If you are a consumer in the UK/EU, you generally have a 14‑day right to cancel. Because access to a digital service begins immediately, you may be asked at checkout to <strong>consent to immediate access and acknowledge that you may lose the 14‑day cancellation right</strong> to the extent the service is provided. This does not affect the 30‑day money‑back guarantee above.</li>
        </ul>

        <p>Refunds are processed by Paddle to your original payment method where possible.</p>

        <hr />

        <h2>6. Upgrades, downgrades &amp; plan changes</h2>
        <ul>
          <li><strong>Upgrades</strong> take effect immediately and may start a new billing cycle or be prorated by Paddle.</li>
          <li><strong>Downgrades (Pro → Free).</strong> Your account must comply with Free limits. Content beyond Free limits may be <strong>locked, hidden, or read‑only</strong> until you reduce usage. Where feasible, we provide a <strong>14‑day courtesy period</strong> before enforcement. We do not delete content solely due to a downgrade, but we may restrict access until limits are met.</li>
          <li><strong>Deletion.</strong> You can download your data (CSV/JSON on request) and delete your account at any time (see Privacy Policy for timelines).</li>
        </ul>

        <hr />

        <h2>7. Acceptable use</h2>
        <p>You agree not to misuse the Service, including by: violating laws or third‑party rights; uploading illegal, harmful, or abusive content; harassing others; introducing malware; scraping or attempting to bulk‑export beyond provided tools; interfering with or overloading the Service; bypassing security; or reverse‑engineering the Service except to the extent permitted by law.</p>

        <p>We may suspend or terminate accounts that breach these Terms or create risk to the Service or others.</p>

        <hr />

        <h2>8. Your content &amp; our licence</h2>
        <ul>
          <li><strong>Ownership.</strong> You retain ownership of the boards and tasks you create.</li>
          <li><strong>Licence to us.</strong> You grant us a worldwide, non‑exclusive licence to host, store, display, and process your content <strong>solely</strong> to provide and improve the Service.</li>
          <li><strong>AI training.</strong> We <strong>do not</strong> use your content to train models unless you expressly opt in.</li>
          <li><strong>Administrative access.</strong> Authorised staff may access your content in a read‑only manner for support, safety, debugging, and compliance.</li>
        </ul>

        <hr />

        <h2>9. Third‑party services</h2>
        <p>The Service uses third‑party providers (e.g., Paddle for billing). Your use of such providers may be subject to their terms and policies. We are not responsible for third‑party services we do not control.</p>

        <hr />

        <h2>10. Changes to plans, features &amp; pricing</h2>
        <p>We may update features, limits, and prices from time to time. <strong>We will provide at least 30 days&apos; notice</strong> before a price increase or a material change that significantly reduces functionality of your current plan. Changes take effect on renewal.</p>

        <p><strong>Grandfathering.</strong> Where feasible, we may grandfather existing Pro subscribers at their current price and/or features for a period (e.g., at least 12 months) provided they maintain a continuous subscription. If we cannot reasonably grandfather, we will still provide notice and the option to cancel before renewal.</p>

        <hr />

        <h2>11. Discontinuation</h2>
        <p>We may discontinue the Service or any feature. If we permanently discontinue the Service, we will provide <strong>at least 30 days&apos; notice</strong> where feasible and <strong>offer data export</strong>. For prepaid subscriptions, we will issue a <strong>pro‑rata refund</strong> for the unused portion, except where discontinuation is required by law or due to your breach.</p>

        <hr />

        <h2>12. Warranties, disclaimers &amp; limitation of liability</h2>
        <ul>
          <li>The Service is provided <strong>&quot;as is&quot; and &quot;as available.&quot;</strong> We do not make warranties of fitness for a particular purpose, non‑infringement, or uninterrupted availability.</li>
          <li>To the maximum extent permitted by law, <strong>our total liability</strong> for all claims relating to the Service is limited to <strong>the amount you paid to us for the Service in the 12 months before the event giving rise to liability</strong> (or £0 if you use the Free plan).</li>
          <li>We do not exclude liability for fraud, fraudulent misrepresentation, or liability that cannot be excluded under law.</li>
        </ul>

        <p>Some jurisdictions do not allow certain limitations; in that case, those limitations apply only to the extent permitted.</p>

        <hr />

        <h2>13. Indemnity</h2>
        <p>You will indemnify and hold us harmless from claims arising from (a) your content; (b) your breach of these Terms; or (c) your unlawful use of the Service.</p>

        <hr />

        <h2>14. Governing law &amp; venue</h2>
        <p>These Terms and any non‑contractual obligations arising out of or in connection with them are governed by the laws of <strong>England and Wales</strong>. The courts of <strong>England and Wales</strong> shall have exclusive jurisdiction.</p>

        <hr />

        <h2>15. Changes to these Terms</h2>
        <p>We may update these Terms from time to time. For material changes, we will provide <strong>30 days&apos; advance notice</strong> (e.g., in‑app or by email). Continued use after the effective date constitutes acceptance.</p>

        <hr />

        <h2>16. Contact</h2>
        <p><strong>Two Bees Consulting Ltd (trading as ThreeLanes)</strong><br />
          27 Mortimer Street, London, England, W1T 3BL<br />
          <strong>Email:</strong> support@threelanes.app</p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
