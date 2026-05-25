// ─── Dummy Data Store ───────────────────────────────────────────────────────
// Drop this in: src/data/dummyData.js (or wherever your utils/data live)

export const DUMMY_USER = {
  name: 'Alex',
  selectedNiches: ['fitness', 'academic', 'discipline'],
  nicheGoals: {
    fitness: {
      q1: 'Lose 8kg and build visible muscle',
      q2: 'Intermediate',
      q3: 'Staying motivated after a long workday',
    },
    academic: {
      q1: 'Master React and system design',
      q2: 'Intermediate',
      q3: 'Lack of structured daily study time',
    },
    discipline: {
      q1: 'Consistent morning routine by 5:30am',
      q2: 'Beginner',
      q3: 'Procrastination and late nights',
    },
  },
  onboardingCompleted: true,
};

export const DUMMY_TASKS = [
  // ── Reflection ──────────────────────────────────────────────────────────
  {
    id: 'ref-1',
    category: 'Reflection',
    title: 'Morning Mindset Check',
    description: 'Assess your mental state and set intentions for the day.',
    status: 'pending',
    time: '06:00',
    linkedGoal: 'Consistent morning routine',
    niche: 'discipline',
    reflectionQuestions: [
      'What is your energy level right now (1–10)?',
      'What is the ONE thing you must accomplish today?',
      'What could derail your focus — and how will you prevent it?',
      'Write one sentence of gratitude.',
    ],
  },
  {
    id: 'ref-2',
    category: 'Reflection',
    title: 'Evening Wind-Down Review',
    description: 'Reflect on what went well and what to improve tomorrow.',
    status: 'pending',
    time: '21:00',
    linkedGoal: 'Personal Accountability & Discipline',
    niche: 'discipline',
    reflectionQuestions: [
      'Did you accomplish your top priority today? Why or why not?',
      'What habit did you honour today?',
      'What will you do differently tomorrow?',
      'Rate today\'s discipline from 1–10.',
    ],
  },

  // ── Learning ─────────────────────────────────────────────────────────────
  {
    id: 'lrn-1',
    category: 'Learning',
    title: 'React Deep Dive — Hooks & State',
    description: '25-minute Pomodoro: study useReducer and context patterns.',
    status: 'pending',
    time: '08:00',
    linkedGoal: 'Master React and system design',
    niche: 'academic',
    reflectionQuestions: null,
  },
  {
    id: 'lrn-2',
    category: 'Learning',
    title: 'Active Recall — Yesterday\'s Notes',
    description: 'Close your notes and quiz yourself on key concepts.',
    status: 'completed',
    time: '09:30',
    linkedGoal: 'Master React and system design',
    niche: 'academic',
    reflectionQuestions: null,
  },
  {
    id: 'lrn-3',
    category: 'Learning',
    title: 'System Design — Scalability Patterns',
    description: 'Read one chapter or watch one video on distributed systems.',
    status: 'pending',
    time: '19:00',
    linkedGoal: 'Master React and system design',
    niche: 'academic',
    reflectionQuestions: null,
  },

  // ── Habits ───────────────────────────────────────────────────────────────
  {
    id: 'hab-1',
    category: 'Habits',
    title: 'Drink 8 Glasses of Water',
    description: 'Track hydration throughout the day.',
    status: 'in-progress',
    time: null,
    linkedGoal: 'Lose 8kg and build visible muscle',
    niche: 'fitness',
    reflectionQuestions: null,
  },
  {
    id: 'hab-2',
    category: 'Habits',
    title: '5:30 AM Wake-Up',
    description: 'No snooze. Feet on the floor immediately.',
    status: 'completed',
    time: '05:30',
    linkedGoal: 'Consistent morning routine',
    niche: 'discipline',
    reflectionQuestions: null,
  },
  {
    id: 'hab-3',
    category: 'Habits',
    title: 'No Phone First 30 Minutes',
    description: 'Keep phone face-down until after your morning routine.',
    status: 'pending',
    time: '05:30',
    linkedGoal: 'Consistent morning routine',
    niche: 'discipline',
    reflectionQuestions: null,
  },

  // ── Action Tasks ─────────────────────────────────────────────────────────
  {
    id: 'act-1',
    category: 'Action Tasks',
    title: 'Upper Body Strength Session',
    description: 'Push/pull workout — 45 min. Log sets and reps.',
    status: 'pending',
    time: '07:00',
    linkedGoal: 'Lose 8kg and build visible muscle',
    niche: 'fitness',
    reflectionQuestions: null,
  },
  {
    id: 'act-2',
    category: 'Action Tasks',
    title: 'Build One React Component',
    description: 'Ship one small but complete feature or component today.',
    status: 'pending',
    time: '10:00',
    linkedGoal: 'Master React and system design',
    niche: 'academic',
    reflectionQuestions: null,
  },
  {
    id: 'act-3',
    category: 'Action Tasks',
    title: 'Eliminate One Distraction',
    description: 'Delete one app or block one site that steals your time.',
    status: 'pending',
    time: null,
    linkedGoal: 'Consistent morning routine',
    niche: 'discipline',
    reflectionQuestions: null,
  },

  // ── Accountability Check-ins ──────────────────────────────────────────────
  {
    id: 'chk-1',
    category: 'Accountability Check-ins',
    title: 'Midday Accountability Pulse',
    description: 'Are you actually on track? Honest self-assessment.',
    status: 'pending',
    time: '12:00',
    linkedGoal: 'Personal Accountability & Discipline',
    niche: 'discipline',
    checkInPrompts: [
      'Have you completed your morning tasks?',
      'Are you actually working on your top priority right now?',
      'What have you been avoiding — and why?',
    ],
    reflectionQuestions: null,
  },
  {
    id: 'chk-2',
    category: 'Accountability Check-ins',
    title: 'Fitness Commitment Check',
    description: 'Did you hit your workout? No excuses — just truth.',
    status: 'pending',
    time: '20:00',
    linkedGoal: 'Lose 8kg and build visible muscle',
    niche: 'fitness',
    checkInPrompts: [
      'Did you complete your workout today?',
      'Did you track your nutrition?',
      'On a scale of 1–10, how aligned were your actions with your fitness goal?',
    ],
    reflectionQuestions: null,
  },
];

export const CATEGORY_META = {
  Reflection: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Reflection' },
  Learning: { color: '#3b5ccb', bg: 'rgba(59,92,203,0.1)', label: 'Learning' },
  Habits: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Habits' },
  'Action Tasks': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Action' },
  'Accountability Check-ins': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Check-in' },
};

export const NICHE_META = {
  spiritual: { label: 'Spiritual Growth', color: '#a855f7' },
  academic: { label: 'Academic / Learning', color: '#3b5ccb' },
  fitness: { label: 'Fitness & Health', color: '#10b981' },
  leadership: { label: 'Leadership', color: '#f59e0b' },
  discipline: { label: 'Discipline', color: '#ef4444' },
};