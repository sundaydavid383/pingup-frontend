import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiClock, FiTarget, FiMoon, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { CATEGORY_META } from '../../data/dummyData';

const toMin = (s) => {
  if (!s || typeof s !== 'string' || !s.includes(':')) return 0;
  const [h, m] = s.split(':').map(Number);
  return isNaN(h) || isNaN(m) ? 0 : h * 60 + m;
};
const nowMin = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
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

const STATUS_CYCLE = { pending: 'in-progress', 'in-progress': 'completed', completed: 'pending' };

const STATUS_DOT = {
  pending:       { border: '2px solid #94a3b8', background: 'transparent' },
  'in-progress': { border: '2px solid #f59e0b', background: 'rgba(245,158,11,0.18)' },
  completed:     { border: '2px solid #10b981', background: 'rgba(16,185,129,0.18)' },
};

// ─── Floating detail panel rendered in a portal ───────────────────────────────
const HoverPanel = ({ task, anchorRect, onToggleStatus, onStartReflect, onStartCheckIn }) => {
  const panelRef = useRef(null);
  const PANEL_WIDTH = 240;
  const OFFSET = 10;

  const catM    = CATEGORY_META?.[task.category] || {};
  const cd      = getCountdown(task.time, task.status);
  const over    = isOverdue(task);
  const isDone  = task.status === 'completed';

  const catColor = catM.color || 'var(--primary-color, #4f6ef7)';
  const catBg    = catM.bg    || 'rgba(79,110,247,0.10)';
  const catLabel = catM.label || task.category;

  const cdColor =
    !cd           ? 'var(--primary-color, #4f6ef7)'
    : cd.cls === 'late' ? '#ef4444'
    : cd.cls === 'soon' ? '#f59e0b'
    :                     'var(--primary-color, #4f6ef7)';

  const isReflection = task.category === 'Reflection' && task.reflectionQuestions;
  const isCheckIn    = task.category === 'Accountability Check-ins' && task.checkInPrompts;

  // Position: try left of anchor, fall back to right
  const spaceOnLeft = anchorRect.left - OFFSET;
  const placeLeft   = spaceOnLeft >= PANEL_WIDTH;

  const left = placeLeft
    ? anchorRect.left - PANEL_WIDTH - OFFSET
    : anchorRect.right + OFFSET;

  // Vertical: align top of panel with top of card, but clamp to viewport
  const viewportH = window.innerHeight;
  const PANEL_EST_HEIGHT = 200;
  const rawTop = anchorRect.top;
  const top = Math.min(rawTop, viewportH - PANEL_EST_HEIGHT - 12);

  const panelStyle = {
    position:    'fixed',
    top:         `${top}px`,
    left:        `${left}px`,
    width:       `${PANEL_WIDTH}px`,
    zIndex:      99999,
    background:  '#ffffff',
    border:      over
                   ? '1.5px solid rgba(239,68,68,0.35)'
                   : isDone
                   ? '1.5px solid rgba(16,185,129,0.30)'
                   : '1.5px solid rgba(79,110,247,0.22)',
    borderRadius: '12px',
    boxShadow:   '0 8px 32px rgba(0,0,0,0.14)',
    padding:     '12px',
    display:     'flex',
    flexDirection: 'column',
    gap:         '8px',
    pointerEvents: 'none',   // panel is display-only; buttons below override this
  };

  return createPortal(
    <div ref={panelRef} style={panelStyle}>

      {/* category + overdue badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '9px', fontWeight: 700,
          letterSpacing: '0.05em', textTransform: 'uppercase',
          padding: '2px 8px', borderRadius: '99px',
          background: catBg, color: catColor,
        }}>
          {catLabel}
        </span>
        {over && (
          <span style={{
            fontSize: '9px', fontWeight: 700,
            color: '#ef4444',
            background: 'rgba(239,68,68,0.09)',
            borderRadius: '99px', padding: '2px 7px',
          }}>
            Overdue
          </span>
        )}
        {isDone && (
          <span style={{
            fontSize: '9px', fontWeight: 700,
            color: '#10b981',
            background: 'rgba(16,185,129,0.09)',
            borderRadius: '99px', padding: '2px 7px',
          }}>
            Completed
          </span>
        )}
      </div>

      {/* title */}
      <p style={{
        margin: 0, fontSize: '12px', fontWeight: 700,
        color: isDone ? '#94a3b8' : '#1e293b',
        textDecoration: isDone ? 'line-through' : 'none',
        lineHeight: 1.4,
      }}>
        {task.title}
      </p>

      {/* countdown */}
      {cd && (
        <span style={{ fontSize: '11px', fontWeight: 700, color: cdColor }}>
          {cd.label}: {cd.val}
        </span>
      )}

      {/* description */}
      {task.description && (
        <p style={{
          margin: 0, fontSize: '11px',
          color: '#64748b', lineHeight: 1.55,
        }}>
          {task.description}
        </p>
      )}

      {/* linked goal */}
      {task.linkedGoal && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '10px', color: '#94a3b8', fontWeight: 500,
        }}>
          <FiTarget size={9} />
          {task.linkedGoal}
        </span>
      )}

      {/* action buttons — need pointer events */}
      {(isReflection || isCheckIn) && !isDone && (
        <div style={{
          display: 'flex', gap: '6px', marginTop: '2px',
          flexWrap: 'wrap', pointerEvents: 'auto',
        }}>
          {isReflection && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartReflect?.(task); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '8px',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.22)',
                color: '#8b5cf6',
              }}
            >
              <FiMoon size={11} /> Reflect
            </button>
          )}
          {isCheckIn && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartCheckIn?.(task); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '8px',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.22)',
                color: '#ef4444',
              }}
            >
              <FiAlertTriangle size={11} /> Check-in
            </button>
          )}
        </div>
      )}

      {isDone && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '11px', color: '#10b981', fontWeight: 600,
        }}>
          <FiCheckCircle size={12} /> Completed
        </div>
      )}
    </div>,
    document.body
  );
};

