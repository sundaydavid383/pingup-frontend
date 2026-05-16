import { useEffect, useRef } from "react";
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
  const prevCountRef = useRef(0);

  useEffect(() => {
    prevCountRef.current = activeNotifications?.length || 0;
  }, [activeNotifications]);

  const hasUnread = Object.values(unreadCountByCategory).some((c) => c > 0);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        width: "100%",
        minHeight: "100vh",
        background: "#f8f9fa",
        boxSizing: "border-box",
      }}
    >
      {/* ── Main notification column ── */}
      <div
        style={{
          flex: "1 1 0%",   /* grow and shrink freely */
          minWidth: 0,       /* critical: lets flex child shrink below content size */
          padding: "24px 16px 80px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          /* cap width when there's no sidebar (< lg) */
          maxWidth: "100%",
        }}
      >
        {loadingNotifications ? (
          <NotificationSkeleton />
        ) : (
          <CategoryNotifications />
        )}

        {hasUnread && !loadingNotifications && (
          <div style={{ position: "sticky", bottom: 16, zIndex: 10 }}>
            <NotificationRemovalBar />
          </div>
        )}
      </div>

      {/*
       * RightSidebar renders an <aside className="hidden lg:flex w-[330px]">
       * That aside is 0px wide on < lg (hidden), 330px wide on lg+.
       * The flex row above means the notification column naturally fills
       * whatever space remains after the aside takes its 330px.
       * No margin-right hacks needed — flexbox handles it.
       */}
      <RightSidebar sponsors={sponsors} loading={!sponsors} />

      <MediumSidebarToggle sponsors={sponsors} />
    </div>
  );
};

export default Notification;