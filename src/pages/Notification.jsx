import { useEffect, useRef, useState } from "react"; 
import { useAuth } from "../context/AuthContext";
import NotificationSkeleton from "../component/NotificationSkeleton";
import NotificationRemovalBar from "../component/shared/NotificationRemovalBar";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";
import RightSidebar from "../component/RightSidebar";
import CategoryNotifications from "../component/CategoryNotifications";
import { useNotificationContext } from "../context/NotificationContext";

const Notification = () => {
  const { loadingNotifications, sponsors } = useAuth();
  const { activeNotifications, unreadCountByCategory } = useNotificationContext();
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const prevNotificationCount = useRef(0);

  // Track new notifications arriving while on this page
  useEffect(() => {
    if (activeNotifications && activeNotifications.length > prevNotificationCount.current) {
      // Check if we have new unread notifications
      const newUnread = activeNotifications.filter(n => !n.isRead);
      if (newUnread.length > 0 && prevNotificationCount.current > 0) {
        setHasNewNotifications(true);
      }
    }
    prevNotificationCount.current = activeNotifications?.length || 0;
  }, [activeNotifications]);

  if (loadingNotifications) return <NotificationSkeleton />;

  return (
    <div className="flex">
      <div className="w-full max-w-3xl mx-auto relative">
        <CategoryNotifications />
        
        {/* Bottom bar */}
        {Object.values(unreadCountByCategory).some(count => count > 0) && (
          <div className="sticky bottom-4 left-0 z-[0] w-[100%] px-4 mt-4">
            <NotificationRemovalBar />
          </div>
        )}
      </div>

      {/* Sidebar */}
      <RightSidebar sponsors={sponsors} loading={!sponsors} />
      
      {/* Sidebar toggle (medium screens) */}
      <MediumSidebarToggle sponsors={sponsors} />
    </div>
  );
};

export default Notification;
