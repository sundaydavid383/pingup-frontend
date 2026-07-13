import { useMemo, useState, useRef, useEffect } from 'react';
import { Bell, Mail, MessageCircle, User, Phone, Home, Trash2, CheckCheck } from 'lucide-react';
import { useNotificationContext, READ_ON_VIEW_CATEGORIES } from '../context/NotificationContext';

const CategoryNotifications = () => {
  const {
    NOTIFICATION_CATEGORIES,
    CATEGORY_LABELS,
    activeCategory,
    setActiveCategory,
    activeNotifications,
    unreadCountByCategory,
    markAsRead,
    deleteNotification,
    markCategoryAsRead,
    deleteCategoryNotifications,
  } = useNotificationContext();

  const VIEW_READ_DELAY_MS = 1200; // must stay visibly in view this long before it counts
const itemRefs = useRef(new Map());
const visibleTimers = useRef(new Map());
const observerRef = useRef(null);

useEffect(() => {
  if (!READ_ON_VIEW_CATEGORIES.has(activeCategory)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.dataset.notifId;
        if (!id) return;

        if (entry.isIntersecting) {
          if (visibleTimers.current.has(id)) return;
          const timer = setTimeout(() => {
            markAsRead(id);
            visibleTimers.current.delete(id);
          }, VIEW_READ_DELAY_MS);
          visibleTimers.current.set(id, timer);
        } else {
          const timer = visibleTimers.current.get(id);
          if (timer) {
            clearTimeout(timer);
            visibleTimers.current.delete(id);
          }
        }
      });
    },
    { threshold: 0.6 }
  );

  observerRef.current = observer;
  itemRefs.current.forEach((el) => el && observer.observe(el));

  return () => {
    observer.disconnect();
    visibleTimers.current.forEach(clearTimeout);
    visibleTimers.current.clear();
  };
}, [activeCategory, sortedActiveNotifications, markAsRead]); 

  const categoryConfig = {
    [NOTIFICATION_CATEGORIES.INBOX]:     { icon: Home          },
    [NOTIFICATION_CATEGORIES.COMMENTS]:  { icon: MessageCircle },
    [NOTIFICATION_CATEGORIES.FOLLOWING]: { icon: User          },
    [NOTIFICATION_CATEGORIES.CALLS]:     { icon: Phone         },
    [NOTIFICATION_CATEGORIES.PROFILE]:   { icon: User          },
    [NOTIFICATION_CATEGORIES.MESSAGES]:  { icon: Mail          },
  };

  const sortedActiveNotifications = useMemo(() => {
    return [...activeNotifications].sort((a, b) => {
      if (a.isRead === b.isRead) return new Date(b.createdAt) - new Date(a.createdAt);
      return a.isRead ? 1 : -1;
    });
  }, [activeNotifications]);

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    if (notif.link) window.location.href = notif.link;
  };

  const CatIcon = ({ cat, size = 18 }) => {
    const Ic = categoryConfig[cat]?.icon || Bell;
    return <Ic size={size} />;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Google+Sans+Text:wght@400;500&display=swap');

        /* ── root ── */
        .gn-root {
          font-family: 'Google Sans Text', 'Segoe UI', sans-serif;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,.10), 0 1px 2px rgba(0,0,0,.06);
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── header ── */
        .gn-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 16px 14px;
          border-bottom: 1px solid #f1f3f4;
        }
        .gn-title {
          font-family: 'Google Sans', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #202124;
          letter-spacing: -.3px;
        }
        .gn-mark-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 20px;
          border: 1.5px solid #1a73e8;
          background: transparent;
          color: #1a73e8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background .15s;
          font-family: inherit;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .gn-mark-btn:hover { background: #e8f0fe; }

        /* ── tabs ── */
        /*
         * Mobile-first: tabs are icon-only, distributed evenly.
         * flex:1 + min-width:0 ensures all 6 tabs always fit without
         * overflowing the container, even on 320px screens.
         */
        .gn-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: space-between;
          overflow-x: auto;
          scrollbar-width: none;
          border-bottom: 1px solid #e8eaed;
          padding: 0 10px;
          min-width: 0;
        }
        .gn-tabs::-webkit-scrollbar { display: none; }

        .gn-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 11px 0 9px;
          border: none;
          background: transparent;
          color: #5f6368;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          border-bottom: 3px solid transparent;
          transition: color .15s, background .15s;
          font-family: inherit;
          flex: 1 1 0;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gn-tab:hover { color: #1a73e8; background: #f8f9fa; }
        .gn-tab.active { color: #1a73e8; border-bottom-color: #1a73e8; }

        .gn-tab-label {
          display: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gn-badge {
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 9px;
          background: #1a73e8;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-left: 2px;
        }
        .gn-tab:not(.active) .gn-badge { background: #5f6368; }

        /* ── list ── */
        .gn-list {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          /* min-height ensures empty state looks intentional */
          min-height: 200px;
          /*
           * max-height is viewport-relative so the card never pushes
           * past the screen on any device — 100dvh accounts for mobile
           * browser chrome (address bar, nav bar).
           * We subtract: ~60px header + ~50px tabs + ~48px footer + 80px
           * for breathing room and the sticky removal bar below.
           */
          max-height: calc(100dvh - 320px);
          padding: 4px 0;
        }
        .gn-list::-webkit-scrollbar { width: 4px; }
        .gn-list::-webkit-scrollbar-thumb { background: #dadce0; border-radius: 4px; }

        /* ── item ── */
        .gn-item {
          display: flex;
          flex-direction: column;
          padding: 13px 16px;
          cursor: pointer;
          transition: background .12s;
          border-left: 3px solid transparent;
          box-sizing: border-box;
        }
        .gn-item:hover { background: #f8f9fa; }
        .gn-item.unread {
          background: #e8f0fe22;
          border-left-color: #1a73e8;
        }
        .gn-item.unread:hover { background: #e8f0fe44; }

        .gn-item-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
          width: 100%;
        }
        .gn-icon-wrap {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #e8f0fe;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a73e8;
          margin-top: 1px;
        }
        .gn-item.unread .gn-icon-wrap { background: #1a73e8; color: #fff; }

        .gn-text {
          flex: 1 1 0;
          min-width: 0;
          overflow-wrap: anywhere;
          word-wrap: break-word;
          word-break: break-word;
        }
        .gn-msg {
          font-size: 14px;
          color: #202124;
          font-weight: 400;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          overflow-wrap: anywhere;
          word-wrap: break-word;
          word-break: break-word;
        }
        .gn-item.unread .gn-msg { font-weight: 500; }
        .gn-time { font-size: 12px; color: #80868b; margin-top: 3px; }

        .gn-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #1a73e8;
          flex-shrink: 0;
          margin-top: 5px;
          animation: pulse-dot 2s ease infinite;
        }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: .6; transform: scale(.85); }
        }

        .gn-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
          padding-left: 50px;
          margin-top: 8px;
          opacity: 0;
          transform: translateY(3px);
          transition: opacity .15s, transform .15s;
          box-sizing: border-box;
        }
        .gn-item:hover .gn-actions { opacity: 1; transform: translateY(0); }

        .gn-act-btn {
          padding: 6px 12px;
          border-radius: 12px;
          border: none;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background .12s;
          white-space: nowrap;
        }
        .gn-act-read { background: #e8f0fe; color: #1a73e8; }
        .gn-act-read:hover { background: #c5d8fc; }
        .gn-act-del  { background: #fce8e6; color: #d93025; }
        .gn-act-del:hover  { background: #f5c6c3; }

        /* ── empty ── */
        .gn-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 48px 24px;
          color: #80868b;
          text-align: center;
        }
        .gn-empty svg { color: #dadce0; }
        .gn-empty-title { font-size: 15px; font-weight: 500; color: #5f6368; }
        .gn-empty-sub   { font-size: 13px; }

        /* ── footer ── */
        .gn-footer {
          border-top: 1px solid #f1f3f4;
          padding: 10px 16px;
          display: flex;
          gap: 12px;
        }
        .gn-footer-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 20px;
          border: none;
          background: transparent;
          color: #d93025;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background .15s;
        }
        .gn-footer-btn:hover { background: #fce8e6; }

        /* ─────────────────────────────────────────────────
         * RESPONSIVE BREAKPOINTS
         * ─────────────────────────────────────────────────
         * 320–639px  → icon-only tabs, compact spacing
         * 640–1023px → icon + label tabs, wrapped / flexible
         * 1024px+    → standard desktop spacing
         */

        /* 640px+: show tab labels and a bit more padding */
        @media (min-width: 640px) {
          .gn-tabs    { padding: 0 16px; justify-content: flex-start; }
          .gn-tab     { flex: 0 1 auto; padding: 13px 14px 11px; gap: 6px; }
          .gn-tab-label { display: inline; }
          .gn-badge   { margin-left: 0; }

          .gn-header  { padding: 18px 24px 14px; }
          .gn-footer  { padding: 10px 20px; }
          .gn-item    { padding: 13px 20px; }
        }

        /* 768px+: slightly more room for tabs and list height */
        @media (min-width: 768px) {
          .gn-tab { padding: 13px 16px 11px; }
          .gn-list { max-height: calc(100dvh - 280px); }
        }

        /* 1024px+: sidebar visible, allow more vertical height */
        @media (min-width: 1024px) {
          .gn-list { max-height: calc(100dvh - 260px); }
        }
      `}</style>

      <div className="gn-root">
        {/* Header */}
        <div className="gn-header">
          <span className="gn-title">Notifications</span>
          {unreadCountByCategory[activeCategory] > 0 && (
            <button className="gn-mark-btn" onClick={() => markCategoryAsRead(activeCategory)}>
              <CheckCheck size={15} />
              Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="gn-tabs">
          {Object.values(NOTIFICATION_CATEGORIES).map((cat) => {
            const count = unreadCountByCategory[cat] || 0;
            return (
              <button
                key={cat}
                className={`gn-tab${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                title={CATEGORY_LABELS[cat]}
                aria-label={`${CATEGORY_LABELS[cat]}${count > 0 ? `, ${count} unread` : ''}`}
              >
                <CatIcon cat={cat} size={17} />
                <span className="gn-tab-label">{CATEGORY_LABELS[cat]}</span>
                {count > 0 && <span className="gn-badge" aria-hidden="true">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="gn-list">
          {sortedActiveNotifications.length > 0 ? (
            sortedActiveNotifications.map((notif) => (
              <div
  key={notif._id}
  ref={(el) => {
    if (el) {
      itemRefs.current.set(notif._id, el);
      if (READ_ON_VIEW_CATEGORIES.has(activeCategory) && !notif.isRead && observerRef.current) {
        observerRef.current.observe(el);
      }
    } else {
      itemRefs.current.delete(notif._id);
    }
  }}
  data-notif-id={notif._id}
  className={`gn-item${!notif.isRead ? ' unread' : ''}`}
  onClick={() => handleNotificationClick(notif)}
>
                <div className="gn-item-row">
                  <div className="gn-icon-wrap">
                    <CatIcon cat={activeCategory} size={18} />
                  </div>
                  <div className="gn-text">
                    <p className="gn-msg">{notif.text}</p>
                    <span className="gn-time">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  {!notif.isRead && <span className="gn-dot" />}
                </div>
                <div className="gn-actions">
                  {!notif.isRead && (
                    <button
                      className="gn-act-btn gn-act-read"
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    className="gn-act-btn gn-act-del"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="gn-empty">
              <Bell size={40} />
              <p className="gn-empty-title">
                No {CATEGORY_LABELS[activeCategory]?.toLowerCase()} notifications
              </p>
              <p className="gn-empty-sub">You'll see them here when they arrive</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {sortedActiveNotifications.length > 0 && (
          <div className="gn-footer">
            <button
              className="gn-footer-btn"
              onClick={() => {
                if (window.confirm(`Clear all ${CATEGORY_LABELS[activeCategory]?.toLowerCase()} notifications?`)) {
                  deleteCategoryNotifications(activeCategory);
                }
              }}
            >
              <Trash2 size={15} />
              Clear {CATEGORY_LABELS[activeCategory]?.toLowerCase()}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CategoryNotifications;