import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiClock, FiTarget, FiCheckCircle, FiCircle,
  FiFilter, FiMoon, FiAlertTriangle, FiPlay,
} from 'react-icons/fi';
import { CATEGORY_META } from '../../data/dummyData';

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
/**
 * TaskTable
 *
 * Props:
 *   tasks          – array of task objects
 *   onClose        – () => void
 *   onStartReflect – (task) => void
 *   onStartCheckIn – (task) => void
 *   onToggleStatus – (taskId) => void  (cycles pending → in-progress → completed)
 */
const TaskTable = ({
  tasks = [],
  onClose,
  onStartReflect,
  onStartCheckIn,
  onToggleStatus,
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [tick, setTick] = useState(0); // forces re-render every second for live clock

  // live clock tick
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const clockStr   = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateStr    = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const currentMin = nowMin();

  // filter + sort by time
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

  // build rows with time-group markers and a "NOW" divider
  const buildRows = useCallback(() => {
    const rows = [];
    let lastHour = -1;
    let nowInserted = false;

    filtered.forEach((task, i) => {
      const tMin  = toMin(task.time);
      const tHour = Math.floor(tMin / 60);
      const catM  = CATEGORY_META[task.category] || {};
      const cd    = getCountdown(task.time, task.status);
      const over  = isOverdue(task);

      // inject NOW marker
      if (!nowInserted && tMin > currentMin) {
        nowInserted = true;
        rows.push(
          <div key="now-marker" className="tt-time-marker tt-tm--now">
            <FiPlay size={10} />
            <span className="tt-tm-label">
              NOW — {pad(now.getHours())}:{pad(now.getMinutes())}
            </span>
            <div className="tt-tm-line" />
          </div>
        );
      }

      // hour group header
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
      const isCheckIn    = task.category === 'Accountability Check-ins' && task.checkInPrompts;

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
          {/* status dot */}
          <button
            className="tt-status-btn"
            onClick={() => onToggleStatus?.(task.id)}
            title="Toggle status"
            style={STATUS_STYLE[task.status] || STATUS_STYLE.pending}
          >
            <span
              className="tt-dot-inner"
              style={task.status === 'completed' ? { background: 'var(--success)' } : {}}
            />
          </button>

          {/* main content */}
          <div className="tt-row-main">
            <div className="tt-row-top">
              <span
                className="tt-cat-badge"
                style={{ background: catM.bg, color: catM.color }}
              >
                {catM.label || task.category}
              </span>
              {task.time && (
                <span className="tt-time-tag">
                  <FiClock size={10} />
                  {task.time}
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
                <FiTarget size={9} />
                {task.linkedGoal}
              </span>
            )}

            <div className="tt-row-actions">
              {isReflection && task.status !== 'completed' && (
                <button className="tt-action-btn tt-action-btn--reflect" onClick={() => onStartReflect?.(task)}>
                  <FiMoon size={12} />
                  <span>Reflect</span>
                </button>
              )}
              {isCheckIn && task.status !== 'completed' && (
                <button className="tt-action-btn tt-action-btn--checkin" onClick={() => onStartCheckIn?.(task)}>
                  <FiAlertTriangle size={12} />
                  <span>Check-in</span>
                </button>
              )}
            </div>
          </div>

          {/* countdown */}
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
        <div className="tt-body">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0
              ? (
                <div className="tt-empty" key="empty">
                  <FiCheckCircle size={28} />
                  <p>No tasks in this category</p>
                </div>
              )
              : buildRows()
            }
          </AnimatePresence>
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

      <style>{`
        /* ── OVERLAY & DRAWER ── */
        .tt-overlay {
          position: fixed;
          inset: 0;
          z-index: 7777;
          background: var(--deeper-opaque-secondary);
          backdrop-filter: var(--backdrop-blur);
          display: flex;
          justify-content: flex-end;
        }
        .tt-drawer {
          width: 100%;
          max-width: 540px;
          height: 100%;
          background: var(--ob-surface);
          display: flex;
          flex-direction: column;
          box-shadow: -12px 0 48px rgba(0,0,0,0.22);
        }

        /* ── HEADER ── */
        .tt-header {
          background: var(--white);
          border-bottom: 1px solid var(--ob-mesh-1);
          padding: 1.25rem 1.25rem 0;
          flex-shrink: 0;
        }
        .tt-header-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 12px;
        }
        .tt-header-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--primary-color);
          margin: 0 0 3px;
        }
        .tt-header-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--ob-header-h1);
          margin: 0;
        }
        .tt-header-right {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .tt-clock {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .tt-clock-time {
          font-size: 20px;
          font-weight: 800;
          color: var(--ob-header-h1);
          letter-spacing: .02em;
          font-variant-numeric: tabular-nums;
        }
        .tt-clock-date {
          font-size: 10px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .tt-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--ob-surface2);
          border: 1px solid var(--ob-mesh-1);
          border-radius: 9px;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-default);
          flex-shrink: 0;
        }
        .tt-close:hover { background: var(--hover-light); color: var(--ob-header-h1); }

        /* ── PROGRESS ── */
        .tt-progress { margin-bottom: 1rem; }
        .tt-prog-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 5px;
        }
        .tt-prog-pct { font-weight: 700; color: var(--primary-color); }
        .tt-prog-track {
          height: 5px;
          background: var(--ob-surface2);
          border-radius: 99px;
          overflow: hidden;
        }
        .tt-prog-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-color), var(--hover-dark));
          border-radius: 99px;
        }

        /* ── FILTER TABS ── */
        .tt-filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 0;
        }
        .tt-filter-row::-webkit-scrollbar { display: none; }
        .tt-filter-icon { color: var(--text-secondary); flex-shrink: 0; }
        .tt-filter-tabs {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          padding-bottom: 1px;
        }
        .tt-filter-tabs::-webkit-scrollbar { display: none; }
        .tt-filter-tab {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: .4rem .75rem;
          border-radius: 8px 8px 0 0;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: var(--transition-default);
        }
        .tt-filter-tab:hover { color: var(--primary-color); }
        .tt-filter-tab--active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
          background: var(--very-light-opaque-primary);
        }
        .tt-filter-count {
          font-size: 9px;
          font-weight: 700;
          background: var(--very-light-opaque-primary);
          color: var(--primary-color);
          padding: 1px 5px;
          border-radius: 99px;
        }

        /* ── BODY ── */
        .tt-body {
          flex: 1;
          overflow-y: auto;
          padding: .9rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-body::-webkit-scrollbar { width: 3px; }
        .tt-body::-webkit-scrollbar-thumb {
          background: var(--ob-niche-glow);
          border-radius: 99px;
        }

        /* ── TIME MARKERS ── */
        .tt-time-marker {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: .15rem 0;
          margin-top: 6px;
        }
        .tt-tm-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--primary-color);
          background: var(--ob-surface);
          padding-right: 4px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .tt-tm-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(var(--primary-rgb),.3), rgba(var(--primary-rgb),0));
        }
        .tt-time-marker.tt-tm--now .tt-tm-label { color: var(--red); }
        .tt-time-marker.tt-tm--now .tt-tm-line {
          background: linear-gradient(90deg, rgba(239,68,68,.5), rgba(239,68,68,0));
        }
        .tt-time-marker.tt-tm--past .tt-tm-label { color: var(--text-secondary); }
        .tt-time-marker.tt-tm--past .tt-tm-line {
          background: linear-gradient(90deg, rgba(148,163,184,.3), rgba(148,163,184,0));
        }

        /* ── TASK ROW ── */
        .tt-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: var(--white);
          border: 1px solid var(--ob-mesh-1);
          border-radius: 14px;
          padding: .8rem .95rem;
          transition: box-shadow .18s, opacity .18s;
        }
        .tt-row:hover { box-shadow: 0 2px 14px var(--ob-niche-glow); }
        .tt-row--done { opacity: .55; }
        .tt-row--overdue {
          border-color: rgba(239,68,68,.22);
          background: rgba(239,68,68,.025);
        }

        /* ── STATUS BUTTON / DOT ── */
        .tt-status-btn {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid;
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 2px;
          transition: transform .15s;
          padding: 0;
        }
        .tt-status-btn:hover { transform: scale(1.25); }
        .tt-dot-inner {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: block;
        }

        /* ── ROW CONTENT ── */
        .tt-row-main { flex: 1; min-width: 0; }
        .tt-row-top {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        .tt-cat-badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 99px;
        }
        .tt-time-tag {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .tt-overdue-tag {
          font-size: 9px;
          font-weight: 700;
          color: var(--red);
          background: rgba(239,68,68,.09);
          border-radius: 99px;
          padding: 2px 7px;
        }
        .tt-task-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--ob-header-h1);
          margin: 0 0 3px;
          line-height: 1.4;
        }
        .tt-task-title--done {
          text-decoration: line-through;
          color: var(--text-secondary);
        }
        .tt-task-desc {
          font-size: 11px;
          color: var(--text-muted);
          margin: 0 0 5px;
          line-height: 1.5;
        }
        .tt-linked-goal {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .tt-row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 6px;
        }
        .tt-action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: .3rem .6rem;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid;
          white-space: nowrap;
          transition: var(--transition-default);
        }
        .tt-action-btn--reflect {
          background: rgba(139,92,246,.06);
          border-color: rgba(139,92,246,.2);
          color: #8b5cf6;
        }
        .tt-action-btn--reflect:hover { background: rgba(139,92,246,.13); }
        .tt-action-btn--checkin {
          background: rgba(239,68,68,.06);
          border-color: rgba(239,68,68,.2);
          color: var(--red);
        }
        .tt-action-btn--checkin:hover { background: rgba(239,68,68,.12); }

        /* ── COUNTDOWN ── */
        .tt-countdown {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
          min-width: 64px;
        }
        .tt-cd-label {
          font-size: 9px;
          color: var(--text-secondary);
          font-weight: 600;
          letter-spacing: .04em;
          text-transform: uppercase;
          text-align: right;
        }
        .tt-cd-value {
          font-size: 12px;
          font-weight: 700;
          color: var(--primary-color);
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .tt-cd--late  { color: var(--red); }
        .tt-cd--soon  { color: var(--warning); }

        /* ── EMPTY ── */
        .tt-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 3rem;
          color: var(--text-secondary);
          text-align: center;
        }
        .tt-empty p { font-size: 13px; margin: 0; }

        /* ── SUMMARY BAR ── */
        .tt-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          background: var(--white);
          border-top: 1px solid var(--ob-mesh-1);
          flex-shrink: 0;
        }
        .tt-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: .7rem 1rem;
          gap: 2px;
          border-right: 1px solid var(--ob-mesh-1);
        }
        .tt-stat:last-child { border-right: none; }
        .tt-stat-val {
          font-size: 18px;
          font-weight: 800;
          color: var(--ob-header-h1);
        }
        .tt-stat-val--green { color: var(--success); }
        .tt-stat-val--amber { color: var(--warning); }
        .tt-stat-val--red   { color: var(--red); }
        .tt-stat-lbl {
          font-size: 10px;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .06em;
        }
      `}</style>
    </motion.div>
  );
};

export default TaskTable;