import React from 'react';
import { BookOpen, Mic, MessageCircle, Heart } from 'lucide-react';

const FEATURES = [
  { icon: BookOpen, label: 'Read scripture' },
  { icon: Mic, label: 'Voice verse search' },
  { icon: MessageCircle, label: 'Faith community' },
  { icon: Heart, label: 'Prayer support' },
];

const TrustStrip = () => {
  return (
    <section
      className="py-10 border-y"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(var(--primary-rgb),0.18)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x divide-white/10">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="flex items-center justify-center gap-3 py-3 md:py-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
                >
                  <Icon size={16} style={{ color: 'var(--white)' }} />
                </div>
                <span className="text-xs sm:text-sm font-medium tracking-wide text-[var(--text-secondary)]">
                  {feature.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;