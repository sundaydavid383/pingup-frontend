import React from 'react';
import { BookOpen, Mic, MessageCircle, Users, Bell, Heart } from 'lucide-react';

const FeatureGrid = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Bible Reader',
      description: 'Full scripture access with intuitive search and reading features.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Mic,
      title: 'Voice Verse Search',
      description: 'Recite & find verses instantly without remembering chapter numbers.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: MessageCircle,
      title: 'Faith Feed',
      description: 'Share reflections, scriptures, and inspire believers worldwide.',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: Users,
      title: 'Spiritual Network',
      description: 'Follow believers, connect with your faith community globally.',
      color: 'from-blue-600 to-blue-700',
    },
    {
      icon: Bell,
      title: 'Prayer Circles',
      description: 'Request & give prayer support to believers in your network.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Heart,
      title: 'Daily Encouragement',
      description: 'Devotionals, testimonies, and spiritual resources every day.',
      color: 'from-red-500 to-red-600',
    },
  ];

  return (
    /* ADDED id="features" HERE */
    <section id="features" className="py-20 bg-[var(--bg-main)] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Everything You Need to Grow Spiritually
          </h2>
          <p className="text-gray-400">Powerful features designed for your faith journey</p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-8 hover:border-white/30 transition duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-2"
              >
                <div className={`bg-gradient-to-br ${feature.color} p-4 rounded-lg w-fit mb-4 group-hover:scale-110 transition duration-300`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;