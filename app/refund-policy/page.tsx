import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SiteHeader />

            {/* Content */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 md:p-12">
                    <div className="text-gray-900 dark:text-gray-100 [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:mb-2 [&_h1]:leading-tight [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-5 [&_ul]:pl-7 [&_ul]:list-disc [&_ul_ul]:mt-2 [&_ul_ul]:mb-2 [&_li]:mb-2 [&_li]:leading-relaxed [&_hr]:my-10 [&_hr]:border-gray-200 [&_hr]:dark:border-gray-700 [&_strong]:font-semibold [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-700">
                        <h1>Refund Policy</h1>
                        <p><strong>Last updated:</strong> 16 November 2025</p>

                        <p>This Refund Policy explains how refunds are handled for purchases of ThreeLanes Pro. ThreeLanes is operated by <strong>Two Bees Consulting Ltd</strong> (Company No. 07750344), 27 Mortimer Street, London, England, W1T 3BL. If you have any questions, email <strong>support@threelanes.app</strong>.</p>

                        <h2>1. 30-day money-back guarantee</h2>
                        <p>We offer an unconditional <strong>30-day refund on your first purchase of Pro</strong>. Renewals are excluded, except where required by law. Refunds are processed by <strong>Paddle</strong>, our merchant of record, to your original payment method where possible.</p>

                        <h2>2. Trials and coupons</h2>
                        <p>There are no trials or coupons at launch unless stated in the product. If a future promotion applies, the promotion terms will specify whether it is refundable.</p>

                        <h2>3. UK and EU cooling-off rights</h2>
                        <p>If you are a UK or EU consumer, you generally have a 14-day right to cancel. Because access to a digital service begins immediately, you may be asked at checkout to consent to immediate access. That consent may waive the 14-day cancellation right to the extent the service has been provided. This does not affect the 30-day money-back guarantee in section 1.</p>

                        <h2>4. What is and is not refundable</h2>
                        <ul>
                            <li><strong>Refundable:</strong> your <strong>first purchase</strong> of Pro within 30 days of the charge.</li>
                            <li><strong>Not refundable:</strong> <strong>renewals</strong> beyond the first purchase, except where required by law.</li>
                            <li><strong>Service discontinuation:</strong> if we permanently discontinue the service, we will provide notice and offer <strong>pro-rata refunds</strong> for any unused prepaid period. This does not apply when discontinuation is required by law or due to your breach of the Terms of Service.</li>
                        </ul>

                        <h2>5. How to request a refund</h2>
                        <p>Email <strong>support@threelanes.app</strong> and include:</p>
                        <ul>
                            <li>Your <strong>Paddle receipt or order ID</strong></li>
                            <li>The <strong>email</strong> used at checkout</li>
                            <li>A brief note that you are requesting a refund under the <strong>30-day guarantee</strong></li>
                        </ul>

                        <p>Eligible refunds are initiated promptly after approval. Paddle then returns funds to the original payment method. Bank or card processing times may vary.</p>

                        <h2>6. Currency and taxes</h2>
                        <p>Refunds are issued in the original transaction currency. Any exchange rate differences or bank fees are outside our control. Applicable taxes that were collected at checkout are refunded where the payment processor supports it.</p>

                        <h2>7. Chargebacks and disputes</h2>
                        <p>Please contact us first. Most issues are resolved quickly. If a chargeback is filed without contacting us, we may suspend the account during the investigation to prevent misuse.</p>

                        <h2>8. Changes to this policy</h2>
                        <p>We may update this Refund Policy from time to time. For material changes, we provide advance notice in-app or by email. Continued use after the effective date constitutes acceptance.</p>
                    </div>
                </div>
            </div>

            <SiteFooter />
        </div>
    )
}
