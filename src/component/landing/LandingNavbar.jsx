import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../../constants/appConfig';

const NAV_LINKS = [
  { label: 'Features', href: '#features', type: 'anchor' },
  { label: 'Bible', href: '#bible', type: 'anchor' },
  { label: 'Community', href: '/community', type: 'link' },
  { label: 'About', href: '/about', type: 'link' },
];

const LandingNavbar = ({ onAuthClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAuthClick = (tab = 'login') => {
    if (onAuthClick) onAuthClick(tab);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        background: 'linear-gradient(to bottom, rgba(15,23,42,0.94), rgba(15,23,42,0.78))',
        borderColor: 'rgba(var(--primary-rgb),0.18)',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[4.5rem]">

          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3 flex-shrink-0 relative z-10">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg ring-1 ring-[var(--primary)]/25 group-hover:ring-[var(--primary)]/50 transition-all duration-300 overflow-hidden">
              <img
                src="/icons/icon-192.png"
                alt={`${APP_NAME} logo`}
                className="w-full h-full object-contain"
              />
            </div>
            <span
              className="hidden sm:inline text-white text-[1.15rem] tracking-[0.01em]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              {APP_NAME}
              <span className="text-[var(--primary)]">.</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-9">
            {NAV_LINKS.map((item) => {
              const linkClasses =
                "relative text-[0.78rem] font-medium tracking-[0.12em] uppercase text-[var(--text-secondary)] hover:text-white transition-colors duration-200 py-2 after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-[var(--primary)] after:transition-all after:duration-300 hover:after:w-full";
              return item.type === 'anchor' ? (
                <a key={item.label} href={item.href} className={linkClasses}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.href} className={linkClasses}>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={() => handleAuthClick('login')}
              className="text-[0.85rem] font-medium text-[var(--text-secondary)] hover:text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
            >
              Log in
            </button>
            <button
              onClick={() => handleAuthClick('signup')}
              className="text-[0.85rem] font-semibold px-5 py-2.5 rounded-full transition-all duration-300 hover:brightness-110 hover:scale-[1.03] active:scale-[0.98] shadow-[0_4px_20px_-4px_rgba(var(--primary-rgb),0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{ background: 'var(--primary)', color: 'var(--text-main)' }}
            >
              Join free
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden text-[var(--text-secondary)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md p-1 transition-colors"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-2 space-y-1 border-t border-white/10">
            {NAV_LINKS.map((item) =>
              item.type === 'anchor' ? (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-2 py-3 text-sm tracking-wide text-[var(--text-secondary)] hover:text-white hover:pl-4 transition-all duration-200 border-b border-white/5"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-2 py-3 text-sm tracking-wide text-[var(--text-secondary)] hover:text-white hover:pl-4 transition-all duration-200 border-b border-white/5"
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleAuthClick('login')}
                className="flex-1 text-[var(--text-secondary)] hover:text-white border border-white/15 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => handleAuthClick('signup')}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold"
                style={{ background: 'var(--primary)', color: 'var(--text-main)' }}
              >
                Join free
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;