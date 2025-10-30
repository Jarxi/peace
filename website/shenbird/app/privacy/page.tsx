import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="bg-brand-bg">
      <Header />
      <main className="min-h-screen bg-brand-bg py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border p-8 sm:p-12">
            <h1 className="text-4xl font-extrabold text-brand-text-primary mb-8">Privacy Policy</h1>

            <div className="space-y-8 text-brand-text-secondary prose prose-lg max-w-none">
          <section>
            <p className="text-sm text-gray-600 mb-6">
              Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>

          <section>
            <p className="text-gray-700">
              Shumbird, Inc. (&ldquo;Shumbird,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our conversational commerce platform and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Personal Information You Provide</h3>
            <p className="text-gray-700 mb-3">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Contact Information:</strong> Name, email address, phone number, and company details</li>
              <li><strong>Account Information:</strong> Email, phone, profile photos, and account credentials</li>
              <li><strong>Business Information:</strong> Company name, business type, and product catalog data</li>
              <li><strong>Communications:</strong> Messages sent through our platform, email interactions, and support requests</li>
              <li><strong>Payment Information:</strong> Processed securely by third-party payment processors; we do not store full payment card details</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Information Collected Automatically</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Device & Location Information:</strong> IP addresses, browser type, operating system, and general location data</li>
              <li><strong>Usage Data:</strong> Pages viewed, features used, timestamps, search queries, and purchase history</li>
              <li><strong>Cookies & Tracking:</strong> We use cookies for functionality, analytics, and advertising purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use the collected information to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Provide, maintain, and improve our conversational commerce platform</li>
              <li>Process transactions and manage vendor accounts</li>
              <li>Personalize your experience and deliver relevant content</li>
              <li>Send service updates, technical notices, and support messages</li>
              <li>Conduct marketing and promotional activities (with your consent)</li>
              <li>Analyze usage patterns and improve product safety</li>
              <li>Detect, prevent, and address fraud, security issues, and technical problems</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Legal Basis for Processing (EEA/UK Users)</h2>
            <p className="text-gray-700 mb-3">If you are located in the European Economic Area or United Kingdom, we process your personal information based on:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Consent:</strong> You have given explicit consent for specific processing activities</li>
              <li><strong>Contractual Necessity:</strong> Processing is necessary to provide our services to you</li>
              <li><strong>Legal Compliance:</strong> We must process your data to comply with legal obligations</li>
              <li><strong>Legitimate Interests:</strong> We have legitimate interests in product development, service improvement, and ensuring platform safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-700 mb-3">We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Service Providers:</strong> Vendors who perform services on our behalf (hosting, analytics, customer support)</li>
              <li><strong>AI Service Providers:</strong> Partners that help power our conversational commerce features</li>
              <li><strong>Analytics Partners:</strong> Services like Google Analytics to understand usage patterns</li>
              <li><strong>Advertising Partners:</strong> Platforms that help us deliver relevant advertisements</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="text-gray-700 mt-3">
              We do not sell your personal information to third parties for their marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights and Choices</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">All Users</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Email Communications:</strong> Unsubscribe from marketing emails using the link in each message</li>
              <li><strong>Cookie Preferences:</strong> Adjust cookie settings through your browser preferences</li>
              <li><strong>Account Information:</strong> Update your account details through your profile settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">European Users (GDPR Rights)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
            </ul>
            <p className="text-gray-700 mt-3">
              To exercise these rights, contact us at <a href="mailto:privacy@shumbird.com" className="text-blue-600 hover:text-blue-800">privacy@shumbird.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Upon request, we will delete your information unless we are legally required to retain it. We maintain secure backups for disaster recovery and security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. International Data Transfers</h2>
            <p className="text-gray-700">
              Shumbird is based in the United States. If you are accessing our services from outside the U.S., your information will be transferred to and processed in the United States and other countries where our service providers operate. We use Standard Contractual Clauses approved by the European Commission to protect data transfers from the EEA and UK.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-3">We use the following types of cookies:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Strictly Necessary:</strong> Essential for the platform to function</li>
              <li><strong>Functional:</strong> Remember your preferences and settings</li>
              <li><strong>Analytical:</strong> Help us understand how users interact with our platform</li>
              <li><strong>Advertising:</strong> Deliver relevant advertisements based on your interests</li>
            </ul>
            <p className="text-gray-700 mt-3">
              You can manage cookie preferences through your browser settings. Note that disabling certain cookies may limit platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include encryption, access controls, and regular security assessments. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Services</h2>
            <p className="text-gray-700">
              Our platform may integrate with or link to third-party services (such as AI chat interfaces, payment processors, and analytics providers). We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing them with any information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-gray-700">
              Our services are not directed to children under 13 (or the applicable age in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes by posting the updated policy on this page and updating the &ldquo;Effective Date.&rdquo; Your continued use of our services after changes are posted constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 mb-3">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="text-gray-700 ml-4">
              <p><strong>Shumbird, Inc.</strong></p>
              <p>Email: <a href="mailto:privacy@shumbird.com" className="text-blue-600 hover:text-blue-800">privacy@shumbird.com</a></p>
              <p>Address: [Your Business Address]</p>
            </div>
          </section>
            </div>

            <div className="mt-8 text-center">
              <Link href="/" className="text-brand-primary hover:text-brand-primary-dark font-bold transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
