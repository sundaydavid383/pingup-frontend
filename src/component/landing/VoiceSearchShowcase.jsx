import React from 'react';
import { Mic, ArrowRight } from 'lucide-react';

const VoiceSearchShowcase = ({ onAuthClick }) => {
  const bars = [0.4, 0.7, 1, 0.55, 0.85, 0.35, 0.9, 0.5, 0.65];

  return (
    <section
      className="py-28 relative overflow-hidden"
      style={{ background: 'var(--bg-main)' }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full blur-[130px] pointer-events-none"
        style={{ background: 'var(--ob-mesh-1)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'var(--primary)', opacity: 0.08 }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        <div className="text-center mb-14 space-y-5">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
            style={{ background: 'rgba(var(--primary-rgb),0.08)', borderColor: 'rgba(var(--primary-rgb),0.35)' }}
          >
            <Mic size={14} style={{ color: 'var(--primary)' }} />
            <span
              className="text-[0.7rem] font-semibold tracking-[0.22em] uppercase"
              style={{ color: 'var(--primary)' }}
            >
              Our differentiator
            </span>
          </div>

          <h2
            className="text-4xl md:text-5xl leading-[1.1] text-white"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Can't remember the verse?
          </h2>
          <p
            className="text-2xl md:text-[1.85rem] italic"
            style={{ fontFamily: "'Fraunces', serif", color: 'var(--primary)' }}
          >
            Just recite it. We'll find it.
          </p>
        </div>

        <div className="flex justify-center mb-14">
          <div className="relative w-full max-w-md flex flex-col items-center">

            <div className="relative w-28 h-28 mb-2">
              <div
                className="absolute -inset-3 rounded-full blur-2xl opacity-50 mic-breathe"
                style={{ background: 'var(--primary)' }}
              />
              <div
                className="relative w-full h-full rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--primary)',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), 0 20px 40px -12px rgba(var(--primary-rgb),0.6)',
                }}
              >
                <Mic size={34} style={{ color: 'var(--text-main)' }} strokeWidth={2.2} />
              </div>
            </div>

            <span
              className="text-[0.68rem] font-semibold tracking-[0.25em] uppercase mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Listening
            </span>

            <div className="flex items-end justify-center gap-[5px] h-10 mb-10" aria-hidden="true">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full eq-bar"
                  style={{
                    background: 'var(--primary)',
                    height: `${h * 100}%`,
                    animationDelay: `${i * 0.09}s`,
                  }}
                />
              ))}
            </div>

            <div
              className="w-full rounded-2xl p-6 border text-center"
              style={{ background: 'var(--form-bg)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <p
                className="text-lg text-[var(--text-secondary)] italic mb-4"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                "For God so loved the world..."
              </p>
              <div
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold"
                style={{ background: 'rgba(var(--primary-rgb),0.14)', color: 'var(--hover-dark)', border: '1px solid rgba(var(--primary-rgb),0.35)' }}
              >
                <ArrowRight size={13} />
                John 3:16
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-8">
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Speak the words you remember, even a fragment, and we'll find the exact passage. No chapter, no verse number, no problem.
          </p>

          <button
            onClick={() => onAuthClick && onAuthClick('signup')}
            className="px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 transform hover:brightness-110 hover:scale-[1.03] active:scale-95 shadow-[0_10px_30px_-8px_rgba(var(--primary-rgb),0.5)] inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={{ background: 'var(--primary)', color: 'var(--text-main)' }}
          >
            Try voice search
            <Mic size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .eq-bar {
          animation: eq 1.1s ease-in-out infinite;
          transform-origin: bottom;
        }
        @keyframes eq {
          0%, 100% { transform: scaleY(0.35); opacity: 0.55; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .mic-breathe {
          animation: breathe 2.4s ease-in-out infinite;
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .eq-bar, .mic-breathe { animation: none; }
          .eq-bar { transform: scaleY(0.7); opacity: 0.8; }
        }
      `}</style>
    </section>
  );
};

export default VoiceSearchShowcase;