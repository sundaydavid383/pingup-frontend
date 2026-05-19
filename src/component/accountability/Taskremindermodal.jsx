import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell, FiX, FiCheck, FiMessageCircle,
  FiSend, FiAlertTriangle, FiClock, FiHeart,
  FiZap, FiChevronRight,
} from 'react-icons/fi';

// ─── DUMMY TRUSTED CONNECTIONS ────────────────────────────────────────────────
export const TRUSTED_CONNECTIONS = [
  {
    id: 'tc1',
    name: 'Adeola Mensah',
    role: 'Accountability Partner',
    avatar: null,
    initials: 'AM',
    color: '#3b5ccb',
    colorBg: 'rgba(59,92,203,0.12)',
    phone: '+234 801 234 5678',
    notified: false,
  },
  {
    id: 'tc2',
    name: 'Pastor James Obi',
    role: 'Mentor',
    avatar: null,
    initials: 'JO',
    color: '#10b981',
    colorBg: 'rgba(16,185,129,0.12)',
    phone: '+234 802 345 6789',
    notified: false,
  },
  {
    id: 'tc3',
    name: 'Chidinma Eze',
    role: 'Close Friend',
    avatar: null,
    initials: 'CE',
    color: '#8b5cf6',
    colorBg: 'rgba(139,92,246,0.12)',
    phone: '+234 803 456 7890',
    notified: false,
  },
];

// ─── FEELINGS OPTIONS ─────────────────────────────────────────────────────────
const FEELINGS = [
  { key: 'overwhelmed', label: 'Overwhelmed', emoji: '😓', isLazy: false },
  { key: 'distracted',  label: 'Distracted',  emoji: '🌀', isLazy: false },
  { key: 'tired',       label: 'Tired',        emoji: '😴', isLazy: false },
  { key: 'lazy',        label: 'Just lazy',    emoji: '😬', isLazy: true  },
  { key: 'stuck',       label: 'Feeling stuck',emoji: '🪨', isLazy: false },
  { key: 'forgot',      label: 'I forgot',     emoji: '🤦', isLazy: false },
];

const ENCOURAGEMENTS = {
  overwhelmed: {
    message: "It\'s okay to feel overwhelmed. Break this task into ONE tiny step right now. What\'s the absolute smallest thing you can do?",
    cta: 'Start with 5 minutes',
    icon: FiHeart,
    color: '#f59e0b',
  },
  distracted: {
    message: "Distractions happen to everyone. Close one tab, silence your phone for 10 minutes, and jump back in. You\'re closer than you think.",
    cta: 'Focus for 10 mins',
    icon: FiZap,
    color: '#3b5ccb',
  },
  tired: {
    message: 'Your body is talking. Take a 5-minute break, drink some water, then come back. Rest is not quitting — it\'s refuelling.',
    cta: 'Take a quick break',
    icon: FiHeart,
    color: '#10b981',
  },
  stuck: {
    message: 'Being stuck means you\'re thinking deeply. Write down what\'s blocking you — sometimes naming it breaks it open.',
    cta: 'Write it out',
    icon: FiZap,
    color: '#8b5cf6',
  },
  forgot: {
    message: "No worries — now you know. Set a reminder, jump in immediately, and make up for the time. Done late is still done.",
    cta: 'Start right now',
    icon: FiCheck,
    color: '#3b5ccb',
  },
  lazy: null, // triggers accountability flow
};

// ─── STEPS ────────────────────────────────────────────────────────────────────
// 'reminder' → show the task reminder
// 'confirm'  → did you do it?
// 'feelings' → why not?
// 'encourage'→ encouragement message
// 'lazy'     → lazy flow — notify a connection
// 'sent'     → notification sent confirmation

/**
 * TaskReminderModal
 *
 * Props:
 *   task               – the task object that is due
 *   connections        – TRUSTED_CONNECTIONS array
 *   onClose            – () => void
 *   onMarkDone         – (taskId) => void
 *   onNotifySent       – (taskId, connectionId) => void
 */
