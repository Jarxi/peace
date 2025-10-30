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
          <h1 className="text-4xl font-extrabold text-brand-text-primary mb-8">Privacy Policy</h1>

          <div className="space-y-8 text-brand-text-secondary prose prose-lg max-w-none">
          <section>
            <p className="text-sm text-gray-600 mb-6">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>

          <section>
            <p className="text-gray-700">
              At Shumbird, Inc. (&ldquo;Shumbird,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), safeguarding your privacy is core to our mission. This policy outlines how we handle your personal data when you interact with our conversational commerce platform and associated services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Data We Gather</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Information You Share With Us</h3>
            <p className="text-gray-700 mb-3">When you use Shumbird, you may provide us with:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Identity Details:</strong> Your name, email, phone number, and business information</li>
              <li><strong>Account Credentials:</strong> Login details, authentication tokens, and profile settings</li>
              <li><strong>Business Data:</strong> Store name, product listings, inventory, and catalog information</li>
              <li><strong>Correspondence:</strong> Support tickets, chat messages, and email communications</li>
              <li><strong>Financial Data:</strong> Payment details handled by our certified payment partners; we never store complete card numbers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Data We Collect Automatically</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Technical Information:</strong> IP address, device type, browser version, and approximate location</li>
              <li><strong>Platform Activity:</strong> Feature usage, navigation patterns, session duration, and interaction logs</li>
              <li><strong>Tracking Tools:</strong> Cookies and similar technologies for analytics, personalization, and advertising</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Purpose of Data Processing</h2>
            <p className="text-gray-700 mb-3">Your information enables us to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Deliver and enhance our conversational commerce platform</li>
              <li>Facilitate transactions and manage merchant relationships</li>
              <li>Customize your platform experience based on preferences</li>
              <li>Communicate service announcements, updates, and support responses</li>
              <li>Execute marketing campaigns (only with your explicit permission)</li>
              <li>Monitor and improve platform performance and security</li>
              <li>Identify and prevent fraudulent activity or technical issues</li>
              <li>Meet legal requirements and enforce platform policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Legal Framework (EEA/UK)</h2>
            <p className="text-gray-700 mb-3">For users in the European Economic Area and United Kingdom, we process your data under these legal bases:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Your Consent:</strong> When you've provided clear permission for particular uses</li>
              <li><strong>Service Delivery:</strong> When processing is essential to fulfill our contractual obligations</li>
              <li><strong>Legal Requirements:</strong> When mandated by applicable laws and regulations</li>
              <li><strong>Business Interests:</strong> When we have valid reasons for processing that don't override your rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
            <p className="text-gray-700 mb-3">We share your data only with trusted parties:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Infrastructure Partners:</strong> Cloud hosting, database management, and technical support providers</li>
              <li><strong>AI Technology Partners:</strong> Services powering our conversational shopping experience</li>
              <li><strong>Analytics Platforms:</strong> Tools like Google Analytics for usage insights and optimization</li>
              <li><strong>Marketing Services:</strong> Advertising networks for targeted campaign delivery</li>
              <li><strong>Legal Authorities:</strong> When compelled by law enforcement, court orders, or legal processes</li>
              <li><strong>Corporate Transactions:</strong> During mergers, acquisitions, or asset transfers</li>
            </ul>
            <p className="text-gray-700 mt-3">
              We never sell your personal data to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Privacy Rights</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Universal Rights</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Marketing Opt-Out:</strong> Unsubscribe from promotional emails via the link provided</li>
              <li><strong>Cookie Control:</strong> Manage tracking preferences through browser settings</li>
              <li><strong>Profile Management:</strong> Access and modify your account information anytime</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">GDPR Rights (European Users)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Data Access:</strong> Obtain a copy of all personal data we hold about you</li>
              <li><strong>Rectification:</strong> Correct any inaccurate or outdated information</li>
              <li><strong>Erasure:</strong> Request permanent deletion of your personal data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Processing Limits:</strong> Restrict how we use your information in specific cases</li>
              <li><strong>Right to Object:</strong> Challenge processing based on legitimate interests</li>
            </ul>
            <p className="text-gray-700 mt-3">
              To exercise any rights, reach out to <a href="mailto:contact@shumbird.com" className="text-blue-600 hover:text-blue-800">contact@shumbird.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention Period</h2>
            <p className="text-gray-700">
              We keep your information only as long as needed to serve the purposes described here, or as required by law. When you request deletion, we'll remove your data promptly unless legal obligations require retention. Backup copies are maintained solely for disaster recovery and system integrity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cross-Border Data Movement</h2>
            <p className="text-gray-700">
              Shumbird operates from the United States. Users accessing our platform from other countries acknowledge that their data will be transferred to, stored in, and processed within the U.S. and other jurisdictions where our partners operate. For EEA and UK transfers, we implement Standard Contractual Clauses endorsed by the European Commission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookie Policy</h2>
            <p className="text-gray-700 mb-3">Our platform employs these cookie categories:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Essential Cookies:</strong> Required for core platform functionality</li>
              <li><strong>Preference Cookies:</strong> Store your settings and customizations</li>
              <li><strong>Analytics Cookies:</strong> Track usage patterns to improve our service</li>
              <li><strong>Marketing Cookies:</strong> Enable personalized advertising experiences</li>
            </ul>
            <p className="text-gray-700 mt-3">
              You control cookie settings via your browser. Blocking certain cookies may impact platform features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Security Measures</h2>
            <p className="text-gray-700">
              We deploy industry-standard security protocols to protect your data from unauthorized access, modification, disclosure, or destruction. Our safeguards include data encryption, access authentication, and regular security audits. While we implement robust protections, no internet transmission method is completely secure, so we cannot guarantee absolute safety.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. External Service Integration</h2>
            <p className="text-gray-700">
              Our platform connects with third-party services including AI providers, payment processors, and analytics tools. These external parties have their own privacy policies, and we're not liable for their practices. We recommend reviewing their policies before sharing information with them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Minors&apos; Data Protection</h2>
            <p className="text-gray-700">
              Shumbird is designed for business use and not intended for individuals under 13 years of age (or the minimum age in your region). We don't knowingly collect data from minors. If you suspect we've inadvertently gathered a child's information, contact us immediately for removal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Policy Updates</h2>
            <p className="text-gray-700">
              This Privacy Policy may evolve to reflect operational changes or legal developments. Significant modifications will be communicated through platform notifications and reflected in the &ldquo;Last Updated&rdquo; date above. Continued platform use after updates indicates your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Get in Touch</h2>
            <p className="text-gray-700 mb-3">
              Questions or concerns about this Privacy Policy? We're here to help:
            </p>
            <div className="text-gray-700 ml-4">
              <p><strong>Shumbird, Inc.</strong></p>
              <p>Email: <a href="mailto:contact@shumbird.com" className="text-blue-600 hover:text-blue-800">contact@shumbird.com</a></p>
            </div>
          </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
