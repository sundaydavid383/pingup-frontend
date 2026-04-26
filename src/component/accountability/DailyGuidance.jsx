import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import './daily-guidance.css';

// Daily motivation and habit prompts
const DAILY_HABITS = [
  { habit: 'Take 5 minutes for reflection', icon: '🧘', category: 'general' },
  { habit: 'Review your top 3 priorities', icon: '📝', category: 'general' },
  { habit: 'Share progress with someone', icon: '👥', category: 'general' },
  { habit: 'Practice mindfulness', icon: '🌟', category: 'general' },
  { habit: 'Check in with your accountability partner', icon: '💬', category: 'general' },
];

const NICHE_HABITS = {
  spiritual: [
    { habit: 'Read a verse or devotion', icon: '🙏', category: 'spiritual' },
    { habit: 'Spend time in prayer', icon: '✝️', category: 'spiritual' },
    { habit: 'Reflect on spiritual growth', icon: '💡', category: 'spiritual' },
  ],
  academic: [
    { habit: 'Study for 25 minutes (Pomodoro)', icon: '⏱️', category: 'academic' },
    { habit: 'Review today\'s learning goals', icon: '📚', category: 'academic' },
    { habit: 'Practice active recall', icon: '🧠', category: 'academic' },
  ],
  fitness: [
    { habit: 'Complete your workout', icon: '💪', category: 'fitness' },
    { habit: 'Drink 8 glasses of water', icon: '💧', category: 'fitness' },
    { habit: 'Take a 10-minute walk', icon: '🚶', category: 'fitness' },
  ],
  leadership: [
    { habit: 'Give meaningful feedback to someone', icon: '💭', category: 'leadership' },
    { habit: 'Mentor someone', icon: '🎯', category: 'leadership' },
    { habit: 'Plan your team\'s priorities', icon: '📋', category: 'leadership' },
  ],
  discipline: [
    { habit: 'Start your morning routine', icon: '🌅', category: 'discipline' },
    { habit: 'Eliminate one distraction', icon: '📵', category: 'discipline' },
    { habit: 'Complete one challenging task', icon: '⚡', category: 'discipline' },
  ],
};

const DAILY_QUOTES = [
  "Consistency is the foundation of greatness.",
  "Small daily actions lead to extraordinary results.",
  "Progress over perfection. Keep moving forward.",
  "Your future self will thank you for today's discipline.",
  "Every moment is a chance to build the life you want.",
];

const DailyGuidance = ({ user }) => {
  const [currentHabit, setCurrentHabit] = useState(null);
  const [currentQuote, setCurrentQuote] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // Get today's habit based on date (so same habit throughout the day)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

    // Prioritize selected niches if available
    let availableHabits = [...DAILY_HABITS];

    if (user?.selectedNiches && user.selectedNiches.length > 0) {
      user.selectedNiches.forEach(niche => {
        if (NICHE_HABITS[niche]) {
          availableHabits = [...availableHabits, ...NICHE_HABITS[niche]];
        }
      });
    }

    const habit = availableHabits[dayOfYear % availableHabits.length];
    const quote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];

    setCurrentHabit(habit);
    setCurrentQuote(quote);
  }, [user?.selectedNiches]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="daily-guidance-card"
    >
      {/* Header */}
      <div className="guidance-header">
        <div className="header-content">
          <div className="header-icon">
            <Sparkles className="icon-sparkle" />
          </div>
          <div>
            <h2 className="guidance-title">Today's Accountability Check-in</h2>
            <p className="guidance-subtitle">
              {user?.selectedNiches?.length > 0
                ? `Focused on: ${user.selectedNiches.map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(', ')}`
                : 'Building your foundation of consistency'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="guidance-content">
        {/* Quote Section */}
        <motion.div
          key={currentQuote}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="quote-section"
        >
          <p className="daily-quote">"{currentQuote}"</p>
          <p className="quote-author">— Springs Connect</p>
        </motion.div>

        {/* Habit of the Day */}
        {currentHabit && (
          <motion.div
            key={currentHabit.habit}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="habit-section"
          >
            <div className="habit-header">
              <span className="habit-label">Your Daily Habit</span>
              <span className="habit-badge">Today</span>
            </div>
            <div className="habit-content">
              <div className="habit-icon">{currentHabit.icon}</div>
              <p className="habit-text">{currentHabit.habit}</p>
            </div>
          </motion.div>
        )}

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-item">
            <div className="stat-icon spiritual">
              <Heart size={18} />
            </div>
            <div className="stat-text">
              <p className="stat-label">Accountability</p>
              <p className="stat-value">Active</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon progress">
              <TrendingUp size={18} />
            </div>
            <div className="stat-text">
              <p className="stat-label">Your Progress</p>
              <p className="stat-value">Keep going</p>
            </div>
          </div>
        </div>

        {/* Encouragement */}
        <motion.div className="encouragement-box">
          <AlertCircle size={18} className="encouragement-icon" />
          <div className="encouragement-text">
            <p className="encouragement-title">Remember</p>
            <p className="encouragement-message">
              Every action today builds momentum for tomorrow. You've got this! 💪
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={() => setShowChat(true)}
            className="btn btn-primary"
          >
            <span>Talk to AI Accountability Coach</span>
            <ChevronRight size={16} />
          </button>
          <button className="btn btn-secondary">
            <span>View Your Plan</span>
          </button>
        </div>

        {/* Placeholder for AI Chat Integration */}
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ai-chat-placeholder"
          >
            <div className="chat-header">
              <h3>AI Accountability Coach</h3>
              <button onClick={() => setShowChat(false)} className="close-btn">✕</button>
            </div>
            <div className="chat-body">
              <div className="chat-message assistant">
                <p>Hi {user?.name}! 👋 How are you doing with your accountability goals today?</p>
              </div>
              <p className="chat-note">💡 AI integration coming soon! This will connect to OpenAI GPT to provide personalized guidance.</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DailyGuidance;
