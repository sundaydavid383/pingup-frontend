import React from "react";

const ChatboxHeader = ({ sidebarOpen, sidebarWidth = 240, children }) => {
  const headerStyle = {
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    background: "var(--color-6)",
    boxSizing: "border-box",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    flexShrink: 0,
    height: "60px",
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
  };

  return (
    <div style={headerStyle} className="chatbox-header-container">
      <div className="chatbox-header-content">
        {children}
      </div>
    </div>
  );
};

export default ChatboxHeader;
