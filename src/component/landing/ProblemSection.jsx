import React from 'react';

const ProblemSection = () => {
  const problems = [
    {
      icon: '❌',
      title: 'Endless Scrolling Without Purpose',
      description: 'Social media feeds often distract from meaningful connection and spiritual growth.',
    },
    {
      icon: '❌',
      title: 'Distractions Everywhere',
      description: 'Finding faith-focused content on secular platforms is challenging and exhausting.',
    },
    {
      icon: '❌',
      title: 'Hard to Find Spiritual Community',
      description: 'Connecting with genuine believers who share your values requires leaving the platform.',
    },
  ];

  return (
    <section className="py-20 bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Social Media Feeds the Mind.
          </h2>
          <p className="text-xl text-gray-400">
            But What Feeds the Spirit?
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-8 hover:border-white/20 transition duration-300 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="text-4xl mb-4">{problem.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-white">{problem.title}</h3>
              <p className="text-gray-400 leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
