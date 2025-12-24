// ChatboxInput.jsx
import React from "react";

const ChatboxInput = ({
  sidebarOpen,
  sidebarWidth = 240,
  children,
  style: extraStyle = {},
}) => {
  const inputStyle = {
  position: "fixed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center", // center content horizontally
  bottom: 0,
  left: sidebarOpen ? `${sidebarWidth}px` : "0px",
  width: sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : "100%",
  zIndex: 99920,
  background:  "rgba(230, 227, 227, 0.95)",
  boxSizing: "border-box",
  padding: "6px 5px", // compact vertical and horizontal padding
  paddingBottom: `calc(env(safe-area-inset-bottom) + 6px)`,
  borderTopLeftRadius: "16px",
  borderTopRightRadius: "16px",
  boxShadow: "0 -2px 12px rgba(0,0,0,0.12)",
  transition: "left 0.3s ease, width 0.3s ease",
  maxWidth: "100%",
  minHeight: "50px", // minimum height for comfort
  gap: "0.5rem",      // spacing between items
  ...extraStyle,
};


  return <div style={inputStyle}>{children}</div>;
};

export default ChatboxInput;
