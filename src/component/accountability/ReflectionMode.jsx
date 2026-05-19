import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiArrowRight, FiCheck, FiMoon } from 'react-icons/fi';

/**
 * ReflectionMode
 *
 * Props:
 *   task      – task object with reflectionQuestions[]
 *   onClose   – () => void
 *   onComplete – (answers: string[]) => void
 */
const ReflectionMode = ({ task, onClose, onComplete }) => {
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState('');
  const [done, setDone] = useState(false);
  const textRef = useRef(null);

  const questions = task?.reflectionQuestions || [];
  const total = questions.length;

  useEffect(() => {
    setCurrent(answers[qIndex] || '');
    setTimeout(() => textRef.current?.focus(), 120);
  }, [qIndex]);

  const handleNext = () => {
    const updated = [...answers];
    updated[qIndex] = current;
    setAnswers(updated);

    if (qIndex < total - 1) {
      setQIndex(q => q + 1);
    } else {
      setDone(true);
      setTimeout(() => {
        if (typeof onComplete === 'function') onComplete(updated);
      }, 1400);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && current.trim()) {
      handleNext();
    }
  };

  const progress = ((qIndex + (done ? 1 : 0)) / total) * 100;

  return (
    <motion.div
      className="rm-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="rm-container"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      >
        {/* Ambient orbs */}
        <div className="rm-orb rm-orb--1" aria-hidden="true" />
        <div className="rm-orb rm-orb--2" aria-hidden="true" />

        {/* Header */}
        <div className="rm-header">
          <div className="rm-header-left">
            <div className="rm-moon-icon"><FiMoon size={14} /></div>
            <div>
              <span className="rm-eyebrow">Focus Mode</span>
              <p className="rm-task-name">{task?.title}</p>
            </div>
          </div>
          <button className="rm-close" onClick={onClose} aria-label="Exit reflection">
            <FiX size={15} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="rm-progress-track">
          <motion.div
            className="rm-progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
          />
        </div>

        {/* Body */}
        <div className="rm-body">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div
                key={qIndex}
                className="rm-question-wrap"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.26, ease: [0.2, 0, 0, 1] }}
              >
                <div className="rm-q-counter">
                  <span className="rm-q-num">{qIndex + 1}</span>
                  <span className="rm-q-sep">/</span>
                  <span className="rm-q-total">{total}</span>
                </div>
                <p className="rm-question">{questions[qIndex]}</p>
                <textarea
                  ref={textRef}
                  className="rm-textarea"
                  placeholder="Write your answer here… (⌘↵ to continue)"
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={5}
                />
                <div className="rm-footer">
                  <span className="rm-hint">⌘ + Enter to continue</span>
                  <button
                    className="rm-next-btn"
                    onClick={handleNext}
                    disabled={!current.trim()}
                  >
                    {qIndex < total - 1 ? (
                      <><span>Next</span><FiArrowRight size={14} /></>
                    ) : (
                      <><span>Complete</span><FiCheck size={14} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                className="rm-done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
              >
                <div className="rm-done-icon">
                  <FiCheck size={28} />
                </div>
                <p className="rm-done-title">Reflection complete</p>
                <p className="rm-done-sub">Great work. Your answers have been saved.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Previous answers strip */}
        {!done && answers.filter(Boolean).length > 0 && (
          <div className="rm-prev-answers">
            <span className="rm-prev-label">Previous answers</span>
            <div className="rm-prev-list">
              {answers.filter(Boolean).map((ans, i) => (
                <div key={i} className="rm-prev-item">
                  <span className="rm-prev-q">Q{i + 1}</span>
                  <span className="rm-prev-a">{ans.length > 60 ? ans.slice(0, 60) + '…' : ans}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <style>{`
        .rm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(5, 8, 20, 0.92);
          backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .rm-container {
          position: relative;
          width: 100%;
          max-width: 560px;
          background: linear-gradient(145deg, #0d1529, #111b38);
          border: 1px solid rgba(59,92,203,0.2);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
        }
        .rm-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }
        .rm-orb--1 {
          width: 260px; height: 260px;
          top: -80px; right: -60px;
          background: rgba(59,92,203,0.12);
        }
        .rm-orb--2 {
          width: 200px; height: 200px;
          bottom: -60px; left: -40px;
          background: rgba(139,92,246,0.08);
        }
        .rm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem 1rem;
        }
        .rm-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .rm-moon-icon {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(59,92,203,0.15);
          border-radius: 10px;
          color: #7b9cf5;
          flex-shrink: 0;
        }
        .rm-eyebrow {
          display: block;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(148,163,184,0.7);
          margin-bottom: 2px;
        }
        .rm-task-name {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
          margin: 0;
        }
        .rm-close {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.18s;
        }
        .rm-close:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
        .rm-progress-track {
          height: 2px;
          background: rgba(255,255,255,0.05);
          margin: 0 1.5rem;
          border-radius: 99px;
          overflow: hidden;
        }
        .rm-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b5ccb, #7b9cf5);
          border-radius: 99px;
        }
        .rm-body {
          padding: 1.75rem 1.5rem 1.25rem;
          min-height: 280px;
          display: flex;
          flex-direction: column;
        }
        .rm-question-wrap {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }
        .rm-q-counter {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }
        .rm-q-num {
          font-size: 28px;
          font-weight: 800;
          color: #7b9cf5;
          line-height: 1;
        }
        .rm-q-sep { font-size: 16px; color: rgba(148,163,184,0.4); }
        .rm-q-total { font-size: 16px; color: rgba(148,163,184,0.5); }
        .rm-question {
          font-size: 17px;
          font-weight: 600;
          color: #e2e8f0;
          line-height: 1.55;
          margin: 0;
        }
        .rm-textarea {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #e2e8f0;
          font-size: 14px;
          line-height: 1.65;
          padding: 0.875rem 1rem;
          resize: none;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .rm-textarea::placeholder { color: rgba(148,163,184,0.4); }
        .rm-textarea:focus { border-color: rgba(59,92,203,0.5); }
        .rm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rm-hint {
          font-size: 11px;
          color: rgba(148,163,184,0.4);
        }
        .rm-next-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--primary-color, #3b5ccb);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 0.6rem 1.2rem;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
        }
        .rm-next-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .rm-next-btn:not(:disabled):hover { background: #2a4ab8; transform: translateY(-1px); }
        .rm-done {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex: 1;
          text-align: center;
          padding: 1rem 0;
        }
        .rm-done-icon {
          width: 64px; height: 64px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(16,185,129,0.15);
          border-radius: 50%;
          color: #10b981;
        }
        .rm-done-title {
          font-size: 20px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
        }
        .rm-done-sub {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }
        .rm-prev-answers {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 1rem 1.5rem;
        }
        .rm-prev-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(148,163,184,0.45);
          display: block;
          margin-bottom: 0.6rem;
        }
        .rm-prev-list { display: flex; flex-direction: column; gap: 4px; }
        .rm-prev-item {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .rm-prev-q {
          font-size: 10px;
          font-weight: 700;
          color: #7b9cf5;
          background: rgba(59,92,203,0.12);
          padding: 2px 6px;
          border-radius: 4px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .rm-prev-a {
          font-size: 12px;
          color: rgba(148,163,184,0.65);
          line-height: 1.4;
        }
      `}</style>
    </motion.div>
  );
};

export default ReflectionMode;