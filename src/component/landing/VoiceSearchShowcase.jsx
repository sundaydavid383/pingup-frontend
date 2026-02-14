import React from 'react';
import { Mic } from 'lucide-react';

const VoiceSearchShowcase = ({ onAuthClick }) => {

  return (
    <section className="py-24 bg-gradient-to-b from-[var(--bg-main)] via-blue-900/10 to-[var(--bg-main)] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block">
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-full">
              <Mic size={18} className="text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">Our Differentiator</span>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Can't Remember the Verse?
          </h2>
          <p className="text-2xl md:text-3xl text-gray-400 font-semibold">
            Just Recite It. We'll Find It.
          </p>
        </div>

        {/* Voice Search Visual */}
        <div className="flex justify-center mb-12">
          <div className="relative w-full max-w-sm">
            {/* Microphone animation */}
            <div className="flex justify-center items-center">
              <div className="relative w-32 h-32">
                {/* Animated rings */}
                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 border-2 border-blue-500/20 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute inset-8 border-2 border-blue-500/10 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>

                {/* Mic icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-full">
                    <Mic size={40} className="text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Example text */}
            <div className="mt-12 text-center space-y-4">
              <div className="bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-lg p-6">
                <p className="text-lg text-gray-300 italic">
                  "For God so loved the world…"
                </p>
                <div className="mt-3 inline-block bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1 rounded-full text-sm font-semibold">
                  → John 3:16
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="text-center space-y-8">
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Our intelligent voice-powered search helps you find scripture even if you don't remember the chapter or verse. Just speak the words you remember and let our AI find the perfect passage for you.
          </p>

          <button
            onClick={() => onAuthClick && onAuthClick('signup')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95 inline-block"
          >
            Try Voice Search
          </button>
        </div>
      </div>
    </section>
  );
};

export default VoiceSearchShowcase;
