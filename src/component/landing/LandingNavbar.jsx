import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../../constants/appConfig';

const LandingNavbar = ({ onAuthClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAuthClick = (tab = 'login') => {
    if (onAuthClick) onAuthClick(tab);
    setMobileMenuOpen(false);
  };

  // Smooth scroll function
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false); // close mobile menu on click
  };

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg-main)] border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 relative z-10 hover:opacity-80 transition">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/icons/icon-192.png" 
                alt="{APP_NAME} Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-lg hidden sm:inline text-white">{APP_NAME}</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
            <a href="#bible" className="text-gray-300 hover:text-white transition">Bible</a>
            <Link to="/community" className="text-gray-300 hover:text-white transition">Community</Link>
            <Link to="/about" className="text-gray-300 hover:text-white transition">About</Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => handleAuthClick('login')}
              className="text-gray-300 hover:text-white transition font-medium"
            >
              Login
            </button>
            <button
              onClick={() => handleAuthClick('signup')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition transform hover:scale-105"
            >
              Join Free
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <a href="#features" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded">Features</a>
            <a href="#bible" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded">Bible</a>
            <Link to="/community" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded">Community</Link>
            <Link to="/about" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded">About</Link>
            <div className="flex gap-2 pt-2 px-4">
              <button
                onClick={() => handleAuthClick('login')}
                className="flex-1 text-gray-300 hover:text-white border border-white/20 py-2 rounded-lg transition"
              >
                Login
              </button>
              <button
                onClick={() => handleAuthClick('signup')}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg font-semibold"
              >
                Join Free
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;
