import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiClock,
  FiClipboard,
  FiFlag,
  FiHeart,
  FiList,
  FiMessageSquare,
  FiStar,
  FiSun,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiX,
  FiZap,
  FiShield,
  FiActivity,
  FiBookOpen,
  FiCalendar,
  FiInfo,
} from 'react-icons/fi';
import './daily-guidance.css';

const DAILY_HABITS = [
  { habit: 'Take 5 minutes for reflection',             Icon: FiClock,         category: 'general' },
  { habit: 'Review your top 3 priorities',              Icon: FiList,          category: 'general' },
  { habit: 'Share progress with someone',               Icon: FiUsers,         category: 'general' },
  { habit: 'Practice mindfulness',                      Icon: FiStar,          category: 'general' },
  { habit: 'Check in with your accountability partner', Icon: FiMessageSquare, category: 'general' },
];

const NICHE_HABITS = {
  spiritual:  [
    { habit: 'Read a verse or devotion',    Icon: FiBookOpen, category: 'spiritual' },
    { habit: 'Spend time in prayer',        Icon: FiHeart,    category: 'spiritual' },
    { habit: 'Reflect on spiritual growth', Icon: FiZap,      category: 'spiritual' },
  ],
  academic:   [
    { habit: 'Study for 25 minutes (Pomodoro)', Icon: FiClock,     category: 'academic' },
    { habit: "Review today's learning goals",   Icon: FiClipboard, category: 'academic' },
    { habit: 'Practice active recall',          Icon: FiTarget,    category: 'academic' },
  ],
  fitness:    [
    { habit: 'Complete your workout',    Icon: FiActivity, category: 'fitness' },
    { habit: 'Drink 8 glasses of water', Icon: FiFlag,     category: 'fitness' },
    { habit: 'Take a 10-minute walk',    Icon: FiClock,    category: 'fitness' },
  ],
  leadership: [
    { habit: 'Give meaningful feedback to someone', Icon: FiUsers,     category: 'leadership' },
    { habit: 'Mentor someone',                      Icon: FiTarget,    category: 'leadership' },
    { habit: "Plan your team's priorities",         Icon: FiClipboard, category: 'leadership' },
  ],
  discipline: [
    { habit: 'Start your morning routine',    Icon: FiSun,         category: 'discipline' },
    { habit: 'Eliminate one distraction',     Icon: FiShield,      category: 'discipline' },
    { habit: 'Complete one challenging task', Icon: FiCheckCircle, category: 'discipline' },
  ],
};

const DAILY_QUOTES = [
  'Consistency is the foundation of greatness.',
  'Small daily actions lead to extraordinary results.',
  'Progress over perfection. Keep moving forward.',
  "Your future self will thank you for today's discipline.",
  'Every moment is a chance to build the life you want.',
];

const DAY_LABEL = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
});

