import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiChevronLeft, FiCheck, FiX } from 'react-icons/fi';
import { GiPrayerBeads } from 'react-icons/gi';
import { FaBook, FaDumbbell, FaUsers, FaBullseye } from 'react-icons/fa';
import axiosBase from '../../utils/axiosBase';
import './onboarding.css';

const NICHES = [
  { id: 'spiritual',  label: 'Spiritual Growth',                    Icon: GiPrayerBeads },
  { id: 'academic',   label: 'Academic / Learning Excellence',       Icon: FaBook },
  { id: 'fitness',    label: 'Fitness & Health',                     Icon: FaDumbbell },
  { id: 'leadership', label: 'Team Management & Leadership',         Icon: FaUsers },
  { id: 'discipline', label: 'Personal Accountability & Discipline', Icon: FaBullseye },
];

const NICHE_QUESTIONS = {
  spiritual: [
    { id: 1, question: 'What is your specific spiritual goal?',  type: 'text',   placeholder: 'e.g., Deepen daily prayer practice' },
    { id: 2, question: 'Current level?',                         type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 3, question: 'Biggest challenge right now?',           type: 'text',   placeholder: 'e.g., Staying consistent with devotions' },
  ],
  academic: [
    { id: 1, question: 'What do you want to master?',            type: 'text',   placeholder: 'e.g., Data Science or JavaScript' },
    { id: 2, question: 'Current level?',                         type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 3, question: "What's blocking your progress?",         type: 'text',   placeholder: 'e.g., Lack of structure or motivation' },
  ],
  fitness: [
    { id: 1, question: "What's your fitness goal?",              type: 'text',   placeholder: 'e.g., Lose 10kg or build muscle' },
    { id: 2, question: 'Current level?',                         type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 3, question: "What's your biggest fitness challenge?", type: 'text',   placeholder: 'e.g., Staying motivated or consistency' },
  ],
  leadership: [
    { id: 1, question: "What's your leadership goal?",           type: 'text',   placeholder: 'e.g., Build a high-performing team' },
    { id: 2, question: 'Current level?',                         type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 3, question: "What's your main leadership challenge?", type: 'text',   placeholder: 'e.g., Delegation or team dynamics' },
  ],
  discipline: [
    { id: 1, question: 'What habit do you want to build?',       type: 'text',   placeholder: 'e.g., Morning routine or consistency' },
    { id: 2, question: 'Current level?',                         type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 3, question: "What's breaking your discipline?",       type: 'text',   placeholder: 'e.g., Procrastination or lack of structure' },
  ],
};

