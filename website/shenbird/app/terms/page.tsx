import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function TermsPage() {
  return (
    <div className="bg-brand-bg">
      <Header />
      <main className="min-h-screen bg-brand-bg py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl font-extrabold text-brand-text-primary mb-8">Terms of Service</h1>

          <div className="space-y-8 text-brand-text-secondary prose prose-lg max-w-none">
          <section>
            <p className="text-sm text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700">
              By accessing or using Shumbird (&ldquo;the Platform&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you disagree with any part of these terms, you must discontinue use of our Platform immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Platform Overview</h2>
            <p className="text-gray-700">
              Shumbird delivers a conversational commerce solution that connects businesses with AI-powered chat interfaces, enabling natural language product discovery and seamless transaction capabilities for merchants and their customers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Responsibilities</h2>
            <p className="text-gray-700 mb-3">By registering an account, you commit to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Supply truthful, complete, and up-to-date registration details</li>
              <li>Keep your account information current and accurate</li>
              <li>Safeguard your login credentials and prevent unauthorized access</li>
              <li>Take full responsibility for all activities conducted under your account</li>
              <li>Alert us immediately if you detect any security breach or unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Platform Usage Guidelines</h2>
            <p className="text-gray-700 mb-3">You must not:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Utilize the Platform for unlawful activities or in violation of any regulations</li>
              <li>Upload or transmit malicious code, viruses, or harmful software</li>
              <li>Attempt unauthorized access to our systems, networks, or databases</li>
              <li>Disrupt, compromise, or degrade Platform services or infrastructure</li>
              <li>Distribute unsolicited commercial messages or spam through our Platform</li>
              <li>Misrepresent your identity or falsely claim affiliation with any entity</li>
              <li>Scrape, harvest, or collect user data without explicit authorization</li>
              <li>Deploy automated tools or bots to interact with the Platform without our permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
            <p className="text-gray-700 mb-3">
              All Platform content, features, and functionality—including but not limited to software, design, text, graphics, and logos—are the exclusive property of Shumbird and protected under U.S. and international intellectual property laws.
            </p>
            <p className="text-gray-700">
              While you maintain ownership of content you upload, you grant Shumbird a perpetual, worldwide, royalty-free, non-exclusive license to use, process, reproduce, modify, and display such content strictly for Platform operation and service delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Subscription and Billing</h2>
            <p className="text-gray-700 mb-3">
              For paid services or features, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Settle all charges in accordance with our published pricing and billing schedule</li>
              <li>Maintain valid, current, and accurate payment information on file</li>
              <li>Update your billing details immediately upon any changes</li>
              <li>Understand that fees are generally non-refundable except where legally mandated</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Merchant Obligations</h2>
            <p className="text-gray-700 mb-3">
              As a vendor utilizing our Platform, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Ensure all product listings contain accurate, truthful information</li>
              <li>Fulfill all customer transactions completed through the Platform</li>
              <li>Operate in full compliance with applicable local, state, and federal laws</li>
              <li>Refrain from listing prohibited, restricted, or illegal merchandise</li>
              <li>Provide responsive customer service and manage order fulfillment professionally</li>
              <li>Possess and maintain all necessary business licenses, permits, and certifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability</h2>
            <p className="text-gray-700">
              While we endeavor to maintain consistent Platform availability, we make no guarantees regarding uptime, reliability, or error-free operation. Shumbird reserves the right to modify, pause, or discontinue any aspect of the Platform at any time without prior notice or liability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Liability Limitations</h2>
            <p className="text-gray-700">
              To the fullest extent permitted under applicable law, Shumbird disclaims liability for any indirect, incidental, special, consequential, or punitive damages, including but not limited to lost profits, revenue, data, goodwill, or business opportunities, whether arising directly or indirectly from your Platform use.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Your Indemnification</h2>
            <p className="text-gray-700">
              You agree to defend, indemnify, and hold Shumbird—including our officers, directors, employees, contractors, and agents—harmless from any claims, damages, liabilities, costs, and expenses (including reasonable legal fees) arising from your Platform use, content uploads, or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. External Integrations</h2>
            <p className="text-gray-700">
              The Platform may feature integrations with or links to external services. Shumbird bears no responsibility for third-party content, services, policies, or practices. Your interactions with external services are conducted at your own discretion and risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Account Termination</h2>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate your account and Platform access immediately, with or without cause or prior notice, including for Terms violations. Upon termination, your authorization to use the Platform ceases instantly, and we may delete your account data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Dispute Resolution Process</h2>
            <p className="text-gray-700">
              Any disputes, claims, or controversies arising from these Terms or Platform use shall be resolved through binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules, except where prohibited by law. Both parties waive the right to pursue class action proceedings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Applicable Law</h2>
            <p className="text-gray-700">
              These Terms are governed by and construed in accordance with the laws of the State of Delaware and the United States, excluding conflict of law principles. Any legal action must be brought exclusively in courts located in Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Terms Modifications</h2>
            <p className="text-gray-700">
              Shumbird may revise these Terms at any time. Material changes will be communicated through Platform notifications or email. The updated &ldquo;Last updated&rdquo; date will reflect all modifications. Your continued Platform use following changes constitutes binding acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Severability Clause</h2>
            <p className="text-gray-700">
              Should any provision of these Terms be deemed unenforceable or invalid by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary, while all remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Complete Agreement</h2>
            <p className="text-gray-700">
              These Terms represent the complete and exclusive agreement between you and Shumbird regarding Platform use, superseding all prior discussions, proposals, agreements, and understandings, whether written or oral.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Contact Information</h2>
            <p className="text-gray-700">
              For questions, concerns, or inquiries about these Terms of Service:
            </p>
            <p className="text-gray-700 mt-2">
              Email: <a href="mailto:contact@shumbird.com" className="text-blue-600 hover:text-blue-800">contact@shumbird.com</a>
            </p>
          </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
