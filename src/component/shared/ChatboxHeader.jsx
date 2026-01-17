import React from "react";

const ChatboxHeader = ({ sidebarOpen, sidebarWidth = 240, children }) => {
  const headerStyle = {
    position: "sticky",   
    top: 0,              
    zIndex: 40,            
    background: "var(--color-6)",
    boxSizing: "border-box",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    flexShrink: 0,
  };

  return <div style={headerStyle}>{children}</div>;
};

export default ChatboxHeader;
