import React from "react";

const ChatboxInput = ({
  sidebarOpen,
  sidebarWidth = 240,
  children,
  style: extraStyle = {},
}) => {
  const inputStyle = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.95)",
    boxSizing: "border-box",
    padding: "10px 14px",
    paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)",
    borderTopLeftRadius: "18px",
    borderTopRightRadius: "18px",
    boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
    flexShrink: 0,
    width: "100%",
    maxWidth: "100%",
    gap: "6px",
    height: "70px", // Fixed height for predictable scroll calculation
    ...extraStyle,
  };

  return <div style={inputStyle}>{children}</div>;
};

export default ChatboxInput;
