import React, { useState } from 'react';
import LandingNavbar from '../component/landing/LandingNavbar';
import HeroSection from '../component/landing/HeroSection';
import TrustStrip from '../component/landing/TrustStrip';
import ProblemSection from '../component/landing/ProblemSection';
import SolutionSection from '../component/landing/SolutionSection';
import FeatureGrid from '../component/landing/FeatureGrid';
import VoiceSearchShowcase from '../component/landing/VoiceSearchShowcase';
import HowItWorks from '../component/landing/HowItWorks';
import CommunityPreview from '../component/landing/CommunityPreview';
import ScriptureImpact from '../component/landing/ScriptureImpact';
import FinalCTA from '../component/landing/LandingFooter';
import LandingFooter from '../component/landing/Footer';
import AuthModal from '../component/landing/AuthModal';

const LandingPage = () => {
  const [authMode, setAuthMode] = useState(null); // null | "login" | "signup"

  const handleAuthClick = (tab = 'login') => {
    setAuthMode(tab);
  };

  const handleCloseAuth = () => {
    setAuthMode(null);
  };

  return (
    <div className="bg-[var(--bg-main)] text-white">
      <LandingNavbar onAuthClick={handleAuthClick} />
      <HeroSection onAuthClick={handleAuthClick} />
      <TrustStrip />
      <ProblemSection />
      <SolutionSection onAuthClick={handleAuthClick} />
      <FeatureGrid />
      <VoiceSearchShowcase onAuthClick={handleAuthClick} />
      <HowItWorks />
      <CommunityPreview />
      <ScriptureImpact onAuthClick={handleAuthClick} />
      <FinalCTA onAuthClick={handleAuthClick} />
      <LandingFooter />

      {/* Auth Modal Overlay */}
      {authMode && (
        <AuthModal mode={authMode} onClose={handleCloseAuth} />
      )}
    </div>
  );
};

export default LandingPage;
