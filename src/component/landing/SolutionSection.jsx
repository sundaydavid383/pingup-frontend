import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

const POINTS = [
  { title: 'Read the Bible Anytime', description: 'Access the complete scriptures with intuitive search and reading features.' },
  { title: 'Search Verses by Speaking Them', description: "Use voice search to find scriptures instantly—even if you don't remember the exact verse." },
  { title: 'Share Scriptures Instantly', description: 'Inspire others by sharing the words that matter most to you.' },
  { title: 'Connect with Believers Globally', description: 'Join a community of faith-focused individuals dedicated to spiritual growth.' },
];

const SolutionSection = ({ onAuthClick }) => {
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, var(--bg-main), rgba(var(--primary-rgb), 0.06), var(--bg-main))' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-14 items-center">

          <div className="flex justify-center md:justify-start order-2 md:order-1">
            <div className="relative w-60 h-[21rem]">
              <div
                className="absolute inset-0 rounded-[2.25rem] overflow-hidden border-[6px]"
                style={{
                  borderColor: 'var(--secondary)',
                  boxShadow: '0 25px 50px -15px rgba(0,0,0,0.55), 0 0 0 1px rgba(var(--primary-rgb),0.1)',
                }}
              >
                <div className="absolute inset-0 flex flex-col" style={{ background: 'var(--bg-main)' }}>
                  <div className="text-center py-3 border-b border-white/10">
                    <div
                      className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase"
                      style={{ color: 'var(--primary)' }}
                    >
                      Bible Reader
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 space-y-3 text-center">
                    <div className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>John 3:16</div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
                    </p>
                    <span className="w-8 h-px opacity-50" style={{ background: 'var(--primary)' }} />
                  </div>

                  <div className="flex gap-2 px-3 py-3 border-t border-white/10">
                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-1.5 rounded-lg transition">❤ Like</button>
                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-1.5 rounded-lg transition">↗ Share</button>
                  </div>
                </div>
              </div>

              <div className="absolute -inset-4 rounded-[2.5rem] blur-2xl -z-10 opacity-40" style={{ background: 'var(--sf-glow)' }} />
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="flex items-center gap-3 mb-4 text-[var(--primary)] text-[0.7rem] font-semibold tracking-[0.28em] uppercase">
              <span className="w-8 h-px bg-[var(--primary)]/50" />
              Why SpringsCircle
            </div>

            <h2
              className="text-3xl md:text-4xl leading-tight mb-8 text-white"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              A social platform rooted in scripture
            </h2>

            <div className="space-y-5">
              {POINTS.map((point, idx) => (
                <div key={idx} className="flex gap-4">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(var(--primary-rgb),0.12)', border: '1px solid rgba(var(--primary-rgb),0.35)' }}
                  >
                    <Check size={13} style={{ color: 'var(--primary)' }} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{point.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onAuthClick && onAuthClick('signup')}
              className="mt-10 px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 transform hover:brightness-110 hover:scale-[1.03] active:scale-95 shadow-[0_10px_30px_-8px_rgba(var(--primary-rgb),0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{ background: 'var(--primary)', color: 'var(--text-main)' }}
            >
              Start reading now
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;