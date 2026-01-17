import React from "react";

const ChatboxHeader = ({ sidebarOpen, sidebarWidth = 240, children }) => {
  const headerStyle = {
<<<<<<< HEAD
    position: "fixed",
    top: 0,
    left: sidebarOpen ? `${sidebarWidth}px` : "0px",
    width: sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : "100%",
    zIndex: 56668 ,
    background: "var(--bg-main, #fff)",
=======
    position: "sticky",   
    top: 0,              
    zIndex: 40,            
    background: "var(--color-6)",
>>>>>>> d54218d (Refactor chat UI: fixed scroll behavior, static header/input, media & theme updates)
    boxSizing: "border-box",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    flexShrink: 0,
  };

  return <div style={headerStyle}>{children}</div>;
};

export default ChatboxHeader;
