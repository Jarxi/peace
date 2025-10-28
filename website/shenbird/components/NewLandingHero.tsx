'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const NewLandingHero: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsSubmitted(false);

    if (!email) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('submissions')
        .insert([{ email, url: 'waitlist' }]);

      if (dbError) {
        throw dbError;
      }

      setIsSubmitted(true);
      setEmail('');
    } catch (apiError) {
      console.error("Error saving to Supabase:", apiError);
      setError("Sorry, we couldn't save your submission. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-brand-peach/20 to-white py-20 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(#E93D0A15_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-text-primary tracking-tight leading-tight">
            One integration, <span className="text-brand-primary">infinite reach.</span>
          </h1>
          <p className="mt-6 text-xl sm:text-2xl text-brand-text-secondary max-w-3xl mx-auto leading-relaxed">
            The infrastructure layer for AI commerce. Connect your products to the right users across LLM platforms.
          </p>

          <div className="mt-12 max-w-xl mx-auto">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-6 py-4 text-lg rounded-full bg-white border-2 border-brand-border text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 shadow-lg"
                    aria-label="Email address for waiting list"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-4 text-lg rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-brand-primary/70 disabled:scale-100 disabled:cursor-wait whitespace-nowrap"
                  >
                    {isLoading ? 'Joining...' : 'Join Waitlist'}
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </form>
            ) : (
              <div className="bg-brand-surface border-2 border-brand-border rounded-2xl shadow-xl p-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-brand-text-primary">Thank You!</h2>
                <p className="mt-2 text-brand-text-secondary">You&apos;re on the waitlist. We&apos;ll be in touch soon!</p>
              </div>
            )}
          </div>

          <p className="mt-6 text-sm text-brand-text-secondary">
            Join leading merchants building on the future of commerce
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewLandingHero;
