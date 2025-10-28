import React from 'react';

const ProblemSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-32 bg-gradient-to-b from-white via-brand-peach/10 to-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#E93D0A08_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-block px-4 py-2 bg-red-50 border border-red-200 rounded-full mb-6">
            <span className="text-sm font-bold text-red-600 uppercase tracking-wider">The Problem</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-text-primary leading-tight mb-6">
            Billions in revenue.<br />
            <span className="text-brand-primary">Locked behind closed platforms.</span>
          </h2>
          <p className="text-xl sm:text-2xl text-brand-text-secondary leading-relaxed max-w-3xl mx-auto">
            Merchants want to tap into massive consumer traffic flowing through AI chat platforms—but there&apos;s no direct, standardized way to reach these users.
          </p>
        </div>

        {/* Main Problem Visual */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-white to-brand-peach/30 rounded-3xl shadow-2xl border-2 border-brand-border p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>

            <div className="relative z-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-brand-text-primary mb-4">
                    The Opportunity Cost
                  </h3>
                  <p className="text-lg text-brand-text-secondary mb-6">
                    AI platforms are the fastest-growing sales channel. But merchants can&apos;t:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-1">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="text-brand-text-secondary">List products on conversational interfaces</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-1">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="text-brand-text-secondary">Promote to high-intent AI shoppers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-1">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="text-brand-text-secondary">Transact seamlessly within chat</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-brand-border">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-extrabold text-brand-primary mb-2">$4.1T</div>
                    <p className="text-sm text-brand-text-secondary">Global e-commerce revenue by 2025</p>
                  </div>
                  <div className="text-center">
                    <div className="p-4 bg-brand-peach/30 rounded-xl">
                      <div className="text-2xl font-bold text-brand-text-primary">800M+</div>
                      <p className="text-sm text-brand-text-secondary mt-1">Weekly ChatGPT users</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Three Barriers */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-center text-brand-text-primary mb-12">
            Three barriers blocking merchant access
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Barrier 1 */}
            <div className="p-6 hover:bg-red-50 rounded-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-brand-text-primary mb-3">Fragmented Platforms</h4>
              <p className="text-brand-text-secondary leading-relaxed">
                Each agentic commerce platform uses different protocols. Merchants need separate integrations for ChatGPT, Claude, Perplexity, and more.
              </p>
            </div>

            {/* Barrier 2 */}
            <div className="p-6 hover:bg-red-50 rounded-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-brand-text-primary mb-3">Rapid Evolution</h4>
              <p className="text-brand-text-secondary leading-relaxed">
                Standards change constantly. What works today breaks tomorrow. Merchants can&apos;t keep up with continuous technical updates across platforms.
              </p>
            </div>

            {/* Barrier 3 */}
            <div className="p-6 hover:bg-red-50 rounded-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-brand-text-primary mb-3">Opaque Algorithms</h4>
              <p className="text-brand-text-secondary leading-relaxed">
                Discovery algorithms vary by platform with no clear optimization guidelines. Merchants are flying blind with no visibility into what works.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