const DailyGuidance = ({ user }) => {
  const [currentHabit, setCurrentHabit] = useState(null);
  const [currentQuote, setCurrentQuote]  = useState('');
  const [expanded, setExpanded]          = useState(false);
  const [showChat, setShowChat]          = useState(false);

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );
    let available = [...DAILY_HABITS];
    if (user?.selectedNiches?.length > 0) {
      user.selectedNiches.forEach((n) => {
        if (NICHE_HABITS[n]) available = [...available, ...NICHE_HABITS[n]];
      });
    }
    setCurrentHabit(available[dayOfYear % available.length]);
    setCurrentQuote(DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]);
  }, [user?.selectedNiches]);

  const nicheCount = user?.selectedNiches?.length || 0;

  return (
    <motion.div
      className="dg-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ══ Gradient header ══ */}
      <div className="dg-header">
        {/* Decorative orb */}
        <div className="dg-header-orb" aria-hidden="true" />

        <div className="dg-header-inner">
          <div className="dg-header-left">
            <div className="dg-logo-wrap" aria-hidden="true">
              <FiStar size={18} />
            </div>
            <div className="dg-header-meta">
              <h2 className="dg-header-title">Accountability Check-in</h2>
              <div className="dg-header-date">
                <FiCalendar size={11} aria-hidden="true" />
                <span>{DAY_LABEL}</span>
              </div>
            </div>
          </div>

          <div className="dg-header-right">
            {nicheCount > 0 && (
              <span className="dg-chip">
                {nicheCount} focus area{nicheCount > 1 ? 's' : ''}
              </span>
            )}
            <button
              type="button"
              className="dg-toggle-btn"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              <span>{expanded ? 'Collapse' : 'Expand'}</span>
            </button>
          </div>
        </div>

        {/* Preview strip inside header */}
        <button
          type="button"
          className="dg-preview-strip"
          onClick={() => setExpanded((v) => !v)}
          aria-label="Toggle check-in details"
        >
          {currentHabit && (
            <span className="dg-preview-habit-pill">
              <currentHabit.Icon size={11} aria-hidden="true" />
              {currentHabit.habit}
            </span>
          )}
          <span className="dg-preview-quote-text">"{currentQuote}"</span>
        </button>
      </div>

      {/* ══ Collapsible body ══ */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="dg-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="dg-body">

              {/* ── Quote ── */}
              <motion.div
                key={currentQuote}
                className="dg-quote"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: 0.05 }}
              >
                <div className="dg-quote-left" aria-hidden="true">
                  <FiStar size={13} />
                </div>
                <div className="dg-quote-right">
                  <p className="dg-quote-text">"{currentQuote}"</p>
                  <span className="dg-quote-by">— Springs Connect</span>
                </div>
              </motion.div>

              {/* ── Habit + Stats grid ── */}
              <div className="dg-two-col">

                {/* Habit */}
                {currentHabit && (
                  <motion.div
                    key={currentHabit.habit}
                    className="dg-habit"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: 0.09 }}
                  >
                    <div className="dg-habit-header">
                      <span className="dg-eyebrow">Daily habit</span>
                      <span className="dg-badge-today">Today</span>
                    </div>
                    <div className="dg-habit-body">
                      <div className="dg-habit-icon-box" aria-hidden="true">
                        <currentHabit.Icon size={19} />
                      </div>
                      <p className="dg-habit-label">{currentHabit.habit}</p>
                    </div>
                  </motion.div>
                )}

                {/* Stats */}
                <div className="dg-stats">
                  <div className="dg-stat">
                    <div className="dg-stat-icon-wrap" aria-hidden="true">
                      <FiHeart size={14} />
                    </div>
                    <div>
                      <p className="dg-stat-name">Accountability</p>
                      <p className="dg-stat-val">Active</p>
                    </div>
                  </div>
                  <div className="dg-divider" aria-hidden="true" />
                  <div className="dg-stat">
                    <div className="dg-stat-icon-wrap" aria-hidden="true">
                      <FiTrendingUp size={14} />
                    </div>
                    <div>
                      <p className="dg-stat-name">Progress</p>
                      <p className="dg-stat-val">Keep going</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── Encouragement banner ── */}
              <div className="dg-banner">
                <div className="dg-banner-icon" aria-hidden="true">
                  <FiInfo size={14} />
                </div>
                <p className="dg-banner-text">
                  Every action today builds momentum for tomorrow.{' '}
                  <strong>You've got this!</strong>
                </p>
              </div>

              {/* ── CTA row ── */}
              <div className="dg-cta-row">
                <button
                  type="button"
                  className="dg-btn-primary"
                  onClick={() => setShowChat((v) => !v)}
                >
                  <FiMessageSquare size={14} aria-hidden="true" />
                  <span>Talk to AI Coach</span>
                  <FiArrowRight size={13} aria-hidden="true" />
                </button>
                <button type="button" className="dg-btn-outline">
                  <span>View Your Plan</span>
                  <FiArrowRight size={13} aria-hidden="true" />
                </button>
              </div>

              {/* ── Chat panel ── */}
              <AnimatePresence>
                {showChat && (
                  <motion.div
                    key="chat"
                    className="dg-chat"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="dg-chat-topbar">
                      <div className="dg-chat-topbar-left">
                        <span className="dg-online-dot" aria-hidden="true" />
                        <span className="dg-chat-name">AI Accountability Coach</span>
                      </div>
                      <button
                        type="button"
                        className="dg-chat-close"
                        aria-label="Close chat"
                        onClick={() => setShowChat(false)}
                      >
                        <FiX size={13} />
                      </button>
                    </div>
                    <div className="dg-chat-body">
                      <div className="dg-chat-bubble">
                        Hi {user?.name || 'there'}! How are you doing with your accountability goals today?
                      </div>
                      <p className="dg-chat-note">
                        AI coaching coming soon — powered by your personalised plan.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DailyGuidance;
