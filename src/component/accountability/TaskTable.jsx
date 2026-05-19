import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiClock, FiTarget, FiCheckCircle, FiCircle,
  FiFilter, FiMoon, FiAlertTriangle, FiPlay, FiList, FiGrid,
} from 'react-icons/fi';
import { CATEGORY_META } from '../../data/dummyData';
import './styles/tasktable.css';
import CompactCard from './CompactCard';
import { useTaskTable } from '../../context/TaskTableContext';


// ─── helpers ────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const toMin = (s) => {
  if (!s || typeof s !== 'string' || !s.includes(':')) return 0;
  const [h, m] = s.split(':').map(Number);
  return (isNaN(h) || isNaN(m)) ? 0 : h * 60 + m;
};
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };

const hourLabel = (h) => {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
};

const getCountdown = (timeStr, status) => {
  if (status === 'completed') return null;
  const diff = toMin(timeStr) - nowMin();
  if (diff < 0) {
    const abs = Math.abs(diff);
    const val = abs < 60 ? `${abs}m ago` : `${Math.floor(abs / 60)}h ${abs % 60}m ago`;
    return { label: 'Overdue', val, cls: 'late' };
  }
  if (diff === 0) return { label: 'Starting now', val: 'Now', cls: 'soon' };
  if (diff < 60) return { label: 'Starts in', val: `${diff}m`, cls: diff < 15 ? 'soon' : '' };
  const h = Math.floor(diff / 60), m = diff % 60;
  return { label: 'Starts in', val: m ? `${h}h ${m}m` : `${h}h`, cls: '' };
};

const isOverdue = (t) => t.status !== 'completed' && toMin(t.time) < nowMin();

// ─── status dot ─────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  pending:      { borderColor: 'var(--text-secondary)', background: 'transparent' },
  'in-progress':{ borderColor: 'var(--warning)',        background: 'rgba(245,158,11,.12)' },
  completed:    { borderColor: 'var(--success)',         background: 'rgba(16,185,129,.12)' },
};

const CATEGORIES = [
  'All', 'Reflection', 'Learning', 'Habits', 'Action Tasks', 'Accountability Check-ins',
];



