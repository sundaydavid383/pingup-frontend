import React from 'react';

const STEPS = [
  { number: '01', title: 'Create your profile', description: 'Personalize your faith journey with your preferences and spiritual goals.' },
  { number: '02', title: 'Explore & connect', description: 'Discover scripture, find believers, and explore communities aligned with your values.' },
  { number: '03', title: 'Share & grow', description: 'Encourage others by sharing scriptures and grow spiritually together.' },
];

const HowItWorks = () => {
  return (
    <section className="py-24" style={{ background: 'var(--bg-main)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-4 text-[var(--primary)] text-[0.7rem] font-semibold tracking-[0.28em] uppercase">
            <span className="w-8 h-px bg-[var(--primary)]/50" />
            The path
            <span className="w-8 h-px bg-[var(--primary)]/50" />
          </div>
          <h2
            className="text-3xl md:text-4xl mb-3 text-white"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            How it works
          </h2>
          <p className="text-[var(--text-secondary)]">Three steps to start your spiritual journey</p>
        </div>

        <div className="grid md:grid-cols-3 gap-x-8 gap-y-14 relative">
          <div
            className="hidden md:block absolute top-6 left-[16.5%] right-[16.5%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--primary-rgb),0.4) 15%, rgba(var(--primary-rgb),0.4) 85%, transparent)' }}
          />

          {STEPS.map((step) => (
            <div key={step.number} className="relative">
              <div
                className="rounded-2xl p-8 pt-10 border border-white/10 hover:border-[rgba(var(--primary-rgb),0.35)] transition-all duration-300 hover:-translate-y-1.5 h-full"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))' }}
              >
                <div
                  className="text-[2.75rem] leading-none mb-5 select-none"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 500,
                    fontStyle: 'italic',
                    color: 'var(--hover-dark)',
                  }}
                >
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{step.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;