import React, { useState } from 'react';
import { Heart, Users, Zap, CheckCircle } from 'lucide-react';
import LandingNavbar from '../component/landing/LandingNavbar';
import LandingFooter from '../component/landing/Footer';
import AuthModal from '../component/landing/AuthModal';

const AboutPage = () => {
  const [authMode, setAuthMode] = useState(null);

  const handleAuthClick = (tab = 'login') => {
    setAuthMode(tab);
  };

  const handleCloseAuth = () => {
    setAuthMode(null);
  };

  return (
    <div className="bg-[var(--bg-main)] text-white min-h-screen">
      {authMode && <AuthModal mode={authMode} onClose={handleCloseAuth} />}
      <LandingNavbar onAuthClick={handleAuthClick} />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-900/20 via-transparent to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Where Faith Meets Community
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Connect spiritually, grow together
          </p>
          <button
            onClick={() => handleAuthClick('signup')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95"
          >
            Join a Circle
          </button>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Our Mission, Vision & Values
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mission Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-8 hover:border-white/20 transition duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Heart size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Mission</h3>
              <p className="text-gray-300">
                Empower spiritual growth by creating a Christ-centered platform where believers can read Scripture, share reflections, and build meaningful connections with a global faith community.
              </p>
            </div>

            {/* Vision Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-8 hover:border-white/20 transition duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Users size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Vision</h3>
              <p className="text-gray-300">
                Create a vibrant spiritual community where thousands of believers connect daily, grow together in faith, and support one another on their spiritual journeys through Scripture and prayer.
              </p>
            </div>

            {/* Values Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-8 hover:border-white/20 transition duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Zap size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Values</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-blue-400" />
                  <span>Faith</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-blue-400" />
                  <span>Community</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-blue-400" />
                  <span>Growth</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline / Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-900/10 via-transparent to-blue-900/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Our Story
          </h2>

          <div className="space-y-8">
            {[
              {
                year: '2024',
                title: 'App Launch',
                description: 'SpringsConnect launched with core features: Bible reader, voice search, and community feed.',
              },
              {
                year: '2024',
                title: 'First 1,000 Users',
                description: 'Reached our first 1,000 active community members and established foundational prayer circles.',
              },
              {
                year: '2025',
                title: 'Prayer Circles Feature',
                description: 'Introduced prayer circle functionality, enabling believers to request and give prayer support.',
              },
              {
                year: '2026',
                title: 'Global Growth',
                description: 'SpringsConnect now serves thousands of believers worldwide with daily spiritual connections.',
              },
            ].map((milestone, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-lg">
                    {idx + 1}
                  </div>
                  {idx < 3 && <div className="w-1 h-16 bg-gradient-to-b from-blue-500/50 to-blue-500/0"></div>}
                </div>
                <div className="pb-8">
                  <div className="text-sm font-semibold text-blue-400 mb-2">{milestone.year}</div>
                  <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                  <p className="text-gray-400">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Our Team</h2>
          <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-12">
            <p className="text-2xl font-semibold text-blue-400 mb-4">Coming Soon</p>
            <p className="text-gray-300">
              We're building a passionate team dedicated to connecting believers worldwide through Scripture and community.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-900/10 via-transparent to-blue-900/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Testimonials
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mariasantos',
                quote: '"SpringsConnect has transformed my daily spiritual practice. I can read the Bible anytime and connect with believers who share my faith."',
                author: 'Maria Santos',
                role: 'User from Brazil',
              },
              {
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jameschen',
                quote: '"The voice search feature is incredible. I can finally find Bible verses I remember without knowing the exact chapter and verse."',
                author: 'James Chen',
                role: 'User from Singapore',
              },
              {
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=davidlee',
                quote: '"Being part of a prayer circle has been life-changing. I feel supported and surrounded by genuine believers."',
                author: 'David Lee',
                role: 'User from South Korea',
              },
              {
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarahmitchell',
                quote: '"This platform gave me the spiritual community I was searching for. It\'s truly different from other social media apps."',
                author: 'Sarah Mitchell',
                role: 'User from USA',
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-xs text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-200 italic">{testimonial.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Ready to Join Our Community?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Start your spiritual journey with thousands of believers worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleAuthClick('login')}
              className="border border-blue-500 text-blue-400 hover:bg-blue-500/10 px-8 py-3 rounded-lg font-semibold transition"
            >
              Login
            </button>
            <button
              onClick={() => handleAuthClick('signup')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95"
            >
              Sign Up
            </button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default AboutPage;
