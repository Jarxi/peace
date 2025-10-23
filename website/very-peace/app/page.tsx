import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';
import ChatGPTFeature from '../components/ChatGPTFeature';

export default function Home() {
  return (
    <div className="bg-brand-bg">
      <Header />
      <main>
        <Hero />
        <Features />
        <ChatGPTFeature />
      </main>
      <Footer />
    </div>
  );
}
