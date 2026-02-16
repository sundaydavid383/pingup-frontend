import React from "react";

const ChatboxHeader = ({ sidebarOpen, sidebarWidth = 240, children }) => {
  const headerStyle = {
    position: "fixed",   
    top: 0,              
    left: 0,
    right: 0,
    zIndex: 40,            
    background: "var(--color-6)",
    boxSizing: "border-box",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    flexShrink: 0,
    height: "60px", // Fixed height for header
  };

  return <div style={headerStyle}>{children}</div>;
};

export default ChatboxHeader;
