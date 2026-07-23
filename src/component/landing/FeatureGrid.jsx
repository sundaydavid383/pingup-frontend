import React from 'react';
import { BookOpen, Mic, MessageCircle, Users, Bell, Heart } from 'lucide-react';

const FEATURES = [
  { icon: BookOpen, title: 'Bible Reader', description: 'Full scripture access with intuitive search and reading features.' },
  { icon: Mic, title: 'Voice Verse Search', description: 'Recite & find verses instantly without remembering chapter numbers.' },
  { icon: MessageCircle, title: 'Faith Feed', description: 'Share reflections, scriptures, and inspire believers worldwide.' },
  { icon: Users, title: 'Spiritual Network', description: 'Follow believers, connect with your faith community globally.' },
  { icon: Bell, title: 'Prayer Circles', description: 'Request & give prayer support to believers in your network.' },
  { icon: Heart, title: 'Daily Encouragement', description: 'Devotionals, testimonies, and spiritual resources every day.' },
];

const FeatureGrid = () => {
  return (
    <section id="features" className="py-24 scroll-mt-20" style={{ background: 'var(--bg-main)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4 text-[var(--primary)] text-[0.7rem] font-semibold tracking-[0.28em] uppercase">
  <span className="w-8 h-px bg-[var(--primary)]/50" />
  What's inside
  <span className="w-8 h-px bg-[var(--primary)]/50" />
</div>
          <h2
            className="text-3xl md:text-4xl mb-3 text-white"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Everything you need to grow spiritually
          </h2>
          <p className="text-[var(--text-secondary)]">Powerful features designed for your faith journey</p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl p-8 border border-white/10 hover:border-[rgba(var(--primary-rgb),0.35)] transition-all duration-300 hover:-translate-y-1.5"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 20px -8px rgba(48,85,209,0.5)',
                  }}
                >
                  <Icon size={20} style={{ color: 'var(--white)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{feature.description}</p>

                {/* hover accent line — the grid's one shared signature */}
                <span
                  className="absolute bottom-0 left-8 right-8 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                  style={{ background: 'var(--primary)' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;