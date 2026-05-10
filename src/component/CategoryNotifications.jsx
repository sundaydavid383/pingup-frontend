import { useMemo, useState } from 'react';
import { Bell, Mail, MessageCircle, User, Phone, Home, ChevronDown, Trash2, CheckCheck } from 'lucide-react';
import { useNotificationContext } from '../context/NotificationContext';

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

  const [expandedNotificationId, setExpandedNotificationId] = useState(null);

  // Category icons and colors
  const categoryConfig = {
    [NOTIFICATION_CATEGORIES.INBOX]: {
      icon: Home,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      badgeColor: 'bg-gray-600',
    },
    [NOTIFICATION_CATEGORIES.COMMENTS]: {
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      badgeColor: 'bg-blue-600',
    },
    [NOTIFICATION_CATEGORIES.FOLLOWING]: {
      icon: User,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      badgeColor: 'bg-purple-600',
    },
    [NOTIFICATION_CATEGORIES.CALLS]: {
      icon: Phone,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      badgeColor: 'bg-green-600',
    },
    [NOTIFICATION_CATEGORIES.PROFILE]: {
      icon: User,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
      badgeColor: 'bg-pink-600',
    },
    [NOTIFICATION_CATEGORIES.MESSAGES]: {
      icon: Mail,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      badgeColor: 'bg-orange-600',
    },
  };

  // Sort notifications: unread first, then by date
  const sortedActiveNotifications = useMemo(() => {
    return [...activeNotifications].sort((a, b) => {
      if (a.isRead === b.isRead) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return a.isRead ? 1 : -1;
    });
  }, [activeNotifications]);

  const unreadCountInActive = unreadCountByCategory[activeCategory] || 0;

  const getCategoryIcon = (category) => {
    const config = categoryConfig[category];
    if (!config) return <Bell className="w-5 h-5 text-gray-500" />;
    const IconComponent = config.icon;
    return <IconComponent className={`w-5 h-5 ${config.color}`} />;
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Notifications</h2>
        {unreadCountByCategory[activeCategory] > 0 && (
          <button
            onClick={() => markCategoryAsRead(activeCategory)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark as read
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {Object.values(NOTIFICATION_CATEGORIES).map((cat) => {
          const config = categoryConfig[cat];
          const unreadCount = unreadCountByCategory[cat] || 0;
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm
                ${isActive
                  ? `${config.bgColor} ${config.color} border-b-2 ${config.color.replace('text', 'border')}`
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {getCategoryIcon(cat)}
              <span>{CATEGORY_LABELS[cat]}</span>
              {unreadCount > 0 && (
                <span className={`ml-1 px-2 py-0.5 text-xs font-bold text-white rounded-full ${config.badgeColor}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar min-h-[50vh] max-h-[70vh] custom-scrollbar pb-6">
        {sortedActiveNotifications.length > 0 ? (
          sortedActiveNotifications.map((notif) => {
            const config = categoryConfig[activeCategory];
            const isExpanded = expandedNotificationId === notif._id;

            return (
              <div
                key={notif._id}
                className={`group flex flex-col rounded-xl cursor-pointer transition-all shadow-sm p-4
                  ${notif.isRead ? 'bg-gray-50' : config.bgColor}
                  hover:shadow-md hover:scale-[1.01]`}
              >
                {/* Main content */}
                <div
                  onClick={() => handleNotificationClick(notif)}
                  className="flex items-start gap-4"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getCategoryIcon(activeCategory)}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">
                      {notif.text}
                    </p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Unread indicator */}
                  {!notif.isRead && (
                    <span className={`flex-shrink-0 w-3 h-3 rounded-full shadow-sm animate-pulse ${config.badgeColor}`}></span>
                  )}
                </div>

                {/* Action buttons (show on hover) */}
                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif._id);
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif._id);
                    }}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Bell className="w-10 h-10 text-gray-300" />
            <p className="text-gray-500 text-center font-medium">
              No {CATEGORY_LABELS[activeCategory].toLowerCase()} notifications yet
            </p>
            <p className="text-gray-400 text-sm">
              You'll see notifications here when you receive them
            </p>
          </div>
        )}
      </div>

      {/* Category actions */}
      {sortedActiveNotifications.length > 0 && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (window.confirm(`Clear all ${CATEGORY_LABELS[activeCategory].toLowerCase()} notifications?`)) {
                deleteCategoryNotifications(activeCategory);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear {CATEGORY_LABELS[activeCategory].toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryNotifications;
