'use client';

import React from 'react';

const SolutionSection: React.FC = () => {
  return (
    <section className="pt-20 sm:pt-24 bg-gradient-to-b from-brand-peach/10 to-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#E93D0A15_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-block px-4 py-2 bg-brand-primary/10 rounded-full mb-6">
            <span className="text-sm font-bold text-brand-primary uppercase tracking-wider">Our Solution</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-text-primary leading-tight">
            One integration.<br />Infinite reach.
          </h2>
          <p className="mt-6 text-xl text-brand-text-secondary leading-relaxed">
            Build the infrastructure layer that bridges merchants to agentic commerce—so you can focus on your business, not technical integration.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 hover:bg-brand-peach/10 rounded-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-brand-text-primary mb-3">Abstract Platform Complexity</h3>
            <p className="text-brand-text-secondary leading-relaxed">
              Connect once to our infrastructure and reach all agentic commerce platforms. We handle the complexity of multiple protocols and standards.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 hover:bg-brand-peach/10 rounded-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-brand-text-primary mb-3">Adapt to Changes Automatically</h3>
            <p className="text-brand-text-secondary leading-relaxed">
              Stay up-to-date effortlessly. Our infrastructure adapts to protocol changes and platform updates in real-time, without requiring action from you.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 hover:bg-brand-peach/10 rounded-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-brand-text-primary mb-3">Optimize Product Visibility</h3>
            <p className="text-brand-text-secondary leading-relaxed">
              Maximize discoverability across all platforms. Our algorithms ensure your products reach the right users at the right time, every time.
            </p>
          </div>
        </div>

      </div>

      {/* Full-Width CTA */}
      <div className="mt-32 relative overflow-hidden bg-brand-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
              Ready to join the AI commerce revolution?
            </h3>
            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              Get early access and be among the first merchants to tap into the future of commerce.
            </p>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="inline-block px-8 py-4 text-base rounded-full bg-white text-brand-primary hover:bg-gray-50 font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
            >
              Join Waitlist Now
            </a>
            <p className="mt-6 text-white/80 text-sm">
              Early access perks • Priority support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
