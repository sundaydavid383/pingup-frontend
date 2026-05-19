import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import './styles/checkinmodal.css';
import { useTaskTable } from '../../context/TaskTableContext';

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
  const { setTaskTableOpen } = useTaskTable();
  useEffect(() => {
    setTaskTableOpen(true);
    return () => setTaskTableOpen(false); // hide navbar when CheckInModal unmounts
  }, [])

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

  
    </motion.div>
  );
};

export default CheckInModal;