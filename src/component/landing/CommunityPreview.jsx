import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const POSTS = [
  {
    id: 1,
    name: 'Sunday D.',
    handle: '@sunday_dev',
    time: '1 hour ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sundayd',
    scripture: 'Commit your way to the Lord; trust in him and he will do this: He will make your righteous reward shine like the dawn.',
    reference: 'Psalm 37:5-6',
    reflection: "Trusting the process isn't always easy, but knowing God is at the helm changes everything. Stay encouraged today.",
    likes: 156,
    comments: 12,
    shares: 28,
  },
  {
    id: 2,
    name: 'Blessing O.',
    handle: '@blessing_o',
    time: '3 hours ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=blessingo',
    reflection: "Just wrapped my 30-day devotional streak on SpringsCircle 🎉 Started this alone, finished with people checking in on me every morning. That's the difference accountability makes.",
    likes: 203,
    comments: 31,
    shares: 9,
  },
  {
    id: 3,
    name: 'Andrew Y.',
    handle: '@andrew_y',
    time: '5 hours ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andrewy',
    scripture: 'And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
    reference: 'Philippians 4:7',
    reflection: "In the middle of a busy week, I'm leaning into this promise. True peace doesn't come from our circumstances, but from His presence.",
    likes: 89,
    comments: 7,
    shares: 14,
  },
];

const CommunityPreview = () => {
  return (
    <section id="community" className="py-24 scroll-mt-20" style={{ background: 'var(--bg-main)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4 text-[var(--primary)] text-[0.7rem] font-semibold tracking-[0.28em] uppercase">
            <span className="w-8 h-px bg-[var(--primary)]/50" />
            Community
            <span className="w-8 h-px bg-[var(--primary)]/50" />
          </div>
          <h2
            className="text-3xl md:text-4xl mb-3 text-white"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Built for believers, by believers
          </h2>
          <p className="text-[var(--text-secondary)]">Real reflections from a growing spiritual community</p>
        </div>

        <div className="space-y-6">
          {POSTS.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl overflow-hidden border border-white/10 hover:border-white/[0.16] transition-colors duration-300"
              style={{ background: 'var(--form-bg)' }}
            >
              <div className="px-6 py-5 flex items-center gap-3 border-b border-white/[0.06]">
                <img
                  src={post.avatar}
                  alt={post.name}
                  className="w-11 h-11 rounded-full flex-shrink-0 ring-2"
                  style={{ '--tw-ring-color': 'rgba(var(--primary-rgb),0.3)' }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-[0.95rem]">{post.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{post.handle} · {post.time}</p>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                {post.scripture && (
                  <div
                    className="relative rounded-xl p-5 pl-6 border"
                    style={{ background: 'var(--story-surface)', borderColor: 'rgba(var(--primary-rgb),0.25)' }}
                  >
                    <span
                      className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
                      style={{ background: 'var(--primary)' }}
                    />
                    <p
                      className="text-[var(--text-secondary)] italic leading-relaxed"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      "{post.scripture}"
                    </p>
                    <p
                      className="text-xs font-semibold mt-3 uppercase tracking-wider"
                      style={{ color: 'var(--primary)' }}
                    >
                      — {post.reference}
                    </p>
                  </div>
                )}
                <p className="text-[var(--text-secondary)] leading-relaxed text-[0.95rem]">
                  {post.reflection}
                </p>
              </div>

              <div className="px-6 py-4 border-t border-white/[0.06] flex gap-6">
                <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--red)] transition-colors duration-200 group">
                  <Heart size={17} className="group-hover:fill-[var(--red)] transition-colors" />
                  <span className="text-sm">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors duration-200">
                  <MessageCircle size={17} />
                  <span className="text-sm">{post.comments}</span>
                </button>
                <button
                  className="flex items-center gap-2 text-[var(--text-muted)] transition-colors duration-200"
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  <Share2 size={17} />
                  <span className="text-sm">{post.shares}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p
            className="text-[var(--text-secondary)] mb-6 italic text-lg"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            "As iron sharpens iron, so one person sharpens another." — Proverbs 27:17
          </p>
          <Link
            to="/community"
            className="inline-block border text-white px-8 py-3 rounded-full transition-all duration-200 hover:-translate-y-0.5"
            style={{ borderColor: 'rgba(var(--primary-rgb),0.35)', background: 'rgba(var(--primary-rgb),0.06)' }}
          >
            View more reflections
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CommunityPreview;