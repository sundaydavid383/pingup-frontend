// FILE: src/component/landing/HeroSection.jsx  // Landing page only — fixed mobile gap + overall spacing polish

import React from 'react';
import { Play, Users, Activity, Clock } from 'lucide-react';
import assets from '../../assets/assets';
import UserStats from '../UserStats';

const HeroSection = ({ onAuthClick }) => {
  const handleAuthClick = (tab = 'signup') => {
    if (onAuthClick) {
      onAuthClick(tab);
    }
  };

  return (
<section 
  className="
    relative flex items-center 
    bg-[var(--inverse-dark-indigo-gradient)] 
    overflow-hidden 
    lg:max-h-screen
  "
>
  <div className="w-full mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 h-full">
    <div className="
      flex flex-col lg:flex-row 
      items-center lg:items-start 
      gap-10 lg:gap-16 
      py-10 sm:py-12 lg:py-16
      lg:h-full lg:max-h-[90vh]
    ">

      {/* -------- LEFT SIDE (Hero + Stats) -------- */}
      <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left text-white max-w-2xl lg:min-h-0">
        {/* Radial highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--radial-highlight)] to-transparent opacity-40 pointer-events-none lg:opacity-50"></div>

        {/* Hero headline */}
        <h1 className="
          text-4xl sm:text-5xl lg:text-6xl 
          font-extrabold leading-tight sm:leading-snug 
          bg-gradient-to-r from-white via-[var(--primary)] to-white 
          bg-clip-text text-transparent 
          mb-4 sm:mb-6 
          break-words hyphens-auto
          max-w-[90vw] sm:max-w-none
        ">
          More than just friends — truly connect
        </h1>

        <p className="text-white/80 text-base sm:text-lg mb-6 sm:mb-8 max-w-md lg:max-w-lg">
          Search Bible verses by text or voice, share scriptures, and engage with a spiritual community in real time.
        </p>

        {/* Real-time stats / icons */}
        <div className="flex flex-wrap justify-center lg:justify-start gap-5 sm:gap-7 mb-7 sm:mb-10">
          <div className="flex items-center gap-2.5">
            <Users size={26} className="text-[var(--primary)] flex-shrink-0" />
            <UserStats />
          </div>
          <div className="flex items-center gap-2.5">
            <Activity size={26} className="text-[var(--primary)] flex-shrink-0" />
            <span>Realtime Updates</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock size={26} className="text-[var(--primary)] flex-shrink-0" />
            <span>Instant Notifications</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          <button
            onClick={() => handleAuthClick('signup')}
            className="
              bg-gradient-to-r from-blue-500 to-purple-600 
              hover:from-blue-600 hover:to-purple-700 
              text-white px-8 py-3.5 sm:py-4 
              rounded-xl font-semibold 
              transition-all duration-200 
              transform hover:scale-105 active:scale-95 
              shadow-lg shadow-blue-500/30
              w-full sm:w-auto text-center
            "
          >
            Join Free
          </button>

          <button className="
            border border-white/40 hover:border-white/70 
            text-white px-7 py-3.5 sm:py-4 
            rounded-xl font-semibold 
            flex items-center justify-center gap-2.5 
            transition-all duration-200 
            backdrop-blur-sm
            w-full sm:w-auto
          ">
            <Play size={18} />
            Explore
          </button>
        </div>
      </div>

      {/* -------- RIGHT SIDE (App Preview) -------- */}
      <div className="flex-1 hidden sm:flex justify-center lg:justify-end items-center order-last lg:order-none lg:self-stretch">
        <div className="relative w-70 sm:w-96 lg:w-[27rem] xl:w-[23rem] h-[580px] sm:h-[640px] lg:h-[620px] xl:h-[660px] max-h-[85vh]">
          <div className="absolute inset-0 bg-gray-900 rounded-[3.5rem] sm:rounded-[4rem] shadow-2xl border-[8px] border-gray-800 overflow-hidden">
            <div className="absolute inset-0 bg-[var(--bg-main)] flex flex-col">
              {/* Status bar */}
              <div className="h-9 pt-4 px-6 sm:px-8 flex justify-between items-center text-xs text-gray-400">
                <span className="font-bold">9:41</span>
                <div className="flex gap-1.5">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto scrollbar-thin">
                {/* Post card 1 */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--hover-dark)] flex-shrink-0"></div>
                    <div className="flex-1 text-[10px]">
                      <div className="text-white font-semibold">Sunday D.</div>
                      <div className="text-gray-500">2 hours ago</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 leading-relaxed">
                    "For God so loved the world..." <br/> 
                    <span className="text-[var(--primary)]">— John 3:16</span>
                  </div>
                </div>

                {/* Post card 2 */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 opacity-90">
                  <div className="flex gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex-shrink-0"></div>
                    <div className="flex-1 text-[10px]">
                      <div className="text-white font-semibold">Andrew Y.</div>
                      <div className="text-gray-500">4 hours ago</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300">Daily prayer reflection 🙏</div>
                </div>

                {/* Post card 3 */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 opacity-60">
                  <div className="flex gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0"></div>
                    <div className="flex-1 text-[10px]">
                      <div className="text-white font-semibold">Blessing O.</div>
                      <div className="text-gray-500">6 hours ago</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300">Just finished the morning devotional! ✨</div>
                </div>

                {/* Bottom listening bar */}
                <div className="mt-auto bg-[var(--primary)]/10 rounded-xl p-3 border border-[var(--primary)]/30 text-center">
                  <div className="text-[10px] text-[var(--primary)] font-medium flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-pulse"></div>
                    Listening...
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[var(--primary)] blur-[80px] opacity-20"></div>
        </div>
      </div>

    </div>
  </div>
</section>
  );
};

export default HeroSection;
