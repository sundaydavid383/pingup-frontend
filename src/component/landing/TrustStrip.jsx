import React from 'react';
import { BookOpen, Mic, MessageCircle, Heart } from 'lucide-react';

const TrustStrip = () => {
  const features = [
    { icon: BookOpen, label: 'Read Scripture', color: 'from-blue-500 to-blue-600' },
    { icon: Mic, label: 'Voice Verse Search', color: 'from-blue-500 to-blue-600' },
    { icon: MessageCircle, label: 'Faith Community', color: 'from-blue-600 to-blue-700' },
    { icon: Heart, label: 'Prayer Support', color: 'from-red-500 to-red-600' },
  ];

  return (
    <section className="py-12 bg-gradient-to-r from-white/5 via-white/10 to-white/5 border-y border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="flex flex-col items-center gap-2 text-center">
                <div className={`bg-gradient-to-br ${feature.color} p-3 rounded-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-sm md:text-base font-semibold text-gray-200">{feature.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
