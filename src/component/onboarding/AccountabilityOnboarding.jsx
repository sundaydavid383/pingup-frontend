import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import axiosBase from '../../utils/axiosBase';
import './onboarding.css';

const NICHES = [
  { id: 'spiritual', label: 'Spiritual Growth', icon: '🙏' },
  { id: 'academic', label: 'Academic / Learning Excellence', icon: '📚' },
  { id: 'fitness', label: 'Fitness & Health', icon: '💪' },
  { id: 'leadership', label: 'Team Management & Leadership', icon: '👥' },
  { id: 'discipline', label: 'Personal Accountability & Discipline', icon: '🎯' },
];

const NICHE_QUESTIONS = {
  spiritual: [
    { id: 1, question: 'What is your specific spiritual goal?', type: 'text', placeholder: 'e.g., Deepen daily prayer practice' },
    { id: 2, question: 'Current level?', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 3, question: 'Biggest challenge right now?', type: 'text', placeholder: 'e.g., Staying consistent with devotions' },
  ],
  academic: [
    { id: 1, question: 'What do you want to master?', type: 'text', placeholder: 'e.g., Data Science or JavaScript' },
    { id: 2, question: 'Current level?', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 3, question: 'What\'s blocking your progress?', type: 'text', placeholder: 'e.g., Lack of structure or motivation' },
  ],
  fitness: [
    { id: 1, question: 'What\'s your fitness goal?', type: 'text', placeholder: 'e.g., Lose 10kg or build muscle' },
    { id: 2, question: 'Current level?', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 3, question: 'What\'s your biggest fitness challenge?', type: 'text', placeholder: 'e.g., Staying motivated or consistency' }
  ],
  leadership: [
    { id: 1, question: 'What\'s your leadership goal?', type: 'text', placeholder: 'e.g., Build a high-performing team' },
    { id: 2, question: 'Current level?', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 3, question: 'What\'s your main leadership challenge?', type: 'text', placeholder: 'e.g., Delegation or team dynamics' }
  ],
  discipline: [
    { id: 1, question: 'What habit do you want to build?', type: 'text', placeholder: 'e.g., Morning routine or consistency' },
    { id: 2, question: 'Current level?', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 3, question: 'What\'s breaking your discipline?', type: 'text', placeholder: 'e.g., Procrastination or lack of structure' }
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
    if (selectedNiches.length === 0) {
      // Allow to continue even without niche selection (general discipline always on)
      setCurrentStep('summary');
      return;
    }
    // Initialize nicheGoals for selected niches
    const newGoals = {};
    selectedNiches.forEach(niche => {
      newGoals[niche] = {};
    });
    setNicheGoals(newGoals);
    setNicheIndex(0);
    setCurrentQuestionIndex(0);
    setCurrentStep('quick-interview');
  };

  const saveAnswer = (answer) => {
    const newGoals = { ...nicheGoals };
    if (!newGoals[currentNiche]) newGoals[currentNiche] = {};
    const questionId = currentQuestion.id;
    newGoals[currentNiche][`q${questionId}`] = answer;
    setNicheGoals(newGoals);
  };

  const advanceQuestion = () => {
    if (currentQuestionIndex < currentNicheQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return;
    }

    if (nicheIndex < selectedNiches.length - 1) {
      setNicheIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      return;
    }

    setCurrentStep('summary');
  };

  const handleQuestionAnswer = (answer, autoAdvance = false) => {
    saveAnswer(answer);
    if (autoAdvance) advanceQuestion();
  };

  const handleSaveOnboarding = async () => {
    try {
      setLoading(true);
      setError('');

      const payload = {
        selectedNiches,
        nicheGoals,
        generalDisciplineEnabled: true,
        onboardingCompleted: true,
      };

      console.log('🎯 [Onboarding] Sending payload:', payload);

      const response = await axiosBase.post(
        '/api/user/onboarding',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('✅ [Onboarding] API response received:', response.data);

      if (response.data?.success === true) {
        console.log('🎉 [Onboarding] Success! Calling onSuccess callback to close modal');
        setLoading(false);
        
        // Call the parent callback with a small delay to ensure state updates complete
        setTimeout(() => {
          console.log('📤 [Onboarding] Invoking onSuccess to close modal');
          if (typeof onSuccess === 'function') {
            onSuccess(response.data);
          } else {
            console.error('❌ [Onboarding] onSuccess is not a function:', onSuccess);
          }
        }, 100);
      } else {
        const errorMsg = response.data?.message || 'Failed to save onboarding data';
        console.error('❌ [Onboarding] API returned success: false -', errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error saving onboarding data';
      console.error('❌ [Onboarding] Catch error:', {
        message: errorMsg,
        status: err.response?.status,
        data: err.response?.data,
        fullError: err,
      });
      setError(errorMsg);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh]"
      >
        {/* Header Progress */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between mb-2 gap-4">
            <div>
              <h2 className="text-xl font-bold">Build Your Accountability Plan</h2>
              <span className="text-sm opacity-90 block mt-1">
                {currentStep === 'niche-selection' && 'Step 1/3'}
                {currentStep === 'quick-interview' && `Step 2/3 (${nicheIndex + 1}/${selectedNiches.length})`}
                {currentStep === 'summary' && 'Step 3/3'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="rounded-full bg-white/15 px-3 py-1 text-sm text-white hover:bg-white/25 transition"
            >
              Close
            </button>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              initial={false}
              animate={{
                width:
                  currentStep === 'niche-selection'
                    ? '33%'
                    : currentStep === 'quick-interview'
                    ? '66%'
                    : '100%',
              }}
              className="h-full bg-white rounded-full transition-all"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 min-h-[450px] flex flex-col justify-between overflow-hidden">
          <AnimatePresence mode="wait">
            {currentStep === 'niche-selection' && (
              <motion.div
                key="niche-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    What would you like SpringsConnect to help you achieve most?
                  </h3>
                  <p className="text-gray-600">
                    Select one or more areas. You'll get personalized guidance for each!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {NICHES.map(niche => (
                    <motion.button
                      key={niche.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleNiche(niche.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedNiches.includes(niche.id)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-2xl mb-2">{niche.icon}</div>
                          <p className="font-semibold text-gray-900">{niche.label}</p>
                        </div>
                        {selectedNiches.includes(niche.id) && (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {selectedNiches.length > 0 && (
                  <p className="text-sm text-blue-600 font-medium">
                    ✓ {selectedNiches.length} area{selectedNiches.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </motion.div>
            )}

            {currentStep === 'quick-interview' && currentNiche && (
              <motion.div
                key={`interview-${nicheIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 overflow-y-auto max-h-[calc(85vh-260px)]"
              >
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    {NICHES.find(n => n.id === currentNiche)?.icon} {NICHES.find(n => n.id === currentNiche)?.label}
                  </p>
                  <h3 className="text-xl font-bold text-gray-900">
                    {currentQuestion?.question}
                  </h3>
                </div>

                {currentQuestion?.type === 'text' && (
                  <textarea
                    autoFocus
                    placeholder={currentQuestion.placeholder}
                    value={nicheGoals[currentNiche]?.[`q${currentQuestion.id}`] || ''}
                    onChange={(e) => saveAnswer(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    rows={4}
                  />
                )}

                {currentQuestion?.type === 'select' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map(option => (
                      <motion.button
                        key={option}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuestionAnswer(option)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left font-medium ${
                          nicheGoals[currentNiche]?.[`q${currentQuestion.id}`] === option
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                        }`}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <span className="text-sm text-gray-500">
                    Question {currentQuestionIndex + 1} of {currentNicheQuestions.length}
                  </span>
                  {nicheIndex + 1 < selectedNiches.length && (
                    <span className="text-sm text-gray-500">
                      Area {nicheIndex + 1} of {selectedNiches.length}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Accountability Plan</h3>
                  <p className="text-gray-600">Here's what we'll focus on for you:</p>
                </div>

                <div className="space-y-4">
                  {/* General Discipline (always enabled) */}
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🎯</div>
                      <div>
                        <p className="font-semibold text-gray-900">General Daily Discipline</p>
                        <p className="text-sm text-gray-600 mt-1">
                          We'll send you daily guidance and habit prompts to build consistency.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selected Niches */}
                  {selectedNiches.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Personalized Focus Areas:</p>
                      {selectedNiches.map(niche => {
                        const nicheData = NICHES.find(n => n.id === niche);
                        return (
                          <div key={niche} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                              <span>{nicheData?.icon}</span> {nicheData?.label}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              Your personalized AI guidance will prioritize this area along with your daily checks.
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedNiches.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Your answers</p>
                      {selectedNiches.map((niche) => {
                        const nicheData = NICHES.find((item) => item.id === niche);
                        const answers = nicheGoals[niche] || {};
                        const entries = Object.entries(answers);
                        return (
                          <div key={niche} className="p-4 rounded-lg bg-white border border-gray-200">
                            <p className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                              <span>{nicheData?.icon}</span> {nicheData?.label}
                            </p>
                            {entries.length > 0 ? (
                              <div className="space-y-2">
                                {entries.map(([questionKey, answer]) => (
                                  <div key={questionKey} className="text-sm text-gray-700">
                                    <span className="font-medium text-gray-900">{questionKey.replace('q', 'Question ')}</span>: {answer}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No responses entered for this area yet.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            {(currentStep === 'quick-interview' || currentStep === 'summary') && (
              <button
                onClick={() => {
                  if (currentStep === 'quick-interview') {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex(prev => prev - 1);
                    } else if (nicheIndex > 0) {
                      setNicheIndex(prev => prev - 1);
                      setCurrentQuestionIndex(currentNicheQuestions.length - 1);
                    } else {
                      setCurrentStep('niche-selection');
                    }
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}

            {currentStep === 'niche-selection' && (
              <button
                onClick={() => setCurrentStep('summary')}
                className="ml-auto flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Skip for now
              </button>
            )}

            {currentStep === 'niche-selection' && (
              <button
                onClick={handleNicheSelectContinue}
                className="flex-1 ml-auto flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                Continue
                <ChevronRight size={18} />
              </button>
            )}

            {currentStep === 'quick-interview' && (
              <button
                onClick={advanceQuestion}
                className="flex-1 ml-auto flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50"
                disabled={!nicheGoals[currentNiche]?.[`q${currentQuestion?.id}`]}
              >
                Next
                <ChevronRight size={18} />
              </button>
            )}

            {currentStep === 'summary' && (
              <button
                onClick={handleSaveOnboarding}
                disabled={loading}
                className="flex-1 ml-auto flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Build My Plan
                    <Check size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountabilityOnboarding;
