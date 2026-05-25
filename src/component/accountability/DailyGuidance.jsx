import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight, FiChevronDown, FiChevronUp,
  FiCheckCircle, FiClock, FiClipboard, FiFlag,
  FiHeart, FiList, FiMessageSquare, FiStar,
  FiSun, FiTarget, FiTrendingUp, FiUsers, FiX,
  FiZap, FiShield, FiActivity, FiBookOpen,
  FiCalendar, FiInfo, FiGrid, FiUserCheck,
  FiChevronRight,
} from 'react-icons/fi';
import './styles/daily-guidance.css';

import TaskTable from './TaskTable';
import ReflectionMode from './ReflectionMode';
import CheckInModal from './CheckInModal';
import TaskReminderModal, { TRUSTED_CONNECTIONS } from "./TaskReminderModal";
import { DUMMY_TASKS, CATEGORY_META } from '../../data/dummyData';

// ─── Static data ──────────────────────────────────────────────────────────────

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

// helpers
const pad = (n) => String(n).padStart(2, '0');
const toMin = (s) => {
  if (!s || typeof s !== 'string' || !s.includes(':')) return -1;
  const [h, m] = s.split(':').map(Number);
  return isNaN(h) || isNaN(m) ? -1 : h * 60 + m;
};

// ─── Component ────────────────────────────────────────────────────────────────

