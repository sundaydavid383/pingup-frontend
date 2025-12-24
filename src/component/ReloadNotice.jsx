import React from "react";

const ReloadNotice = () => {
  return (
    <div
      className="reload-notice"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        background: "rgba(4, 16, 93, 0.3)",
        color: "var(--black)",
        textAlign: "center",
        padding: "0.3rem",
        fontSize: "0.7rem",
        borderTop: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.3)",
        zIndex: 99,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)", // ✅ add this for Safari & Chrome
      }}
    >
      ⚠️ Reload this page if you experience any errors.
    </div>
  );
};

export default ReloadNotice;
