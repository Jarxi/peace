'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { SearchIcon } from './icons/SearchIcon';
import { MailIcon } from './icons/MailIcon';
import { TargetIcon } from './icons/TargetIcon';
import { AnswerEngineIcon } from './icons/AnswerEngineIcon';
import { FileCodeIcon } from './icons/FileCodeIcon';

// FIX: Define and export the AnalysisResultData interface to resolve an import error in AnalysisResult.tsx.
export interface AnalysisResultData {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

const Hero: React.FC = () => {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsSubmitted(false);
    
    // Validate both fields are provided
    if (!url) {
      setError('Please enter a website URL.');
      setIsLoading(false);
      return;
    }
    
    if (!email) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }
    
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
        formattedUrl = 'https://' + url;
    }

    try {
        new URL(formattedUrl);
    } catch {
        setError('Please enter a valid website URL.');
        setIsLoading(false);
        return;
    }

    try {
      const { error: dbError } = await supabase
        .from('submissions')
        .insert([{ url: formattedUrl, email }]);

      if (dbError) {
        throw dbError;
      }
      
      setSubmittedUrl(formattedUrl);
      setSubmittedEmail(email);
      setIsSubmitted(true);
      setUrl(''); // Clear the input fields on success
      setEmail('');

    } catch (apiError) {
      console.error("Error saving to Supabase:", apiError);
      setError("Sorry, we couldn't save your submission. Please try again later.");
      setSubmittedUrl(null);
      setSubmittedEmail(null);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <section id="about" className="relative text-center py-24 sm:py-32 overflow-hidden bg-brand-bg">
      <div 
        className="absolute inset-0 opacity-20" 
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 50%, #209781 0%, transparent 25%),
            radial-gradient(circle at 85% 40%, #1B8CFE 0%, transparent 25%)
          `,
        }}
      ></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-brand-text-primary tracking-tight">
          Sell Your Products in ChatGPT.
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-brand-text-secondary">
          Is your site ready for conversational AI? Enter your URL and email to join our waiting list.
        </p>

        <div className="mt-12 max-w-4xl mx-auto">
          {!isSubmitted ? (
             <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4" noValidate>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-brand-text-secondary" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Please enter your URL"
                    className="w-full block pl-12 pr-4 py-4 sm:text-lg rounded-full bg-brand-bg border border-brand-border text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 shadow-lg"
                    aria-label="Website URL for AEO analysis"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <MailIcon className="h-5 w-5 text-brand-text-secondary" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Please enter your email address"
                    className="w-full block pl-12 pr-4 py-4 sm:text-lg rounded-full bg-brand-bg border border-brand-border text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 shadow-lg"
                    aria-label="Email address for waiting list"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 sm:text-lg rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface focus:ring-brand-primary disabled:bg-brand-primary/70 disabled:scale-100 disabled:cursor-wait"
                >
                  {isLoading ? 'Joining...' : 'Join Waiting List'}
                </button>
              </form>
          ) : (
            <div className="text-center bg-brand-surface border border-brand-border rounded-2xl shadow-xl p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-brand-text-primary">Thank You!</h2>
              <p className="mt-2 text-brand-text-secondary">You&apos;re on the list. We&apos;ll be in touch soon!</p>
              <p className="mt-4 text-brand-primary font-medium truncate">{submittedUrl}</p>
              <p className="mt-2 text-brand-primary font-medium truncate">{submittedEmail}</p>
            </div>
          )}
          {error && !isSubmitted && <p className="mt-4 text-red-500 bg-red-100 border border-red-200 rounded-full px-4 py-1 inline-block">{error}</p>}
        </div>
        
        <div className="mt-20 max-w-5xl mx-auto grid gap-8 md:grid-cols-1 lg:grid-cols-3">
          <div className="bg-brand-bg p-8 rounded-2xl shadow-lg border border-brand-border text-center transform transition-all duration-300 hover:scale-105" style={{ borderColor: '#20978140' }}>
            <div className="flex items-center justify-center h-16 w-16 rounded-full mx-auto" style={{ backgroundColor: '#20978120' }}>
              <TargetIcon className="h-8 w-8" style={{ color: '#209781' }} />
            </div>
            <h3 className="mt-6 text-xl font-bold text-brand-text-primary">Intergration</h3>
            <p className="mt-2 text-base text-brand-text-secondary">We intergrate your products into GPT and other generative AI engines.</p>
          </div>
          
          <div className="bg-brand-bg p-8 rounded-2xl shadow-lg border border-brand-border text-center transform transition-all duration-300 hover:scale-105" style={{ borderColor: '#1B8CFE40' }}>
            <div className="flex items-center justify-center h-16 w-16 rounded-full mx-auto" style={{ backgroundColor: '#1B8CFE20' }}>
              <AnswerEngineIcon className="h-8 w-8" style={{ color: '#1B8CFE' }} />
            </div>
            <h3 className="mt-6 text-xl font-bold text-brand-text-primary">Insights</h3>
            <p className="mt-2 text-base text-brand-text-secondary">We get insights into your products and sales in generative AI engines.</p>
          </div>
          
          <div className="bg-brand-bg p-8 rounded-2xl shadow-lg border border-brand-border text-center transform transition-all duration-300 hover:scale-105" style={{ borderColor: '#FFB60A40' }}>
            <div className="flex items-center justify-center h-16 w-16 rounded-full mx-auto" style={{ backgroundColor: '#FFB60A20' }}>
              <FileCodeIcon className="h-8 w-8" style={{ color: '#FFB60A' }} />
            </div>
            <h3 className="mt-6 text-xl font-bold text-brand-text-primary">Improvement</h3>
            <p className="mt-2 text-base text-brand-text-secondary">We help increase GMV and conversation rates.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;