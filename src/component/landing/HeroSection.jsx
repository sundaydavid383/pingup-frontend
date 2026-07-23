// FILE: src/component/landing/HeroSection.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Play, Users, Clock } from 'lucide-react';
import UserStats from '../UserStats';

const CONSTELLATION_DOTS = [
  { x: 8, y: 18, r: 2.2, delay: 0 },
  { x: 22, y: 10, r: 1.4, delay: 0.6 },
  { x: 34, y: 26, r: 1.8, delay: 1.4 },
  { x: 15, y: 42, r: 1.2, delay: 2.1 },
  { x: 46, y: 15, r: 2, delay: 0.9 },
  { x: 52, y: 38, r: 1.4, delay: 1.7 },
  { x: 6, y: 60, r: 1.6, delay: 2.6 },
  { x: 30, y: 66, r: 1.2, delay: 0.3 },
];
const CONSTELLATION_LINES = [
  [0, 1], [1, 4], [2, 4], [2, 5], [0, 3], [3, 7], [5, 6],
];

const HeroSection = ({ onAuthClick }) => {
  const handleAuthClick = (tab = 'signup') => {
    if (onAuthClick) onAuthClick(tab);
  };

  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handlePhoneMove = (e) => {
    if (reducedMotion.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: py * -7, ry: px * 9 });
  };
  const handlePhoneLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <section
      className="relative flex items-center overflow-hidden lg:max-h-screen"
      style={{ background: 'var(--inverse-dark-indigo-gradient)' }}
    >
      <div className="absolute -top-32 -left-24 w-[36rem] h-[36rem] rounded-full blur-[110px] pointer-events-none"
           style={{ background: 'var(--ob-mesh-1)' }} />
      <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full blur-[100px] pointer-events-none"
           style={{ background: 'var(--ob-mesh-2)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--radial-highlight)] to-transparent opacity-30 pointer-events-none" />

      {/* Film grain — breaks up gradient banding, adds tactility */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] mix-blend-overlay"
        aria-hidden="true"
      >
        <filter id="heroGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#heroGrain)" />
      </svg>

      {/* Constellation */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-70"
        viewBox="0 0 60 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {CONSTELLATION_LINES.map(([a, b], i) => {
          const p1 = CONSTELLATION_DOTS[a];
          const p2 = CONSTELLATION_DOTS[b];
          return (
            <line
              key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="var(--primary)"
              strokeWidth="0.08"
              strokeOpacity="0.4"
            />
          );
        })}
        {CONSTELLATION_DOTS.map((d, i) => (
          <circle
            key={i}
            cx={d.x} cy={d.y} r={d.r / 10}
            fill="var(--primary)"
            className="constellation-dot"
            style={{ animationDelay: `${d.delay}s` }}
          />
        ))}
      </svg>

      <div className="relative w-full mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 h-full">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-16 py-14 sm:py-16 lg:py-20 lg:h-full lg:max-h-[90vh]">

          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left text-white max-w-2xl lg:min-h-0">

            <div className="hero-in hero-in-1 flex items-center gap-3 mb-5 text-[var(--primary)] text-[0.7rem] font-semibold tracking-[0.28em] uppercase">
              <span className="eyebrow-line w-8 h-px bg-[var(--primary)]/60" />
              A community built on follow-through
            </div>

            <h1
              className="hero-in hero-in-2 text-4xl sm:text-5xl lg:text-[3.75rem] leading-[1.08] mb-6 max-w-[90vw] sm:max-w-none"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              <span className="text-white">More than just friends —</span>
              <br />
              <span
                className="italic"
                style={{ color: 'var(--primary)', textShadow: '0 0 28px rgba(var(--primary-rgb),0.45)' }}
              >
                truly connect.
              </span>
            </h1>

            <p className="hero-in hero-in-3 text-[var(--text-secondary)] text-base sm:text-lg mb-8 max-w-md lg:max-w-lg leading-relaxed">
              Search Bible verses by text or voice, share scriptures, and engage with a spiritual community in real time.
            </p>

            <div className="hero-in hero-in-4 flex items-center divide-x divide-white/10 mb-9 text-[var(--text-secondary)]">
              <div className="pr-5 sm:pr-6 flex items-center gap-2">
                <Users size={17} style={{ color: 'var(--primary)' }} />
                <UserStats />
              </div>
              <div className="px-5 sm:px-6 flex items-center gap-2 text-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: 'var(--primary)' }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'var(--primary)' }} />
                </span>
                Live updates
              </div>
              <div className="pl-5 sm:pl-6 flex items-center gap-2 text-sm">
                <Clock size={15} style={{ color: 'var(--primary)' }} />
                Instant notifications
              </div>
            </div>

            <div className="hero-in hero-in-5 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={() => handleAuthClick('signup')}
                className="relative overflow-hidden group font-semibold px-8 py-3.5 sm:py-4 rounded-xl transition-all duration-200 transform hover:scale-[1.03] active:scale-95 shadow-[0_10px_30px_-8px_rgba(var(--primary-rgb),0.55)] w-full sm:w-auto text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style={{ background: 'var(--primary)', color: 'var(--text-main)' }}
              >
                <span className="relative z-10">Join free</span>
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
                  style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)' }}
                />
              </button>

              <button
                className="border border-white/25 hover:border-[var(--primary)]/50 text-white px-7 py-3.5 sm:py-4 rounded-xl font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 backdrop-blur-sm w-full sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <Play size={18} />
                Explore
              </button>
            </div>
          </div>

          <div
            className="flex-1 hidden sm:flex justify-center lg:justify-end items-center order-last lg:order-none lg:self-stretch hero-in hero-in-6"
            style={{ perspective: '1400px' }}
          >
            <div
              onMouseMove={handlePhoneMove}
              onMouseLeave={handlePhoneLeave}
              className="relative w-72 sm:w-96 lg:w-[27rem] xl:w-[23rem] h-[580px] sm:h-[640px] lg:h-[620px] xl:h-[660px] max-h-[85vh]"
              style={{
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                className="absolute inset-0 rounded-[3.5rem] sm:rounded-[4rem] overflow-hidden border-[8px]"
                style={{
                  borderColor: 'var(--secondary)',
                  boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(var(--primary-rgb),0.1)',
                }}
              >
                <div className="absolute inset-0 flex flex-col" style={{ background: 'var(--bg-main)' }}>
                  <div className="h-9 pt-4 px-6 sm:px-8 flex justify-between items-center text-xs text-[var(--text-muted)]">
                    <span className="font-semibold text-white">9:41</span>
                    <div className="flex gap-1.5">
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>

                  <div className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto scrollbar-thin">
                    <div
                      className="rounded-xl p-4 border relative"
                      style={{ background: 'var(--story-surface)', borderColor: 'rgba(var(--primary-rgb),0.3)' }}
                    >
                      <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full" style={{ background: 'var(--primary)' }} />
                      <div className="flex gap-2 mb-2 pl-2">
                        <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--primary), var(--hover-dark))' }} />
                        <div className="flex-1 text-[10px]">
                          <div className="text-white font-semibold">Sunday D.</div>
                          <div className="text-[var(--text-muted)]">2 hours ago</div>
                        </div>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] leading-relaxed pl-2">
                        For God so loved the world...
                        <br />
                        <span style={{ color: 'var(--primary)' }}>— John 3:16</span>
                      </div>
                    </div>

                    <div className="rounded-xl p-3 border border-white/10 opacity-90" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex-shrink-0" />
                        <div className="flex-1 text-[10px]">
                          <div className="text-white font-semibold">Andrew Y.</div>
                          <div className="text-[var(--text-muted)]">4 hours ago</div>
                        </div>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">Daily prayer reflection 🙏</div>
                    </div>

                    <div className="rounded-xl p-3 border border-white/10 opacity-60" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0" />
                        <div className="flex-1 text-[10px]">
                          <div className="text-white font-semibold">Blessing O.</div>
                          <div className="text-[var(--text-muted)]">6 hours ago</div>
                        </div>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">Just finished the morning devotional! ✨</div>
                    </div>

                    <div className="mt-auto rounded-xl p-3 border text-center" style={{ background: 'rgba(var(--primary-rgb),0.08)', borderColor: 'rgba(var(--primary-rgb),0.3)' }}>
                      <div className="text-[10px] font-medium flex items-center justify-center gap-2" style={{ color: 'var(--primary)' }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
                        Listening...
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-8 -bottom-8 w-32 h-32 blur-[80px] opacity-25 pointer-events-none" style={{ background: 'var(--sf-glow)' }} />
              <div className="absolute -left-6 -top-6 w-24 h-24 blur-[70px] opacity-20 pointer-events-none" style={{ background: 'var(--primary)' }} />
            </div>
          </div>

        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-in hero-in-7 hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-[var(--text-muted)]">
        <span className="text-[0.6rem] tracking-[0.3em] uppercase">Scroll</span>
        <span className="w-px h-8 overflow-hidden relative">
          <span className="absolute inset-0 scroll-drip" style={{ background: 'var(--primary)' }} />
        </span>
      </div>

      <style>{`
        .constellation-dot {
          animation: twinkle 4s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.8; }
        }

        .hero-in {
          opacity: 0;
          animation: heroFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .hero-in-1 { animation-delay: 0.05s; }
        .hero-in-2 { animation-delay: 0.18s; }
        .hero-in-3 { animation-delay: 0.32s; }
        .hero-in-4 { animation-delay: 0.44s; }
        .hero-in-5 { animation-delay: 0.55s; }
        .hero-in-6 { animation-delay: 0.3s; }
        .hero-in-7 { animation-delay: 0.9s; }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .eyebrow-line {
          transform: scaleX(0);
          transform-origin: left;
          animation: lineDraw 0.6s ease-out 0.35s forwards;
        }
        @keyframes lineDraw {
          to { transform: scaleX(1); }
        }

        .scroll-drip {
          animation: scrollDrip 1.8s ease-in-out infinite;
        }
        @keyframes scrollDrip {
          0% { transform: translateY(-100%); }
          60%, 100% { transform: translateY(100%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .constellation-dot,
          .hero-in,
          .eyebrow-line,
          .scroll-drip,
          .animate-ping,
          .animate-pulse {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;