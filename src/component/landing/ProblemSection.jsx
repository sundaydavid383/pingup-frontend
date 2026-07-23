import React from 'react';
import { X } from 'lucide-react';

const PROBLEMS = [
  {
    title: 'Endless Scrolling Without Purpose',
    description: 'Social media feeds often distract from meaningful connection and spiritual growth.',
  },
  {
    title: 'Distractions Everywhere',
    description: 'Finding faith-focused content on secular platforms is challenging and exhausting.',
  },
  {
    title: 'Hard to Find Spiritual Community',
    description: 'Connecting with genuine believers who share your values requires leaving the platform.',
  },
];

const ProblemSection = () => {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: 'var(--bg-main)' }}>
      {/* quiet hairline — no gold here; this section is the "before" */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.35), transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2
            className="text-3xl md:text-[2.75rem] leading-[1.15] mb-3 text-white"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Social media feeds the mind.
          </h2>
          <p
            className="text-xl text-[var(--text-secondary)] italic"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            But what feeds the spirit?
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PROBLEMS.map((problem, idx) => (
            <div
              key={idx}
              className="group rounded-2xl p-8 border border-white/[0.08] hover:border-white/[0.14] transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="w-10 h-10 rounded-full border border-[rgba(239,68,68,0.3)] group-hover:border-[rgba(239,68,68,0.55)] flex items-center justify-center mb-6 transition-colors duration-300">
                <X size={16} style={{ color: 'var(--red)' }} strokeWidth={2.5} className="opacity-70" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">{problem.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;