const TaskReminderModal = ({
  task,
  connections = TRUSTED_CONNECTIONS,
  onClose,
  onMarkDone,
  onNotifySent,
}) => {
  const [step, setStep] = useState('reminder'); // reminder | confirm | feelings | encourage | lazy | sent
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [sending, setSending] = useState(false);

  if (!task) return null;

  const feelingMeta = selectedFeeling ? FEELINGS.find(f => f.key === selectedFeeling) : null;
  const encouragement = selectedFeeling ? ENCOURAGEMENTS[selectedFeeling] : null;

  const handleConfirmYes = () => {
    onMarkDone?.(task.id);
    onClose?.();
  };

  const handleFeelingSelect = (key) => {
    setSelectedFeeling(key);
    const f = FEELINGS.find(f => f.key === key);
    if (f?.isLazy) {
      setStep('lazy');
    } else {
      setStep('encourage');
    }
  };

  const handleSendNotification = () => {
    if (!selectedConnection) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onNotifySent?.(task.id, selectedConnection);
      setStep('sent');
    }, 1800);
  };

  return (
    <motion.div
      className="trm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <motion.div
        className="trm-sheet"
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      >
        {/* Close */}
        <button className="trm-close" onClick={onClose}><FiX size={15} /></button>

        <AnimatePresence mode="wait">

          {/* ── STEP: REMINDER ── */}
          {step === 'reminder' && (
            <motion.div key="reminder" className="trm-step" {...fadeSlide}>
              <div className="trm-bell-wrap">
                <div className="trm-bell-ring" />
                <div className="trm-bell-icon"><FiBell size={22} /></div>
              </div>
              <p className="trm-eyebrow">Time check</p>
              <h2 className="trm-headline">It's time for this task</h2>
              <div className="trm-task-card">
                <div className="trm-task-time">
                  <FiClock size={11} />
                  {task.time}
                </div>
                <p className="trm-task-title">{task.title}</p>
                {task.description && <p className="trm-task-desc">{task.description}</p>}
                {task.linkedGoal && (
                  <span className="trm-goal-chip">🎯 {task.linkedGoal}</span>
                )}
              </div>
              <div className="trm-btn-row">
                <button className="trm-btn trm-btn--primary" onClick={() => setStep('confirm')}>
                  <FiCheck size={14} /> Let's check in
                </button>
                <button className="trm-btn trm-btn--ghost" onClick={onClose}>
                  Remind me later
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: CONFIRM ── */}
          {step === 'confirm' && (
            <motion.div key="confirm" className="trm-step" {...fadeSlide}>
              <div className="trm-confirm-icon">✅</div>
              <h2 className="trm-headline">Did you complete it?</h2>
              <p className="trm-subtext">Be honest — accountability only works when it's real.</p>
              <p className="trm-confirm-task">"{task.title}"</p>
              <div className="trm-confirm-row">
                <button className="trm-confirm-btn trm-confirm-btn--yes" onClick={handleConfirmYes}>
                  <FiCheck size={16} />
                  <span>Yes, I did it!</span>
                </button>
                <button className="trm-confirm-btn trm-confirm-btn--no" onClick={() => setStep('feelings')}>
                  <FiX size={16} />
                  <span>Not yet</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: FEELINGS ── */}
          {step === 'feelings' && (
            <motion.div key="feelings" className="trm-step" {...fadeSlide}>
              <div className="trm-feelings-icon">💬</div>
              <h2 className="trm-headline">What's going on?</h2>
              <p className="trm-subtext">No judgment — just help us understand so we can help you.</p>
              <div className="trm-feelings-grid">
                {FEELINGS.map((f) => (
                  <button
                    key={f.key}
                    className={`trm-feeling-btn${selectedFeeling === f.key ? ' active' : ''}`}
                    onClick={() => handleFeelingSelect(f.key)}
                  >
                    <span className="trm-feeling-emoji">{f.emoji}</span>
                    <span className="trm-feeling-label">{f.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP: ENCOURAGEMENT ── */}
          {step === 'encourage' && encouragement && (
            <motion.div key="encourage" className="trm-step" {...fadeSlide}>
              <div className="trm-enc-icon" style={{ color: encouragement.color, background: `${encouragement.color}18` }}>
                <encouragement.icon size={22} />
              </div>
              <p className="trm-feeling-tag">{feelingMeta?.emoji} {feelingMeta?.label}</p>
              <h2 className="trm-headline">You've got this.</h2>
              <div className="trm-enc-message">{encouragement.message}</div>
              <div className="trm-btn-row">
                <button
                  className="trm-btn trm-btn--primary"
                  style={{ background: encouragement.color }}
                  onClick={() => { onMarkDone?.(task.id); onClose?.(); }}
                >
                  <FiZap size={14} /> {encouragement.cta}
                </button>
                <button className="trm-btn trm-btn--ghost" onClick={onClose}>
                  I'll try later
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: LAZY ── */}
          {step === 'lazy' && (
            <motion.div key="lazy" className="trm-step" {...fadeSlide}>
              <div className="trm-lazy-icon">😬</div>
              <h2 className="trm-headline">Laziness is temporary.</h2>
              <p className="trm-subtext">
                We all have those days. But your goals don't take days off.
                Let's get one of your trusted people to give you a push.
              </p>
              <div className="trm-alert-banner">
                <FiAlertTriangle size={13} />
                <span>Selecting someone will send them a real accountability nudge about this task.</span>
              </div>
              <p className="trm-connections-label">Choose who gets notified:</p>
              <div className="trm-connections-list">
                {connections.map((c) => (
                  <button
                    key={c.id}
                    className={`trm-connection${selectedConnection === c.id ? ' active' : ''}`}
                    onClick={() => setSelectedConnection(c.id)}
                  >
                    <div className="trm-conn-avatar" style={{ background: c.colorBg, color: c.color }}>
                      {c.initials}
                    </div>
                    <div className="trm-conn-info">
                      <span className="trm-conn-name">{c.name}</span>
                      <span className="trm-conn-role">{c.role}</span>
                    </div>
                    {selectedConnection === c.id && (
                      <FiCheck size={14} className="trm-conn-check" style={{ color: c.color }} />
                    )}
                  </button>
                ))}
              </div>
              <div className="trm-btn-row">
                <button
                  className="trm-btn trm-btn--danger"
                  disabled={!selectedConnection || sending}
                  onClick={handleSendNotification}
                >
                  {sending
                    ? <><span className="trm-spinner" /> Sending...</>
                    : <><FiSend size={14} /> Send accountability nudge</>
                  }
                </button>
                <button className="trm-btn trm-btn--ghost" onClick={() => setStep('encourage') || setSelectedFeeling('overwhelmed')}>
                  Actually, I'll try again
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: SENT ── */}
          {step === 'sent' && (
            <motion.div key="sent" className="trm-step" {...fadeSlide}>
              <motion.div
                className="trm-sent-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              >
                <FiMessageCircle size={28} />
              </motion.div>
              <h2 className="trm-headline">Nudge sent! 🚀</h2>
              {selectedConnection && (() => {
                const c = connections.find(x => x.id === selectedConnection);
                return c ? (
                  <p className="trm-subtext">
                    <strong>{c.name}</strong> has been notified that you need an accountability push on{' '}
                    <em>"{task.title}"</em>. Expect a message soon.
                  </p>
                ) : null;
              })()}
              <div className="trm-sent-card">
                <FiHeart size={14} style={{ color: '#ef4444' }} />
                <span>Your people care about your growth. Now honour that by taking action.</span>
              </div>
              <button className="trm-btn trm-btn--primary" onClick={onClose}>
                <FiCheck size={14} /> Got it, closing
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      <style>{`
        .trm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9000;
          background: var(--deeper-opaque-secondary);
          backdrop-filter: var(--backdrop-blur);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0 0 0;
        }
        @media (min-width: 600px) {
          .trm-overlay { align-items: center; padding: 1rem; }
        }

        .trm-sheet {
          position: relative;
          width: 100%;
          max-width: 480px;
          background: var(--white);
          border-radius: 24px 24px 0 0;
          padding: 2rem 1.5rem 2.5rem;
          box-shadow: 0 -8px 48px rgba(0,0,0,0.18);
          overflow: hidden;
        }
        @media (min-width: 600px) {
          .trm-sheet { border-radius: 22px; box-shadow: 0 24px 64px rgba(0,0,0,0.22); }
        }

        .trm-close {
          position: absolute;
          top: 1.1rem; right: 1.1rem;
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          background: var(--ob-surface2);
          border: 1px solid var(--ob-mesh-1);
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-default);
          z-index: 2;
        }
        .trm-close:hover { background: var(--hover-light); color: var(--ob-header-h1); }

        .trm-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .85rem;
          text-align: center;
          min-height: 320px;
          justify-content: center;
        }

        /* ── BELL ANIMATION ── */
        .trm-bell-wrap {
          position: relative;
          width: 64px; height: 64px;
          display: flex; align-items: center; justify-content: center;
        }
        .trm-bell-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(59,92,203,.1);
          animation: bell-pulse 2s ease-in-out infinite;
        }
        .trm-bell-icon {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: var(--primary-color);
          color: var(--white);
          display: flex; align-items: center; justify-content: center;
          animation: bell-shake 2.5s ease-in-out infinite;
          position: relative; z-index: 1;
        }
        @keyframes bell-pulse {
          0%, 100% { transform: scale(1); opacity: .6; }
          50% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes bell-shake {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-12deg); }
          20%, 40% { transform: rotate(12deg); }
          50% { transform: rotate(0deg); }
        }

        .trm-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--primary-color);
          margin: 0;
        }
        .trm-headline {
          font-size: 21px;
          font-weight: 800;
          color: var(--ob-header-h1);
          margin: 0;
          line-height: 1.25;
        }
        .trm-subtext {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.55;
          max-width: 340px;
        }

        /* ── TASK CARD ── */
        .trm-task-card {
          width: 100%;
          background: var(--ob-surface);
          border: 1px solid var(--ob-mesh-1);
          border-radius: 14px;
          padding: .9rem 1rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .trm-task-time {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700;
          color: var(--primary-color);
          text-transform: uppercase; letter-spacing: .06em;
        }
        .trm-task-title {
          font-size: 14px; font-weight: 700;
          color: var(--ob-header-h1); margin: 0; line-height: 1.4;
        }
        .trm-task-desc {
          font-size: 12px; color: var(--text-muted); margin: 0; line-height: 1.5;
        }
        .trm-goal-chip {
          font-size: 10px; font-weight: 600;
          color: var(--text-secondary);
          background: var(--ob-surface2);
          border-radius: 99px; padding: 2px 8px;
          display: inline-flex; align-items: center; gap: 3px;
          align-self: flex-start; margin-top: 2px;
        }

        /* ── BUTTONS ── */
        .trm-btn-row {
          display: flex; flex-direction: column; gap: 8px; width: 100%;
        }
        .trm-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: .75rem 1rem;
          border-radius: 12px;
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          border: none;
          transition: var(--transition-default);
        }
        .trm-btn--primary {
          background: var(--primary-color);
          color: var(--white);
        }
        .trm-btn--primary:hover { background: var(--primary); transform: translateY(-1px); }
        .trm-btn--ghost {
          background: var(--ob-surface2);
          color: var(--text-muted);
          border: 1px solid var(--ob-mesh-1);
        }
        .trm-btn--ghost:hover { background: var(--hover-light); color: var(--ob-header-h1); }
        .trm-btn--danger {
          background: var(--red);
          color: var(--white);
        }
        .trm-btn--danger:hover:not(:disabled) { background: var(--danger); transform: translateY(-1px); }
        .trm-btn:disabled { opacity: .4; cursor: not-allowed; }

        /* ── CONFIRM ── */
        .trm-confirm-icon { font-size: 44px; line-height: 1; }
        .trm-confirm-task {
          font-size: 13px; font-style: italic;
          color: var(--text-muted); max-width: 320px; line-height: 1.5;
        }
        .trm-confirm-row {
          display: flex; gap: 10px; width: 100%;
        }
        .trm-confirm-btn {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: .8rem 1rem;
          border-radius: 13px;
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          border: 2px solid;
          transition: var(--transition-default);
        }
        .trm-confirm-btn--yes {
          background: rgba(16,185,129,.08);
          border-color: rgba(16,185,129,.3);
          color: var(--success);
        }
        .trm-confirm-btn--yes:hover { background: rgba(16,185,129,.16); }
        .trm-confirm-btn--no {
          background: rgba(239,68,68,.06);
          border-color: rgba(239,68,68,.25);
          color: var(--red);
        }
        .trm-confirm-btn--no:hover { background: rgba(239,68,68,.13); }

        /* ── FEELINGS ── */
        .trm-feelings-icon { font-size: 40px; line-height: 1; }
        .trm-feelings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px; width: 100%;
        }
        .trm-feeling-btn {
          display: flex; align-items: center; gap: 8px;
          padding: .65rem .85rem;
          background: var(--ob-surface);
          border: 1.5px solid var(--ob-mesh-1);
          border-radius: 12px;
          font-size: 13px; font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-default);
          text-align: left;
        }
        .trm-feeling-btn:hover { border-color: var(--primary-color); color: var(--ob-header-h1); }
        .trm-feeling-btn.active {
          border-color: var(--primary-color);
          background: var(--very-light-opaque-primary);
          color: var(--primary-color);
        }
        .trm-feeling-emoji { font-size: 18px; }
        .trm-feeling-label { font-size: 12px; }

        /* ── ENCOURAGEMENT ── */
        .trm-enc-icon {
          width: 60px; height: 60px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .trm-feeling-tag {
          font-size: 12px; font-weight: 600; color: var(--text-muted); margin: 0;
        }
        .trm-enc-message {
          font-size: 14px; color: var(--text-muted);
          line-height: 1.6; max-width: 340px;
          background: var(--ob-surface);
          border-radius: 14px;
          padding: 1rem 1.1rem;
          border-left: 3px solid var(--primary-color);
          text-align: left;
        }

        /* ── LAZY / CONNECTIONS ── */
        .trm-lazy-icon { font-size: 44px; line-height: 1; }
        .trm-alert-banner {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(239,68,68,.06);
          border: 1px solid rgba(239,68,68,.18);
          border-radius: 10px;
          padding: .65rem .85rem;
          font-size: 11px;
          color: var(--red);
          line-height: 1.5;
          text-align: left;
          width: 100%;
        }
        .trm-connections-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .07em;
          color: var(--text-secondary);
          align-self: flex-start; margin-bottom: -4px;
        }
        .trm-connections-list {
          display: flex; flex-direction: column; gap: 7px; width: 100%;
        }
        .trm-connection {
          display: flex; align-items: center; gap: 10px;
          padding: .7rem .9rem;
          background: var(--ob-surface);
          border: 1.5px solid var(--ob-mesh-1);
          border-radius: 13px;
          cursor: pointer;
          transition: var(--transition-default);
          text-align: left;
        }
        .trm-connection:hover { border-color: var(--primary-color); }
        .trm-connection.active {
          border-color: var(--primary-color);
          background: var(--very-light-opaque-primary);
        }
        .trm-conn-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          flex-shrink: 0;
        }
        .trm-conn-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .trm-conn-name { font-size: 13px; font-weight: 700; color: var(--ob-header-h1); }
        .trm-conn-role { font-size: 11px; color: var(--text-secondary); }
        .trm-conn-check { flex-shrink: 0; }

        /* ── SPINNER ── */
        .trm-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: white;
          border-radius: 50%;
          display: inline-block;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── SENT ── */
        .trm-sent-icon {
          width: 68px; height: 68px;
          border-radius: 50%;
          background: rgba(59,92,203,.1);
          color: var(--primary-color);
          display: flex; align-items: center; justify-content: center;
        }
        .trm-sent-card {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(239,68,68,.05);
          border: 1px solid rgba(239,68,68,.12);
          border-radius: 12px;
          padding: .75rem 1rem;
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.55;
          text-align: left;
          width: 100%;
        }
      `}</style>
    </motion.div>
  );
};

// animation shorthand
const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

export default TaskReminderModal;