const DailyGuidance = ({ user }) => {
  const [currentHabit, setCurrentHabit] = useState(null);
  const [currentQuote, setCurrentQuote] = useState('');
  const [expanded, setExpanded]         = useState(false);
  const [showChat, setShowChat]         = useState(false);
  const [showConnections, setShowConnections] = useState(false);

  // Task state
  const [tasks, setTasks] = useState(DUMMY_TASKS);

  // Panel / modal visibility
  const [showTaskTable, setShowTaskTable]   = useState(false);
  const [reflectionTask, setReflectionTask] = useState(null);
  const [checkInTask, setCheckInTask]       = useState(null);

  // Reminder modal
  const [reminderTask, setReminderTask]     = useState(null);
  const firedReminders = useRef(new Set()); // track which task ids we already fired today

  // Connections
  const [connections, setConnections] = useState(TRUSTED_CONNECTIONS);

  // ── Seeded habit/quote ──
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

  // ── Clock-based reminder trigger ──
  // Every 30 seconds, check if any task's time matches "now" within a 1-minute window
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();

      const due = tasks.find((t) => {
        if (t.status === 'completed') return false;
        if (firedReminders.current.has(t.id)) return false;
        const tMin = toMin(t.time);
        if (tMin < 0) return false;
        // fire reminder when we're within 0–2 minutes of task time
        return currentMin >= tMin && currentMin <= tMin + 2;
      });

      if (due && !reminderTask) {
        firedReminders.current.add(due.id);
        setReminderTask(due);
      }
    };

    check(); // run immediately
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [tasks, reminderTask]);

  // ── Derived stats ──
  const nicheCount     = user?.selectedNiches?.length || 0;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalTasks     = tasks.length;
  const pendingCount   = tasks.filter(t => t.status === 'pending').length;

  // ── Handlers ──
  const handleToggleStatus = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const cycle = { pending: 'in-progress', 'in-progress': 'completed', completed: 'pending' };
      return { ...t, status: cycle[t.status] || 'pending' };
    }));
  };

  const handleReflectionComplete = () => {
    if (reflectionTask) {
      setTasks(prev => prev.map(t =>
        t.id === reflectionTask.id ? { ...t, status: 'completed' } : t
      ));
    }
    setTimeout(() => setReflectionTask(null), 300);
  };

  const handleCheckInComplete = () => {
    if (checkInTask) {
      setTasks(prev => prev.map(t =>
        t.id === checkInTask.id ? { ...t, status: 'completed' } : t
      ));
    }
    setTimeout(() => setCheckInTask(null), 300);
  };

  const handleReminderMarkDone = (taskId) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'completed' } : t
    ));
  };

  const handleNotifySent = (taskId, connectionId) => {
    // Mark connection as notified in local state
    setConnections(prev => prev.map(c =>
      c.id === connectionId ? { ...c, notified: true } : c
    ));
    // In production: fire a real push notification / SMS / in-app message here
    console.log(`[Accountability] Notifying connection ${connectionId} about task ${taskId}`);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <motion.div
        className="dg-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* ══ Gradient header ══ */}
        <div className="dg-header">
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

          {/* Preview strip */}
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
                  <div className="dg-quote-left" aria-hidden="true"><FiStar size={13} /></div>
                  <div className="dg-quote-right">
                    <p className="dg-quote-text">"{currentQuote}"</p>
                    <span className="dg-quote-by">— Springs Connect</span>
                  </div>
                </motion.div>

                {/* ── Today's progress summary ── */}
                <div className="dg-task-summary">
                  <div className="dg-ts-item">
                    <span className="dg-ts-val dg-ts-val--done">{completedCount}</span>
                    <span className="dg-ts-label">Done</span>
                  </div>
                  <div className="dg-ts-divider" />
                  <div className="dg-ts-item">
                    <span className="dg-ts-val">{pendingCount}</span>
                    <span className="dg-ts-label">Pending</span>
                  </div>
                  <div className="dg-ts-divider" />
                  <div className="dg-ts-item">
                    <span className="dg-ts-val">{totalTasks}</span>
                    <span className="dg-ts-label">Total</span>
                  </div>
                </div>

                {/* ── Habit + Stats grid ── */}
                <div className="dg-two-col">
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

                  <div className="dg-stats">
                    <div className="dg-stat">
                      <div className="dg-stat-icon-wrap" aria-hidden="true"><FiHeart size={14} /></div>
                      <div>
                        <p className="dg-stat-name">Accountability</p>
                        <p className="dg-stat-val">Active</p>
                      </div>
                    </div>
                    <div className="dg-divider" aria-hidden="true" />
                    <div className="dg-stat">
                      <div className="dg-stat-icon-wrap" aria-hidden="true"><FiTrendingUp size={14} /></div>
                      <div>
                        <p className="dg-stat-name">Progress</p>
                        <p className="dg-stat-val">{completedCount}/{totalTasks} tasks</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Trusted Connections panel ── */}
                <div className="dg-connections-wrap">
                  <button
                    type="button"
                    className="dg-connections-toggle"
                    onClick={() => setShowConnections(v => !v)}
                  >
                    <div className="dg-ct-left">
                      <div className="dg-ct-avatars">
                        {connections.slice(0, 3).map((c) => (
                          <div
                            key={c.id}
                            className="dg-ct-avatar"
                            style={{ background: c.colorBg, color: c.color }}
                            title={c.name}
                          >
                            {c.initials}
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="dg-ct-title">Trusted Connections</p>
                        <p className="dg-ct-sub">{connections.length} people keeping you accountable</p>
                      </div>
                    </div>
                    <FiChevronRight
                      size={15}
                      className="dg-ct-arrow"
                      style={{ transform: showConnections ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
                    />
                  </button>

                  <AnimatePresence>
                    {showConnections && (
                      <motion.div
                        key="connections-list"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="dg-connections-list">
                          {connections.map((c, i) => (
                            <motion.div
                              key={c.id}
                              className="dg-connection-row"
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <div
                                className="dg-conn-avatar"
                                style={{ background: c.colorBg, color: c.color }}
                              >
                                {c.initials}
                              </div>
                              <div className="dg-conn-info">
                                <span className="dg-conn-name">{c.name}</span>
                                <span className="dg-conn-role">{c.role}</span>
                              </div>
                              {c.notified && (
                                <span className="dg-conn-notified">
                                  <FiUserCheck size={11} /> Notified
                                </span>
                              )}
                              <div className="dg-conn-dot" style={{ background: c.color }} />
                            </motion.div>
                          ))}
                          <p className="dg-connections-note">
                            These people will be notified if you skip a task and choose "just lazy" during your check-in.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Encouragement banner ── */}
                <div className="dg-banner">
                  <div className="dg-banner-icon" aria-hidden="true"><FiInfo size={14} /></div>
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

                  <button
                    type="button"
                    className="dg-btn-plan"
                    onClick={() => setShowTaskTable(true)}
                  >
                    <FiGrid size={14} aria-hidden="true" />
                    <span>View Today's Plan</span>
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

      {/* ══ OVERLAYS ══ */}

      {/* Task Table drawer */}
      <AnimatePresence>
        {showTaskTable && (
          <TaskTable
            tasks={tasks}
            onClose={() => setShowTaskTable(false)}
            onToggleStatus={handleToggleStatus}
            onStartReflect={(task) => { setShowTaskTable(false); setReflectionTask(task); }}
            onStartCheckIn={(task) => { setShowTaskTable(false); setCheckInTask(task); }}
          />
        )}
      </AnimatePresence>

      {/* Reflection */}
      <AnimatePresence>
        {reflectionTask && (
          <ReflectionMode
            task={reflectionTask}
            onClose={() => setReflectionTask(null)}
            onComplete={handleReflectionComplete}
          />
        )}
      </AnimatePresence>

      {/* Check-in */}
      <AnimatePresence>
        {checkInTask && (
          <CheckInModal
            task={checkInTask}
            onClose={() => setCheckInTask(null)}
            onComplete={handleCheckInComplete}
          />
        )}
      </AnimatePresence>

      {/* ── TASK REMINDER MODAL (clock-triggered) ── */}
      <AnimatePresence>
        {reminderTask && (
          <TaskReminderModal
            task={reminderTask}
            connections={connections}
            onClose={() => setReminderTask(null)}
            onMarkDone={handleReminderMarkDone}
            onNotifySent={handleNotifySent}
          />
        )}
      </AnimatePresence>

      {/* Extra styles */}
      <style>{`
        .dg-task-summary {
          display: flex;
          align-items: center;
          background: rgba(59,92,203,0.04);
          border: 1px solid rgba(59,92,203,0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        .dg-ts-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.65rem 0.5rem;
          gap: 2px;
        }
        .dg-ts-val {
          font-size: 20px;
          font-weight: 800;
          color: var(--ob-header-h1);
          line-height: 1;
        }
        .dg-ts-val--done { color: var(--success); }
        .dg-ts-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .dg-ts-divider {
          width: 1px;
          height: 36px;
          background: rgba(59,92,203,0.1);
          flex-shrink: 0;
        }

        /* ── TRUSTED CONNECTIONS ── */
        .dg-connections-wrap {
          border: 1px solid var(--ob-mesh-1);
          border-radius: 14px;
          overflow: hidden;
          background: var(--white);
        }
        .dg-connections-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: .75rem 1rem;
          background: transparent;
          border: none;
          cursor: pointer;
          gap: 10px;
          transition: background .15s;
        }
        .dg-connections-toggle:hover { background: var(--ob-surface); }
        .dg-ct-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dg-ct-avatars {
          display: flex;
          align-items: center;
        }
        .dg-ct-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
          margin-left: -6px;
          border: 2px solid var(--white);
          flex-shrink: 0;
        }
        .dg-ct-avatar:first-child { margin-left: 0; }
        .dg-ct-title {
          font-size: 13px; font-weight: 700;
          color: var(--ob-header-h1); margin: 0 0 2px; text-align: left;
        }
        .dg-ct-sub {
          font-size: 11px; color: var(--text-secondary); margin: 0; text-align: left;
        }
        .dg-ct-arrow { color: var(--text-secondary); flex-shrink: 0; }

        .dg-connections-list {
          padding: .5rem 1rem 1rem;
          display: flex; flex-direction: column; gap: 6px;
          border-top: 1px solid var(--ob-mesh-1);
        }
        .dg-connection-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: .55rem .7rem;
          background: var(--ob-surface);
          border-radius: 11px;
        }
        .dg-conn-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          flex-shrink: 0;
        }
        .dg-conn-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
        .dg-conn-name { font-size: 13px; font-weight: 700; color: var(--ob-header-h1); }
        .dg-conn-role { font-size: 11px; color: var(--text-secondary); }
        .dg-conn-notified {
          display: flex; align-items: center; gap: 3px;
          font-size: 10px; font-weight: 700;
          color: var(--success);
          background: rgba(16,185,129,.1);
          border-radius: 99px;
          padding: 2px 7px;
          flex-shrink: 0;
        }
        .dg-conn-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          opacity: .7;
        }
        .dg-connections-note {
          font-size: 10px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 4px 0 0;
          padding: .5rem .7rem;
          background: rgba(59,92,203,.04);
          border-radius: 8px;
          border: 1px solid var(--ob-mesh-1);
        }

        /* ── CTA BUTTONS ── */
        .dg-btn-plan {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0.55rem 1rem;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-default);
          background: var(--very-light-opaque-primary);
          border: 1px solid rgba(59,92,203,0.18);
          color: var(--primary-color);
        }
        .dg-btn-plan:hover {
          background: rgba(59,92,203,0.14);
          transform: translateY(-1px);
        }
      `}</style>
    </>
  );
};

export default DailyGuidance;