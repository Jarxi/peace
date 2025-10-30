import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function AEOPrivacyPolicy() {
  return (
    <div className="bg-brand-bg min-h-screen">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-brand-text-primary mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none text-brand-text-secondary">
            <p className="text-sm text-brand-text-secondary mb-8">
              <strong>Last Updated:</strong> October 8, 2025
            </p>
            
            <p className="mb-6">
              GPT-AEO &ldquo;the App&rdquo; provides SEO, AEO, Analytics Services (SEO Analysis, AEO Analysis, Analytics and Optimization) and Website Inspection (Website and Domain Overview) &ldquo;the Service&rdquo; to merchants who use Shopify to power their stores. This Privacy Policy describes how personal information is collected and used when you install or use the App in connection with your Shopify-supported store.
            </p>

            <h2 className="text-2xl font-bold text-brand-text-primary mt-8 mb-4">1 – Merchants Information the App Collects</h2>
            <p className="mb-6">
              When you install the App, we are automatically able to access the following personal information from your Shopify account once you have installed the App: Information about you and others who may access the App on behalf of your store, such as your name, location, email address, phone number, billing information. Additionally, we will collect Information, such as products, product listings and collections on your Online Store, script tags in your Online Store and theme.
            </p>

            <h2 className="text-2xl font-bold text-brand-text-primary mt-8 mb-4">2 – How Do We Use Merchants Information?</h2>
            <p className="mb-6">
              We use the personal information we collect from you in order to provide the Service and to operate the App. Additionally, we use this personal information to: Communicate with you; Optimize or improve the App; and Provide you with information relating to our services. We use the product and other information to provide merchants the services state above.
            </p>

            <h2 className="text-2xl font-bold text-brand-text-primary mt-8 mb-4">3 – For Merchants in Europe</h2>
            
            <h3 className="text-xl font-semibold text-brand-text-primary mt-6 mb-3">Your Rights</h3>
            <p className="mb-6">
              If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us through the contact information below.
            </p>
            <p className="mb-6">
              Additionally, if you are a European resident we note that we are processing your information in order to fulfill contracts we might have with you, or otherwise to pursue our legitimate business interests listed above. Additionally, please note that your information will be transferred outside of Europe, including to Canada and the United States
            </p>

            <h3 className="text-xl font-semibold text-brand-text-primary mt-6 mb-3">Data Retention</h3>
            <p className="mb-6">
              When you install the App, we will maintain your Information for our records unless and until you uninstall the App, a request will be sent to the App to delete this data.
            </p>

            <h3 className="text-xl font-semibold text-brand-text-primary mt-6 mb-3">Changes</h3>
            <p className="mb-6">
              We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.
            </p>

            <h3 className="text-xl font-semibold text-brand-text-primary mt-6 mb-3">Contact Us</h3>
            <p className="mb-6">
              For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at <a href="mailto:contact@shumbird.com" className="text-brand-primary hover:text-brand-primary-dark underline">contact@shumbird.com</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
