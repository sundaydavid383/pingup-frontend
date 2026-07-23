import React from 'react';
import { ArrowRight } from 'lucide-react';
import { APP_NAME } from '../../constants/appConfig';

const DOTS = [
  { x: 8, y: 12 }, { x: 92, y: 18 }, { x: 15, y: 82 },
  { x: 85, y: 78 }, { x: 50, y: 6 }, { x: 50, y: 94 },
];

const FinalCTA = ({ onAuthClick }) => {
  return (
    <section className="py-24" style={{ background: 'var(--bg-main)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-[2rem] p-12 md:p-20 text-center border transition-all duration-300"
          style={{
            background: 'linear-gradient(160deg, var(--form-bg), var(--bg-light))',
            borderColor: 'rgba(var(--primary-rgb),0.22)',
          }}
        >
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full blur-[110px] pointer-events-none"
            style={{ background: 'var(--ob-mesh-1)' }}
          />

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1={DOTS[0].x} y1={DOTS[0].y} x2={DOTS[4].x} y2={DOTS[4].y} stroke="var(--primary)" strokeWidth="0.12" strokeOpacity="0.3" />
            <line x1={DOTS[1].x} y1={DOTS[1].y} x2={DOTS[4].x} y2={DOTS[4].y} stroke="var(--primary)" strokeWidth="0.12" strokeOpacity="0.3" />
            <line x1={DOTS[2].x} y1={DOTS[2].y} x2={DOTS[5].x} y2={DOTS[5].y} stroke="var(--primary)" strokeWidth="0.12" strokeOpacity="0.3" />
            <line x1={DOTS[3].x} y1={DOTS[3].y} x2={DOTS[5].x} y2={DOTS[5].y} stroke="var(--primary)" strokeWidth="0.12" strokeOpacity="0.3" />
            {DOTS.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r="0.6" fill="var(--primary)" className="cta-dot" style={{ animationDelay: `${i * 0.5}s` }} />
            ))}
          </svg>

          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-6 text-[var(--primary)] text-[0.7rem] font-semibold tracking-[0.28em] uppercase">
              <span className="w-8 h-px bg-[var(--primary)]/50" />
              {APP_NAME}
              <span className="w-8 h-px bg-[var(--primary)]/50" />
            </div>

            <h2
              className="text-4xl md:text-5xl leading-[1.1] mb-5 text-white"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Ready to grow{' '}
              <span className="italic" style={{ color: 'var(--hover-dark)' }}>
                spiritually?
              </span>
            </h2>

            <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-md mx-auto">
              Free to join. No credit card required.
            </p>

            <button
              onClick={() => onAuthClick && onAuthClick('signup')}
              className="px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:brightness-110 hover:scale-[1.03] active:scale-95 shadow-[0_14px_36px_-10px_rgba(var(--primary-rgb),0.6)] inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{ background: 'var(--primary)', color: 'var(--text-main)' }}
            >
              Create free account
              <ArrowRight size={18} />
            </button>

            <p className="text-[var(--text-muted)] text-sm mt-7">
              Join a community that shows up for your growth, one day at a time.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .cta-dot {
          animation: cta-twinkle 3.5s ease-in-out infinite;
        }
        @keyframes cta-twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.7; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cta-dot { animation: none; opacity: 0.35; }
        }
      `}</style>
    </section>
  );
};

export default FinalCTA;