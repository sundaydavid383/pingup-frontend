import React from "react";

const ChatboxInput = ({
  sidebarOpen,
  sidebarWidth = 240,
  children,
  style: extraStyle = {},
}) => {
  const inputStyle = {
    position: "sticky",
    bottom: 0,
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.9)",
    boxSizing: "border-box",
    padding: "10px 14px",
    paddingBottom: `calc(env(safe-area-inset-bottom) + 10px)`,
    borderTopLeftRadius: "18px",
    borderTopRightRadius: "18px",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(16,24,40,0.06)",
    flexShrink: 0,  // prevent shrinking in flex layout
    width: "100%",
    maxWidth: "100%",
    gap: "0.5rem",
    ...extraStyle,
  };

  return <div style={inputStyle}>{children}</div>;
};

export default ChatboxInput;
