import React from 'react';
import { ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      title: 'Create Your Profile',
      description: 'Personalize your faith journey with your preferences and spiritual goals.',
    },
    {
      number: '2',
      title: 'Explore & Connect',
      description: 'Discover scripture, find believers, and explore communities aligned with your values.',
    },
    {
      number: '3',
      title: 'Share & Grow',
      description: 'Encourage others by sharing scriptures and grow spiritually together.',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-[var(--bg-main)] via-blue-900/5 to-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-gray-400">Three simple steps to start your spiritual journey</p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection lines (hidden on mobile) */}
          <div className="hidden md:block absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Step Card */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-8 hover:border-white/20 transition duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                {/* Step Number */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 mx-auto">
                  {step.number}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-center mb-3 text-white">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-center">
                  {step.description}
                </p>
              </div>

              {/* Arrow to next step */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute right-0 top-1/3 transform translate-x-1/2 -translate-y-1/2">
                  <ArrowRight size={24} className="text-blue-500/50" />
                </div>
              )}

              {/* Mobile arrow */}
              {idx < steps.length - 1 && (
                <div className="md:hidden flex justify-center mt-4">
                  <div className="text-blue-500/50">↓</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
