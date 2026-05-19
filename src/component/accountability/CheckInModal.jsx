import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';

const RESPONSES = {
  yes: { label: 'Yes, doing it', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  partial: { label: 'Partially', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  no: { label: "Not yet", color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

/**
 * CheckInModal
 *
 * Props:
 *   task      – task with checkInPrompts[]
 *   onClose   – () => void
 *   onComplete – (responses: {prompt, answer}[]) => void
 */
const CheckInModal = ({ task, onClose, onComplete }) => {
  const prompts = task?.checkInPrompts || [];
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);

  const handleSelect = (key) => setSelected(key);

  const handleNext = () => {
    const updated = [...responses, { prompt: prompts[step], answer: selected }];
    setResponses(updated);
    setSelected(null);
    if (step < prompts.length - 1) {
      setStep(s => s + 1);
    } else {
      setDone(true);
      setTimeout(() => {
        if (typeof onComplete === 'function') onComplete(updated);
      }, 1200);
    }
  };

  const allNo = responses.every(r => r.answer === 'no') && done;
  const progress = ((step + (done ? 1 : 0)) / prompts.length) * 100;

  return (
    <motion.div
      className="ci-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="ci-panel"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      >
        {/* Header */}
        <div className="ci-header">
          <div className="ci-header-icon">
            <FiAlertTriangle size={16} />
          </div>
          <div>
            <p className="ci-header-title">Accountability Check-in</p>
            <p className="ci-header-sub">{task?.title}</p>
          </div>
          <button className="ci-close" onClick={onClose}><FiX size={14} /></button>
        </div>

        {/* Progress */}
        <div className="ci-progress-track">
          <motion.div
            className="ci-progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="ci-body">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div
                key={step}
                className="ci-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
              >
                <div className="ci-step-counter">
                  {step + 1} of {prompts.length}
                </div>
                <p className="ci-prompt">{prompts[step]}</p>
                <div className="ci-options">
                  {Object.entries(RESPONSES).map(([key, meta]) => (
                    <button
                      key={key}
                      className={`ci-option ${selected === key ? 'ci-option--active' : ''}`}
                      style={selected === key ? { borderColor: meta.color, background: meta.bg } : {}}
                      onClick={() => handleSelect(key)}
                    >
                      <span
                        className="ci-option-dot"
                        style={selected === key ? { background: meta.color } : {}}
                      />
                      <span className="ci-option-label" style={selected === key ? { color: meta.color } : {}}>
                        {meta.label}
                      </span>
                      {selected === key && <FiCheck size={13} style={{ color: meta.color, marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
                <button
                  className="ci-submit-btn"
                  disabled={!selected}
                  onClick={handleNext}
                >
                  {step < prompts.length - 1 ? 'Next question' : 'Submit check-in'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                className="ci-done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <div className="ci-done-icon">
                  <FiCheck size={24} />
                </div>
                <p className="ci-done-title">Check-in recorded</p>
                <p className="ci-done-sub">Honesty is the first step to change. Keep going.</p>
                {allNo && (
                  <div className="ci-nudge">
                    <FiAlertTriangle size={13} />
                    <span>It looks like you're behind. No judgment — just get back on track now.</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        .ci-backdrop {
          position: fixed;
          inset: 0;
          z-index: 8888;
          background: rgba(5,8,20,0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 1rem;
        }
        @media (min-width: 600px) {
          .ci-backdrop { align-items: center; }
        }
        .ci-panel {
          width: 100%;
          max-width: 480px;
          background: #0d1529;
          border: 1px solid rgba(59,92,203,0.2);
          border-radius: 20px 20px 16px 16px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        }
        @media (min-width: 600px) {
          .ci-panel { border-radius: 20px; }
        }
        .ci-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.1rem 1.25rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ci-header-icon {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(239,68,68,0.12);
          border-radius: 10px;
          color: #ef4444;
          flex-shrink: 0;
        }
        .ci-header-title {
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0 0 2px;
        }
        .ci-header-sub {
          font-size: 11px;
          color: #64748b;
          margin: 0;
        }
        .ci-close {
          margin-left: auto;
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ci-close:hover { color: #e2e8f0; background: rgba(255,255,255,0.09); }
        .ci-progress-track {
          height: 2px;
          background: rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .ci-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444, #f97316);
        }
        .ci-body { padding: 1.5rem 1.25rem; min-height: 220px; }
        .ci-step { display: flex; flex-direction: column; gap: 1rem; }
        .ci-step-counter {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(148,163,184,0.5);
        }
        .ci-prompt {
          font-size: 16px;
          font-weight: 600;
          color: #e2e8f0;
          line-height: 1.5;
          margin: 0;
        }
        .ci-options { display: flex; flex-direction: column; gap: 8px; }
        .ci-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.7rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.18s;
          text-align: left;
        }
        .ci-option:hover { background: rgba(255,255,255,0.06); }
        .ci-option-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: rgba(148,163,184,0.25);
          flex-shrink: 0;
          transition: background 0.18s;
        }
        .ci-option-label {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          transition: color 0.18s;
        }
        .ci-submit-btn {
          background: var(--primary-color, #3b5ccb);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 0.7rem 1.4rem;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          align-self: flex-end;
          transition: all 0.18s;
        }
        .ci-submit-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .ci-submit-btn:not(:disabled):hover { background: #2a4ab8; }
        .ci-done {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 0.75rem; text-align: center;
          padding: 1rem 0;
        }
        .ci-done-icon {
          width: 56px; height: 56px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(16,185,129,0.12);
          border-radius: 50%;
          color: #10b981;
        }
        .ci-done-title { font-size: 18px; font-weight: 700; color: #e2e8f0; margin: 0; }
        .ci-done-sub { font-size: 13px; color: #64748b; margin: 0; }
        .ci-nudge {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          color: #ef4444;
          font-size: 12px;
          line-height: 1.5;
          text-align: left;
          margin-top: 0.5rem;
          width: 100%;
        }
      `}</style>
    </motion.div>
  );
};

export default CheckInModal;