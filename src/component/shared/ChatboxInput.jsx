import React, { useMemo } from "react";

const ChatboxInput = ({
  sidebarOpen,
  sidebarWidth = 240,
  children,
  style: extraStyle = {},
}) => {
  // Calculate left position based on sidebar state (for very specific layouts)
  // In most cases, the parent container already accounts for sidebar, so left stays 0
  const leftPosition = useMemo(() => {
    if (typeof window === "undefined") return 0;
    // Only adjust if absolutely positioned relative to viewport
    // Default to 0 (left edge of available space)
    return 0;
  }, [sidebarOpen, sidebarWidth]);

  const inputStyle = {
    // Fixed positioning within flex container
    position: "relative",
    bottom: 0,
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    background: "var(--color-6)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    boxSizing: "border-box",
    padding: "12px 16px",
    paddingBottom: "max(12px, env(safe-area-inset-bottom))",
    borderTopLeftRadius: "20px",
    borderTopRightRadius: "20px",
    boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.12)",
    flexShrink: 0,
    width: "100%",
    maxWidth: "100%",
    gap: "8px",
    minHeight: "70px",
    justifyContent: "flex-end",
    willChange: "transform",
    ...extraStyle,
  };

  // Inner wrapper for content
  const innerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    boxSizing: "border-box",
    paddingBottom: "env(safe-area-inset-bottom)",
    WebkitOverflowScrolling: "touch",
    scrollBehavior: "smooth",
  };

  return (
    <div style={inputStyle} className="chatbox-input">
      {children}
    </div>
  );
};

export default ChatboxInput;
