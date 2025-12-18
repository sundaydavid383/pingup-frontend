import { useCallback, useMemo } from "react"; 
import { Bell, Mail, UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationSkeleton from "../component/NotificationSkeleton";
import BackButton from "../component/shared/BackButton";
import NotificationRemovalBar from "../component/shared/NotificationRemovalBar";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";
import RightSidebar from "../component/RightSidebar";

const Notification = () => {
  const { notifications, handleRead, loadingNotifications, sponsors } = useAuth();

  const getIcon = (type) => {
    switch (type) {
      case "connection": return <UserPlus className="w-5 h-5 text-blue-500" />;
      case "message": return <Mail className="w-5 h-5 text-green-500" />;
      case "system": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleClick = useCallback(
    (notif) => {
      handleRead(notif._id);
      if (notif.link) {
        const baseUrl = import.meta.env.VITE_CLIENT_URL || "http://localhost:5173";
        window.location.href = baseUrl + notif.link;
      }
    },
    [handleRead]
  );

  const sortedNotifications = useMemo(() => {
    if (!notifications) return [];
    return [...notifications].sort((a, b) => {
      if (a.isRead === b.isRead) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return a.isRead ? 1 : -1;
    });
  }, [notifications]);

  if (loadingNotifications) return <NotificationSkeleton />;

  return (
    <div className="flex">
    <div className="w-full max-w-3xl mx-auto bg-white  rounded-2xl shadow-lg p-6 space-y-6 relative">
      {/* <BackButton top="2" right="2" /> */}
      <h2 className="text-2xl font-semibold text-gray-800">Notifications</h2>

      <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar min-h-[80vh] custom-scrollbar pb-6">
        {sortedNotifications.length > 0 ? (
          sortedNotifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClick(n)}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all shadow-sm
                ${n.isRead ? "bg-gray-50" : "bg-blue-50"} 
                hover:shadow-md hover:scale-[1.02]`}
            >
              <div className="flex-shrink-0">{getIcon(n.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{n.text}</p>
                <span className="text-xs text-gray-500">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              {!n.isRead && (
                <span className="w-3 h-3 bg-blue-600 rounded-full shadow-sm animate-pulse"></span>
              )}
            </div>
          ))
        ) : (
<div className="flex flex-col items-center justify-center mt-4 space-y-2">
  {/* ⚠️ Alert icon */}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-red-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>

  <p className="text-sm text-gray-500 text-center">
    Failed to fetch notifications
  </p>
</div>

        )}
      </div>

      {/* Bottom bar */}
      {sortedNotifications.length > 0 &&
    <NotificationRemovalBar/>
      }
    </div>
                        {/* Sidebar */}
                <RightSidebar sponsors={sponsors} loading={!sponsors} />
          
                  {/* Sidebar toggle (medium screens) */}
            <MediumSidebarToggle sponsors={sponsors} />
    </div>
  );
};

export default Notification;