// ─── component ──────────────────────────────────────────────────────────────
const TaskTable = ({
  tasks = [],
  onClose,
  onStartReflect,
  onStartCheckIn,
  onToggleStatus,
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [tick, setTick] = useState(0);
  const [compact, setCompact] = useState(false); // ← NEW view toggle

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

    const { setTaskTableOpen } = useTaskTable();
  useEffect(() => {
    setTaskTableOpen(true);
    return () => setTaskTableOpen(false); // hide navbar when TaskTable unmounts
  }, []);

  const now = new Date();
  const clockStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const currentMin = nowMin();

  const filtered = (activeCategory === 'All' ? tasks : tasks.filter((t) => t.category === activeCategory))
    .slice()
    .sort((a, b) => toMin(a?.time) - toMin(b?.time));

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All' ? tasks.length : tasks.filter((t) => t.category === cat).length;
    return acc;
  }, {});

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const overdueCount = tasks.filter((t) => isOverdue(t)).length;
  const pct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  // ── EXPANDED rows (original) ────────────────────────────────────────────
  const buildExpandedRows = useCallback(() => {
    const rows = [];
    let lastHour = -1;
    let nowInserted = false;

    filtered.forEach((task, i) => {
      const tMin = toMin(task.time);
      const tHour = Math.floor(tMin / 60);
      const catM = CATEGORY_META[task.category] || {};
      const cd = getCountdown(task.time, task.status);
      const over = isOverdue(task);

      if (!nowInserted && tMin > currentMin) {
        nowInserted = true;
        rows.push(
          <div key="now-marker" className="tt-time-marker tt-tm--now">
            <FiPlay size={10} />
            <span className="tt-tm-label">NOW — {pad(now.getHours())}:{pad(now.getMinutes())}</span>
            <div className="tt-tm-line" />
          </div>
        );
      }

      if (tHour !== lastHour) {
        lastHour = tHour;
        rows.push(
          <div key={`hour-${tHour}`} className={`tt-time-marker${tMin < currentMin ? ' tt-tm--past' : ''}`}>
            <span className="tt-tm-label">{hourLabel(tHour)}</span>
            <div className="tt-tm-line" />
          </div>
        );
      }

      const isReflection = task.category === 'Reflection' && task.reflectionQuestions;
      const isCheckIn = task.category === 'Accountability Check-ins' && task.checkInPrompts;

      rows.push(
        <motion.div
          key={task.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ delay: i * 0.03, duration: 0.2 }}
          className={`tt-row${task.status === 'completed' ? ' tt-row--done' : ''}${over ? ' tt-row--overdue' : ''}`}
        >
          <button
            className="tt-status-btn"
            onClick={() => onToggleStatus?.(task.id)}
            title="Toggle status"
            style={STATUS_STYLE[task.status] || STATUS_STYLE.pending}
          >
            <span className="tt-dot-inner" style={task.status === 'completed' ? { background: 'var(--success)' } : {}} />
          </button>

          <div className="tt-row-main">
            <div className="tt-row-top">
              <span className="tt-cat-badge" style={{ background: catM.bg, color: catM.color }}>
                {catM.label || task.category}
              </span>
              {task.time && (
                <span className="tt-time-tag">
                  <FiClock size={10} />{task.time}
                </span>
              )}
              {over && <span className="tt-overdue-tag">Overdue</span>}
            </div>

            <p className={`tt-task-title${task.status === 'completed' ? ' tt-task-title--done' : ''}`}>
              {task.title}
            </p>

            {task.description && <p className="tt-task-desc">{task.description}</p>}

            {task.linkedGoal && (
              <span className="tt-linked-goal">
                <FiTarget size={9} />{task.linkedGoal}
              </span>
            )}

            <div className="tt-row-actions">
              {isReflection && task.status !== 'completed' && (
                <button className="tt-action-btn tt-action-btn--reflect" onClick={() => onStartReflect?.(task)}>
                  <FiMoon size={12} /><span>Reflect</span>
                </button>
              )}
              {isCheckIn && task.status !== 'completed' && (
                <button className="tt-action-btn tt-action-btn--checkin" onClick={() => onStartCheckIn?.(task)}>
                  <FiAlertTriangle size={12} /><span>Check-in</span>
                </button>
              )}
            </div>
          </div>

          {cd && (
            <div className="tt-countdown">
              <span className="tt-cd-label">{cd.label}</span>
              <span className={`tt-cd-value${cd.cls ? ` tt-cd--${cd.cls}` : ''}`}>{cd.val}</span>
            </div>
          )}
        </motion.div>
      );
    });

    if (!nowInserted && filtered.length > 0) {
      rows.push(
        <div key="now-end" className="tt-time-marker tt-tm--now" style={{ marginTop: 4 }}>
          <FiPlay size={10} />
          <span className="tt-tm-label">All tasks done for today</span>
          <div className="tt-tm-line" />
        </div>
      );
    }

    return rows;
  }, [filtered, currentMin, tick]);

  // ── COMPACT rows ────────────────────────────────────────────────────────
