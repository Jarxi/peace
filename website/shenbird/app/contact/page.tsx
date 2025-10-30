import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function ContactPage() {
  return (
    <div className="bg-brand-bg">
      <Header />
      <main className="min-h-screen bg-brand-bg py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border p-8 sm:p-12">
            <h1 className="text-4xl font-extrabold text-brand-text-primary mb-4">Get in Touch</h1>
            <p className="text-lg text-brand-text-secondary mb-12">
              Have questions about Shumbird? We&apos;d love to hear from you. Reach out to us through any of the channels below.
            </p>

            <div className="space-y-8">
              {/* Email Section */}
              <div className="bg-brand-bg rounded-xl p-6 border border-brand-border">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-brand-text-primary mb-2">Email</h2>
                    <p className="text-brand-text-secondary mb-3">
                      Send us an email and we&apos;ll get back to you as soon as possible.
                    </p>
                    <a
                      href="mailto:contact@shumbird.com"
                      className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary-dark font-semibold transition-colors"
                    >
                      contact@shumbird.com
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Slack Section */}
              <div className="bg-brand-bg rounded-xl p-6 border border-brand-border">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-brand-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-brand-text-primary mb-2">Slack Community</h2>
                    <p className="text-brand-text-secondary mb-3">
                      Join our Slack workspace to connect with the team and other users in real-time.
                    </p>
                    <a
                      href="https://shumbird.slack.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary-dark font-semibold transition-colors"
                    >
                      Join Community
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Support Topics */}
              <div className="mt-12 pt-8 border-t border-brand-border">
                <h3 className="text-lg font-bold text-brand-text-primary mb-4">What can we help you with?</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="text-brand-text-secondary">
                    <h4 className="font-semibold text-brand-text-primary mb-2">General Inquiries</h4>
                    <p className="text-sm">Questions about our platform, pricing, or how Shumbird works</p>
                  </div>
                  <div className="text-brand-text-secondary">
                    <h4 className="font-semibold text-brand-text-primary mb-2">Technical Support</h4>
                    <p className="text-sm">Help with integration, API questions, or troubleshooting</p>
                  </div>
                  <div className="text-brand-text-secondary">
                    <h4 className="font-semibold text-brand-text-primary mb-2">Partnership Opportunities</h4>
                    <p className="text-sm">Interested in partnering or collaborating with us</p>
                  </div>
                  <div className="text-brand-text-secondary">
                    <h4 className="font-semibold text-brand-text-primary mb-2">Media & Press</h4>
                    <p className="text-sm">Press inquiries, interviews, or media opportunities</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
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
