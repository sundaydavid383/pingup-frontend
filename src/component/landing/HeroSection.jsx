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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[var(--inverse-dark-indigo-gradient)]">
      <div className="w-full h-full flex flex-col md:flex-row">

        {/* -------- LEFT SIDE (Hero + Stats) -------- */}
        <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left text-white relative overflow-hidden p-6 sm:p-10 md:p-12 lg:p-20 min-h-[70vh] md:min-h-screen">
          
          {/* Radial highlight */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--radial-highlight)] to-transparent opacity-40 pointer-events-none"></div>

          {/* Hero headline */}
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight bg-gradient-to-r from-white via-[var(--primary)] to-white bg-clip-text text-transparent mb-4">
           More than just friends-truly connect
          </h1>

          <p className="text-white/80 md:text-lg mb-8 max-w-md">
           Search Bible verses by text or voice, share scriptures, and engage with a spiritual community in real time.
          </p>

          {/* Real-time stats / icons */}
          <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Users size={24} className="text-[var(--primary)]" />
               <UserStats />
            </div>
            <div className="flex items-center gap-2">
              <Activity size={24} className="text-[var(--primary)]" />
              <span>Realtime Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={24} className="text-[var(--primary)]" />
              <span>Instant Notifications</span>
            </div>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex gap-4">
            <button
              onClick={() => handleAuthClick('signup')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95"
            >
              Join Free
            </button>
            <button className="border border-white/30 hover:border-white/60 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition">
              <Play size={18} />
              Explore
            </button>
          </div>

          {/* 
          <div className="flex justify-center md:justify-start items-center gap-3 mt-8">
            <div className="flex -space-x-3">
              {[assets.user2, assets.user1, assets.user3].map((src, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--primary)] overflow-hidden animate-bounce">
                  <img src={src} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <UserStats />
          </div>
           */}
        </div>

        {/* -------- RIGHT SIDE (App Preview) -------- */}
        <div className="flex-1 hidden md:flex justify-center items-center order-2 bg-black/20 backdrop-blur-sm border-l border-white/5 animate-in fade-in slide-in-from-right duration-1000">
          <div className="relative w-72 h-[550px]">
            <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl border-[6px] border-gray-800 overflow-hidden">
              <div className="inset-0 absolute bg-[var(--bg-main)] flex flex-col">
                <div className="h-8 pt-4 px-6 flex justify-between items-center text-[10px] text-gray-400">
                  <span className="font-bold">9:41</span>
                  <div className="flex gap-1">
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-hidden">
                  <div className="h-6 w-24 bg-[var(--inverse-dark-indigo-gradient)] rounded-full mb-4 opacity-50"></div>
                 {/* Post card 1 */}
<div className="bg-white/5 rounded-xl p-3 border border-white/10">
  <div className="flex gap-2 mb-2">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--hover-dark)]"></div>
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

{/* Post card 2  */}
<div className="bg-white/5 rounded-xl p-3 border border-white/10 opacity-90">
  <div className="flex gap-2 mb-2">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600"></div>
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
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500"></div>
    <div className="flex-1 text-[10px]">
      <div className="text-white font-semibold">Blessing O.</div>
      <div className="text-gray-500">6 hours ago</div>
    </div>
  </div>
  <div className="text-xs text-gray-300">Just finished the morning devotional! ✨</div>
</div>
                  <div className="mt-auto bg-[var(--primary)]/10 rounded-xl p-3 border border-[var(--primary)]/30 text-center">
                    <div className="text-[10px] text-[var(--primary)] font-medium flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-pulse"></div>
                      Listening...
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[var(--primary)] blur-[60px] opacity-20"></div>
          </div>
        </div>

        {/* Mobile CTA Section */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white text-center">Where Faith Meets Community.</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleAuthClick('signup')}
                className="bg-[var(--primary)] hover:brightness-110 text-white px-6 py-4 rounded-xl font-bold transition transform active:scale-95"
              >
                Join Free
              </button>
              <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                <Play size={18} fill="currentColor" />
                Explore
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
