import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewLandingHero from '../components/NewLandingHero';
import MissionSection from '../components/MissionSection';
import ProblemSection from '../components/ProblemSection';
import SolutionSection from '../components/SolutionSection';

export default function Home() {
  return (
    <div className="bg-white">
      <Header />
      <main>
        <NewLandingHero />
        <MissionSection />
        <ProblemSection />
        <SolutionSection />
      </main>
      <Footer />
    </div>
  );
}
