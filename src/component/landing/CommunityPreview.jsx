import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const CommunityPreview = () => {
  const posts = [
    {
      id: 1,
      name: "Sunday D.",
      handle: "@sunday_dev",
      time: "1 hour ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sundayd",
      themeColor: "from-orange-500/10 to-red-600/10",
      borderColor: "border-orange-500/30",
      accentText: "text-orange-400",
      scripture: "Commit your way to the Lord; trust in him and he will do this: He will make your righteous reward shine like the dawn.",
      reference: "Psalm 37:5-6",
      reflection: "Trusting the process isn't always easy, but knowing God is at the helm changes everything. Stay encouraged today! 🙌✨",
      likes: 156,
      comments: 12,
      shares: 28
    },
    {
      id: 2,
      name: "Andrew Y.",
      handle: "@andrew_y",
      time: "5 hours ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=andrewy",
      themeColor: "from-purple-500/10 to-indigo-600/10",
      borderColor: "border-purple-500/30",
      accentText: "text-purple-400",
      scripture: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
      reference: "Philippians 4:7",
      reflection: "In the middle of a busy week, I'm leaning into this promise. True peace doesn't come from our circumstances, but from His presence. 🙏💜",
      likes: 89,
      comments: 7,
      shares: 14
    },
   
  ];

  return (
    <section id="community" className="py-20 bg-[var(--bg-main)] scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Built for Believers, by Believers
          </h2>
          <p className="text-gray-400">Join a growing spiritual community</p>
        </div>

        {/* Feed Container */}
        <div className="space-y-8">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition duration-300"
            >
              {/* Post Header */}
              <div className="p-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                  <img 
                    src={post.avatar} 
                    alt={post.name}
                    className="w-12 h-12 rounded-full flex-shrink-0 shadow-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{post.name}</h3>
                    <p className="text-sm text-gray-400">{post.handle} • {post.time}</p>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-6 py-4 space-y-4">
                <div className={`bg-gradient-to-r ${post.themeColor} border ${post.borderColor} rounded-xl p-5`}>
                  <p className="text-gray-200 italic leading-relaxed">
                    "{post.scripture}"
                  </p>
                  <p className={`text-xs ${post.accentText} font-bold mt-3 uppercase tracking-wider`}>
                    — {post.reference}
                  </p>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {post.reflection}
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-white/5 flex gap-6 text-gray-400">
                <button className="flex items-center gap-2 hover:text-red-400 transition group">
                  <Heart size={18} className="group-hover:fill-red-400" />
                  <span className="text-sm">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-blue-400 transition">
                  <MessageCircle size={18} />
                  <span className="text-sm">{post.comments}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-green-400 transition">
                  <Share2 size={18} />
                  <span className="text-sm">{post.shares}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-6 italic">
            "For where two or three gather in my name, there am I with them." — Matthew 18:20
          </p>
          <Link to="/community" className="inline-block bg-white/5 border border-white/10 text-white px-8 py-3 rounded-full hover:bg-white/10 transition">
            View More Reflections
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CommunityPreview;