const buildCompactRows = useCallback(() => {
  const sections = [];

  // Group tasks by hour
  const hourMap = new Map(); // hour (int) → { tasks, isPast }

  filtered.forEach((task) => {
    const tMin  = toMin(task.time);
    const tHour = Math.floor(tMin / 60);
    if (!hourMap.has(tHour)) {
      hourMap.set(tHour, { tasks: [], isPast: tMin < currentMin });
    }
    hourMap.get(tHour).tasks.push(task);
  });

  let nowMarkerInserted = false;

  // Sort hours ascending
  Array.from(hourMap.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([hour, { tasks, isPast }]) => {

      // Insert NOW marker before the first future hour
      if (!nowMarkerInserted && !isPast) {
        nowMarkerInserted = true;
        sections.push(
          <div key="now-marker" className="tt-time-marker tt-tm--now">
            <FiPlay size={10} />
            <span className="tt-tm-label">
              NOW — {pad(now.getHours())}:{pad(now.getMinutes())}
            </span>
            <div className="tt-tm-line" />
          </div>
        );
      }

      sections.push(
        <div key={`section-${hour}`} className="tt-compact-section">
          {/* Hour label */}
          <div className={`tt-time-marker${isPast ? ' tt-tm--past' : ''}`}>
            <span className="tt-tm-label">{hourLabel(hour)}</span>
            <div className="tt-tm-line" />
          </div>

          {/* Cards grid */}
          <div className="tt-compact-grid">
            {tasks.map((task, i) => (
              <CompactCard
                key={task.id}
                task={task}
                index={i}
                onToggleStatus={onToggleStatus}
                onStartReflect={onStartReflect}
                onStartCheckIn={onStartCheckIn}
              />
            ))}
          </div>
        </div>
      );
    });

  // If all tasks are in the past, append "all done" marker
  if (!nowMarkerInserted && filtered.length > 0) {
    sections.push(
      <div key="now-end" className="tt-time-marker tt-tm--now" style={{ marginTop: 4 }}>
        <FiPlay size={10} />
        <span className="tt-tm-label">All tasks done for today</span>
        <div className="tt-tm-line" />
      </div>
    );
  }

  return sections;
}, [filtered, currentMin, tick]);

  return (
    <motion.div
      className="tt-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="tt-drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      >
        {/* ── HEADER ── */}
        <div className="tt-header">
          <div className="tt-header-top">
            <div>
              <p className="tt-header-eyebrow">Today's Plan</p>
              <h2 className="tt-header-title">Task Board</h2>
            </div>
            <div className="tt-header-right">
              <div className="tt-clock">
                <span className="tt-clock-time">{clockStr}</span>
                <span className="tt-clock-date">{dateStr}</span>
              </div>

              {/* ── VIEW TOGGLE ── */}
              <button
                className={`tt-view-toggle${compact ? ' tt-view-toggle--compact' : ''}`}
                onClick={() => setCompact((v) => !v)}
                title={compact ? 'Switch to expanded view' : 'Switch to compact view'}
              >
                <span className={`tt-vt-opt${!compact ? ' tt-vt-opt--active' : ''}`}>
                  <FiList size={13} />
                </span>
                <span className={`tt-vt-opt${compact ? ' tt-vt-opt--active' : ''}`}>
                  <FiGrid size={13} />
                </span>
              </button>

              <button className="tt-close" onClick={onClose}><FiX size={16} /></button>
            </div>
          </div>

          {/* progress */}
          <div className="tt-progress">
            <div className="tt-prog-row">
              <span>{completedCount} of {tasks.length} complete</span>
              <span className="tt-prog-pct">{pct}%</span>
            </div>
            <div className="tt-prog-track">
              <motion.div
                className="tt-prog-fill"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
              />
            </div>
          </div>

          {/* filter tabs */}
          <div className="tt-filter-row">
            <FiFilter size={12} className="tt-filter-icon" />
            <div className="tt-filter-tabs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`tt-filter-tab${activeCategory === cat ? ' tt-filter-tab--active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'All' ? 'All' : cat.split(' ')[0]}
                  <span className="tt-filter-count">{counts[cat]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
<div className={`tt-body${compact ? ' tt-body--compact' : ''}`}>
  {filtered.length === 0 ? (
    <div className="tt-empty" key="empty">
      <FiCheckCircle size={28} />
      <p>No tasks in this category</p>
    </div>
  ) : compact ? (
    <div className="tt-compact-wrapper">
      {buildCompactRows()}
    </div>
  ) : (
    <AnimatePresence mode="popLayout">
      {buildExpandedRows()}
    </AnimatePresence>
  )}
</div>

        {/* ── SUMMARY BAR ── */}
        <div className="tt-summary">
          <div className="tt-stat">
            <span className="tt-stat-val tt-stat-val--green">{completedCount}</span>
            <span className="tt-stat-lbl">Done</span>
          </div>
          <div className="tt-stat">
            <span className="tt-stat-val tt-stat-val--amber">{inProgressCount}</span>
            <span className="tt-stat-lbl">In Progress</span>
          </div>
          <div className="tt-stat">
            <span className="tt-stat-val tt-stat-val--red">{overdueCount}</span>
            <span className="tt-stat-lbl">Overdue</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TaskTable;