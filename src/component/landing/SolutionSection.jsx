import React from 'react';
import { ArrowRight } from 'lucide-react';

const SolutionSection = ({ onAuthClick }) => {

  return (
    <section className="py-20 bg-gradient-to-b from-[var(--bg-main)] via-blue-900/5 to-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left - App Screen Mock */}
          <div className="flex justify-center md:justify-start order-2 md:order-1 animate-in fade-in">
            <div className="relative w-56 h-72">
              {/* Phone frame */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                {/* Screen content */}
                <div className="inset-2 absolute bg-[var(--bg-main)] rounded-2xl p-3 flex flex-col">
                  {/* Header */}
                  <div className="text-center py-3 border-b border-white/10">
                    <div className="text-xs font-semibold text-blue-400">📖 Bible Reader</div>
                  </div>

                  {/* Bible passage */}
                  <div className="flex-1 flex flex-col items-center justify-center px-3 py-4 space-y-3">
                    <div className="text-xs text-blue-400 font-semibold">John 3:16</div>
                    <p className="text-xs text-gray-200 text-center leading-relaxed">
                      "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 px-2 py-3 border-t border-white/10">
                    <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-1 rounded transition">❤️ Like</button>
                    <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-1 rounded transition">💬 Share</button>
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl blur-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 -z-10"></div>
            </div>
          </div>

          {/* Right - Solution Text */}
          <div className="space-y-6 order-1 md:order-2 animate-in fade-in slide-in-from-right">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              A Social Platform Rooted in Scripture
            </h2>

            <div className="space-y-4 text-gray-300">
              <div className="flex gap-3">
                <div className="text-blue-400 font-bold text-xl flex-shrink-0">✓</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Read the Bible Anytime</h3>
                  <p className="text-sm">Access the complete scriptures with intuitive search and reading features.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-blue-400 font-bold text-xl flex-shrink-0">✓</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Search Verses by Speaking Them</h3>
                  <p className="text-sm">Use voice search to find scriptures instantly—even if you don't remember the exact verse.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-blue-400 font-bold text-xl flex-shrink-0">✓</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Share Scriptures Instantly</h3>
                  <p className="text-sm">Inspire others by sharing the words that matter most to you.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-blue-400 font-bold text-xl flex-shrink-0">✓</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Connect with Believers Globally</h3>
                  <p className="text-sm">Join a community of faith-focused individuals dedicated to spiritual growth.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onAuthClick && onAuthClick('signup')}
              className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition transform hover:scale-105 active:scale-95"
            >
              Start Reading Now
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