// ─── CompactCard ─────────────────────────────────────────────────────────────
const CompactCard = ({ task, onToggleStatus, onStartReflect, onStartCheckIn }) => {
  const [hovered, setHovered]     = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const cardRef = useRef(null);

  const catM   = CATEGORY_META?.[task.category] || {};
  const cd     = getCountdown(task.time, task.status);
  const over   = isOverdue(task);
  const isDone = task.status === 'completed';

  const catColor = catM.color || 'var(--primary-color, #4f6ef7)';

  const cdColor =
    !cd           ? 'var(--primary-color, #4f6ef7)'
    : cd.cls === 'late' ? '#ef4444'
    : cd.cls === 'soon' ? '#f59e0b'
    :                     'var(--primary-color, #4f6ef7)';

  const handleMouseEnter = () => {
    if (cardRef.current) {
      setAnchorRect(cardRef.current.getBoundingClientRect());
    }
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setAnchorRect(null);
  };

  // ── pill style (NEVER changes size on hover) ──────────────────────────────
  const pillStyle = {
    display:      'flex',
    alignItems:   'center',
    gap:          '7px',
    padding:      '6px 10px',
    minHeight:    '34px',
    background:   over   ? 'rgba(239,68,68,0.06)'
                : isDone ? 'rgba(16,185,129,0.06)'
                :          '#ffffff',
    border:       `1.5px solid ${
                    over   ? 'rgba(239,68,68,0.30)'
                  : isDone ? 'rgba(16,185,129,0.28)'
                  : hovered ? 'rgba(79,110,247,0.35)'
                  :          'rgba(0,0,0,0.09)'
                  }`,
    borderRadius: '10px',
    cursor:       'pointer',
    transition:   'box-shadow 0.18s, border-color 0.18s, background 0.18s',
    boxSizing:    'border-box',
    width:        '100%',
    position:     'relative',
    userSelect:   'none',
    opacity:      isDone ? 0.55 : 1,
    boxShadow:    hovered ? '0 2px 12px rgba(0,0,0,0.09)' : 'none',
    // CRITICAL: no height or transform changes on hover
  };

  return (
    <>
      <div
        ref={cardRef}
        style={pillStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* status dot */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleStatus?.(task.id); }}
          title="Toggle status"
          style={{
            width: '16px', height: '16px',
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.15s',
            padding: 0,
            ...STATUS_DOT[task.status] || STATUS_DOT.pending,
          }}
        >
          {isDone && (
            <span style={{
              width: '7px', height: '7px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'block',
            }} />
          )}
        </button>

        {/* category colour dot */}
        <span style={{
          width: '7px', height: '7px',
          borderRadius: '50%',
          background: catColor,
          flexShrink: 0,
        }} />

        {/* title */}
        <p style={{
          flex: 1,
          margin: 0,
          fontSize: '12px',
          fontWeight: 600,
          color: isDone ? '#94a3b8' : 'var(--ob-header-h1, #1e293b)',
          textDecoration: isDone ? 'line-through' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.35,
        }}>
          {task.title}
        </p>

        {/* meta: time + countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {task.time && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              fontSize: '10px', color: '#64748b', fontWeight: 500,
              whiteSpace: 'nowrap',
            }}>
              <FiClock size={9} />
              {task.time}
            </span>
          )}
          {over && (
            <span style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: '#ef4444',
              flexShrink: 0,
            }} />
          )}
          {cd && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: cdColor,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {cd.val}
            </span>
          )}
        </div>
      </div>

      {/* floating panel rendered outside the card DOM via portal */}
      {hovered && anchorRect && (
        <HoverPanel
          task={task}
          anchorRect={anchorRect}
          onToggleStatus={onToggleStatus}
          onStartReflect={onStartReflect}
          onStartCheckIn={onStartCheckIn}
        />
      )}
    </>
  );
};

export default CompactCard;