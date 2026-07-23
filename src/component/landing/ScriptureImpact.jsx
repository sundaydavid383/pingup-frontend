import React from 'react';
import { APP_NAME } from '../../constants/appConfig';

const ScriptureImpact = ({ onAuthClick }) => {
  return (
    <section
      id="bible"
      className="relative py-28 overflow-hidden scroll-mt-20"
      style={{ background: 'var(--bg-main)' }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[44rem] rounded-full blur-[140px] pointer-events-none"
        style={{ background: 'var(--ob-mesh-1)' }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        <div
          aria-hidden="true"
          className="absolute -top-6 left-1/2 -translate-x-1/2 select-none pointer-events-none"
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '14rem',
            lineHeight: 1,
            color: 'var(--primary)',
            opacity: 0.1,
          }}
        >
          "
        </div>

        <div className="text-center space-y-10 relative">

          <div className="flex items-center justify-center gap-3">
            <span className="w-10 h-px" style={{ background: 'rgba(var(--primary-rgb),0.45)' }} />
            <span className="text-[var(--primary)] text-xs">✦</span>
            <span className="w-10 h-px" style={{ background: 'rgba(var(--primary-rgb),0.45)' }} />
          </div>

          <blockquote className="space-y-5">
            <p
              className="text-3xl md:text-4xl lg:text-[3.25rem] leading-[1.2] text-white"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              For where two or three gather in my name, there am I with them.
            </p>
            <footer
              className="text-sm font-semibold tracking-[0.18em] uppercase"
              style={{ color: 'var(--primary)' }}
            >
              Matthew 18:20
            </footer>
          </blockquote>

          <div className="space-y-4 pt-2">
            <p
              className="text-xl md:text-2xl text-white"
              style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic' }}
            >
              Now imagine thousands gathering daily.
            </p>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              On {APP_NAME}, believers from around the world connect, pray, and grow together. Every shared scripture, every encouraging comment, and every prayer request builds our global faith community.
            </p>
          </div>

          <button
            onClick={() => onAuthClick && onAuthClick('signup')}
            className="px-10 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:brightness-110 hover:scale-[1.03] active:scale-95 shadow-[0_10px_30px_-8px_rgba(var(--primary-rgb),0.5)] inline-block mt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={{ background: 'var(--primary)', color: 'var(--text-main)' }}
          >
            Join the gathering
          </button>
        </div>
      </div>
    </section>
  );
};

export default ScriptureImpact;