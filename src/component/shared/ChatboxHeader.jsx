// ChatboxHeader.jsx
import React from "react";

const ChatboxHeader = ({ sidebarOpen, sidebarWidth = 240, children }) => {
  const headerStyle = {
    position: "fixed",
    top: 0,
    left: sidebarOpen ? `${sidebarWidth}px` : "0px",
    width: sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : "100%",
    zIndex: 5666,
    background: "var(--bg-main, #fff)",
    boxSizing: "border-box",
    transition: "left 0.3s ease, width 0.3s ease",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  };

  return <div style={headerStyle}>{children}</div>;
};

export default ChatboxHeader;