const AccountabilityOnboarding = ({ isOpen, onClose, onSuccess, token }) => {
  const [currentStep, setCurrentStep] = useState('niche-selection');
  const [selectedNiches, setSelectedNiches] = useState([]);
  const [nicheIndex, setNicheIndex] = useState(0);
  const [nicheGoals, setNicheGoals] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentNiche = selectedNiches[nicheIndex];
  const currentNicheQuestions = currentNiche ? NICHE_QUESTIONS[currentNiche] : [];
  const currentQuestion = currentNicheQuestions[currentQuestionIndex];

  const toggleNiche = (nicheId) => {
    setSelectedNiches(prev =>
      prev.includes(nicheId) ? prev.filter(n => n !== nicheId) : [...prev, nicheId]
    );
  };

  const handleNicheSelectContinue = () => {
    if (selectedNiches.length === 0) { setCurrentStep('summary'); return; }
    const newGoals = {};
    selectedNiches.forEach(n => { newGoals[n] = {}; });
    setNicheGoals(newGoals);
    setNicheIndex(0);
    setCurrentQuestionIndex(0);
    setCurrentStep('quick-interview');
  };

  const saveAnswer = (answer) => {
    setNicheGoals(prev => ({
      ...prev,
      [currentNiche]: { ...prev[currentNiche], [`q${currentQuestion.id}`]: answer },
    }));
  };

  const advanceQuestion = () => {
    if (currentQuestionIndex < currentNicheQuestions.length - 1) { setCurrentQuestionIndex(p => p + 1); return; }
    if (nicheIndex < selectedNiches.length - 1) { setNicheIndex(p => p + 1); setCurrentQuestionIndex(0); return; }
    setCurrentStep('summary');
  };

  const handleQuestionAnswer = (answer) => { saveAnswer(answer); };

  const handleSaveOnboarding = async () => {
    try {
      setLoading(true); setError('');
      const payload = { selectedNiches, nicheGoals, generalDisciplineEnabled: true, onboardingCompleted: true };
      const response = await axiosBase.post('/api/user/onboarding', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.success === true) {
        setLoading(false);
        setTimeout(() => { if (typeof onSuccess === 'function') onSuccess(response.data); }, 100);
      } else {
        setError(response.data?.message || 'Failed to save onboarding data');
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving onboarding data');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const progressWidth = currentStep === 'niche-selection' ? '33%' : currentStep === 'quick-interview' ? '66%' : '100%';

  return (
    <div className="ob-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="ob-modal"
      >
        {/* ── Header ── */}
        <div className="ob-header">
          <div className="ob-header-top">
            <div>
              <h2 className="ob-title">Build Your Accountability Plan</h2>
              <span className="ob-step-label">
                {currentStep === 'niche-selection' && 'Step 1 of 3 — Choose your focus areas'}
                {currentStep === 'quick-interview' && `Step 2 of 3 — Area ${nicheIndex + 1} of ${selectedNiches.length}`}
                {currentStep === 'summary' && 'Step 3 of 3 — Review your plan'}
              </span>
            </div>
            <button className="ob-close-btn" onClick={() => onClose?.()}>
              <FiX size={16} />
            </button>
          </div>
          <div className="ob-progress-track">
            <motion.div className="ob-progress-fill" animate={{ width: progressWidth }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="ob-body">
          <AnimatePresence mode="wait">

            {/* Step 1 — Niche Selection */}
            {currentStep === 'niche-selection' && (
              <motion.div key="niche-selection" className="ob-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <p className="ob-section-title">What would you like SpringsConnect to help you achieve?</p>
                <p className="ob-section-sub">Select one or more areas — you'll get personalised guidance for each.</p>

                <div className="ob-niche-grid">
                  {NICHES.map(({ id, label, Icon }) => {
                    const active = selectedNiches.includes(id);
                    return (
                      <motion.button
                        key={id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleNiche(id)}
                        className={`ob-niche-card ${active ? 'ob-niche-card--active' : ''}`}
                      >
                        <div className={`ob-niche-icon-wrap ${active ? 'ob-niche-icon-wrap--active' : ''}`}>
                          <Icon size={18} />
                        </div>
                        <span className="ob-niche-label">{label}</span>
                        {active && (
                          <div className="ob-niche-check">
                            <FiCheck size={11} />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {selectedNiches.length > 0 && (
                  <p className="ob-selection-count">
                    <FiCheck size={12} /> {selectedNiches.length} area{selectedNiches.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 2 — Interview */}
            {currentStep === 'quick-interview' && currentNiche && (() => {
              const nicheData = NICHES.find(n => n.id === currentNiche);
              const NicheIcon = nicheData?.Icon;
              return (
                <motion.div key={`interview-${nicheIndex}-${currentQuestionIndex}`} className="ob-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <div className="ob-interview-badge">
                    {NicheIcon && <NicheIcon size={13} />}
                    <span>{nicheData?.label}</span>
                    <span className="ob-interview-badge-dot" />
                    <span>Q{currentQuestionIndex + 1} / {currentNicheQuestions.length}</span>
                  </div>

                  <p className="ob-question-text">{currentQuestion?.question}</p>

                  {currentQuestion?.type === 'text' && (
                    <textarea
                      autoFocus
                      className="ob-textarea"
                      placeholder={currentQuestion.placeholder}
                      value={nicheGoals[currentNiche]?.[`q${currentQuestion.id}`] || ''}
                      onChange={e => saveAnswer(e.target.value)}
                      rows={3}
                    />
                  )}

                  {currentQuestion?.type === 'select' && (
                    <div className="ob-options">
                      {currentQuestion.options?.map(opt => {
                        const chosen = nicheGoals[currentNiche]?.[`q${currentQuestion.id}`] === opt;
                        return (
                          <motion.button
                            key={opt}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleQuestionAnswer(opt)}
                            className={`ob-option-btn ${chosen ? 'ob-option-btn--active' : ''}`}
                          >
                            <span className={`ob-option-dot ${chosen ? 'ob-option-dot--active' : ''}`} />
                            {opt}
                            {chosen && <FiCheck size={13} className="ob-option-check" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })()}

            {/* Step 3 — Summary */}
            {currentStep === 'summary' && (
              <motion.div key="summary" className="ob-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <p className="ob-section-title">Your Accountability Plan</p>
                <p className="ob-section-sub">Here's what we'll focus on together.</p>

                {/* Always-on discipline card */}
                <div className="ob-summary-card ob-summary-card--blue">
                  <div className="ob-summary-card-icon ob-summary-card-icon--blue">
                    <FaBullseye size={14} />
                  </div>
                  <div>
                    <p className="ob-summary-card-title">General Daily Discipline</p>
                    <p className="ob-summary-card-sub">Daily guidance & habit prompts to build consistency.</p>
                  </div>
                </div>

                {selectedNiches.length > 0 && (
                  <>
                    <p className="ob-summary-section-label">Personalised Focus Areas</p>
                    {selectedNiches.map(niche => {
                      const nd = NICHES.find(n => n.id === niche);
                      const NI = nd?.Icon;
                      const answers = nicheGoals[niche] || {};
                      const entries = Object.entries(answers);
                      return (
                        <div key={niche} className="ob-summary-card">
                          <div className="ob-summary-card-icon">
                            {NI && <NI size={14} />}
                          </div>
                          <div className="ob-summary-card-body">
                            <p className="ob-summary-card-title">{nd?.label}</p>
                            {entries.length > 0 && (
                              <div className="ob-answers">
                                {entries.map(([k, v]) => (
                                  <div key={k} className="ob-answer-row">
                                    <span className="ob-answer-key">{k.replace('q', 'Q')}:</span>
                                    <span className="ob-answer-val">{v}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {error && <div className="ob-error">{error}</div>}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="ob-footer">
          {(currentStep === 'quick-interview' || currentStep === 'summary') && (
            <button
              className="ob-btn ob-btn--ghost"
              onClick={() => {
                if (currentStep === 'summary') { setCurrentStep(selectedNiches.length > 0 ? 'quick-interview' : 'niche-selection'); return; }
                if (currentQuestionIndex > 0) { setCurrentQuestionIndex(p => p - 1); }
                else if (nicheIndex > 0) { setNicheIndex(p => p - 1); setCurrentQuestionIndex(NICHE_QUESTIONS[selectedNiches[nicheIndex - 1]].length - 1); }
                else { setCurrentStep('niche-selection'); }
              }}
            >
              <FiChevronLeft size={15} /> Back
            </button>
          )}

          <div className="ob-footer-right">
            {currentStep === 'niche-selection' && (
              <button className="ob-btn ob-btn--ghost" onClick={() => setCurrentStep('summary')}>
                Skip for now
              </button>
            )}

            {currentStep === 'niche-selection' && (
              <button className="ob-btn ob-btn--primary" onClick={handleNicheSelectContinue}>
                Continue <FiChevronRight size={15} />
              </button>
            )}

            {currentStep === 'quick-interview' && (
              <button
                className="ob-btn ob-btn--primary"
                onClick={advanceQuestion}
                disabled={!nicheGoals[currentNiche]?.[`q${currentQuestion?.id}`]}
              >
                Next <FiChevronRight size={15} />
              </button>
            )}

            {currentStep === 'summary' && (
              <button className="ob-btn ob-btn--success" onClick={handleSaveOnboarding} disabled={loading}>
                {loading ? <><span className="ob-spinner" /> Saving…</> : <><FiCheck size={14} /> Build My Plan</>}
              </button>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default AccountabilityOnboarding;