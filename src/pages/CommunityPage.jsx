import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Users, Mic, TrendingUp } from 'lucide-react';
import LandingNavbar from '../component/landing/LandingNavbar';
import LandingFooter from '../component/landing/Footer';
import AuthModal from '../component/landing/AuthModal';

const CommunityPage = () => {
  const [authMode, setAuthMode] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const handleAuthClick = (tab = 'login') => {
    setAuthMode(tab);
  };

  // Sample post data
  const samplePosts = [
    {
      id: 1,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=johnd',
      username: 'John D.',
      timestamp: '2 hours ago',
      content: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16',
      likes: 234,
      comments: 18,
      shares: 42,
    },
    {
      id: 2,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarahm',
      username: 'Sarah M.',
      timestamp: '4 hours ago',
      content: 'Started a prayer circle for our community this morning. The presence of the Holy Spirit was so powerful! Who wants to join us?',
      likes: 156,
      comments: 31,
      shares: 22,
    },
    {
      id: 3,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michaelt',
      username: 'Michael T.',
      timestamp: '6 hours ago',
      content: 'Daily devotional reflection: "Trust in the Lord with all your heart" - Proverbs 3:5. Today I learned to let go of my worries.',
      likes: 89,
      comments: 12,
      shares: 15,
    },
  ];

  const postCard = (post) => (
    <div key={post.id} className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition duration-300 hover:shadow-lg hover:shadow-blue-500/10 p-6">
      {/* Post Header */}
      <div className="flex gap-3 mb-4">
        <img 
          src={post.avatar} 
          alt={post.username}
          className="w-12 h-12 rounded-full flex-shrink-0"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-white">{post.username}</h3>
          <p className="text-sm text-gray-400">{post.timestamp}</p>
        </div>
      </div>

      {/* Post Content */}
      <p className="text-gray-200 mb-4 leading-relaxed">{post.content}</p>

      {/* Post Actions */}
      <div className="flex gap-6 text-gray-400 pt-4 border-t border-white/5">
        <button className="flex items-center gap-2 hover:text-red-400 transition group">
          <Heart size={18} className="group-hover:fill-red-400" />
          <span className="text-sm">{post.likes}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-400 transition">
          <MessageCircle size={18} />
          <span className="text-sm">{post.comments}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-400 transition">
          <Share2 size={18} />
          <span className="text-sm">{post.shares}</span>
        </button>
      </div>
    </div>
  );

  const handleCloseAuth = () => {
    setAuthMode(null);
  };

  return (
    <div className="bg-[var(--bg-main)] text-white min-h-screen">
      {authMode && <AuthModal mode={authMode} onClose={handleCloseAuth} />}
      <LandingNavbar onAuthClick={handleAuthClick} />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-900/20 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Connect, Share & Grow Spiritually
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Search Bible verses by text or voice, engage with a spiritual community, and discover meaningful connections with believers worldwide.
          </p>
          <button
            onClick={() => handleAuthClick('signup')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95"
          >
            Join a Circle
          </button>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-white/10 sticky top-16 z-40 bg-[var(--bg-main)]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                activeTab === 'all'
                  ? 'text-blue-400 border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setActiveTab('circles')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                activeTab === 'circles'
                  ? 'text-blue-400 border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              My Circles
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                activeTab === 'trending'
                  ? 'text-blue-400 border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Trending
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Feed */}
          <div className="md:col-span-2 space-y-6">
            {samplePosts.map(postCard)}
          </div>

          {/* Sidebar */}
          <div className="hidden md:flex flex-col gap-6">
            {/* Voice Search Widget */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Mic className="text-blue-400" size={20} />
                <h3 className="font-semibold">Voice Search</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">Search Bible verses by speaking the text you remember.</p>
              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 rounded-lg font-semibold text-sm transition">
                Try It Now
              </button>
            </div>

            {/* Active Users */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="text-blue-400" size={20} />
                <h3 className="font-semibold">Active Members</h3>
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-2">5,234</div>
              <p className="text-sm text-gray-400">believers online now</p>
            </div>

            {/* Top Contributors */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-blue-400" size={20} />
                <h3 className="font-semibold">Top Contributors</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Pastor James', posts: 342 },
                  { name: 'Maria Santos', posts: 287 },
                  { name: 'David Lee', posts: 256 },
                ].map((contributor, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0">
                    <span className="text-sm">{contributor.name}</span>
                    <span className="text-xs text-blue-400 font-semibold">{contributor.posts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <button
            onClick={() => handleAuthClick('signup')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105 active:scale-95 inline-block mb-4"
          >
            Create a Circle
          </button>
          <p className="text-gray-300 text-lg">
            Share scripture. Connect spiritually.
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default CommunityPage;
