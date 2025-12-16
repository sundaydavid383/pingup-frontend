import React, { useState, useEffect } from "react";

export default function ErrorAlert({ error, onClose, autoHideMs = 6000 }) {
  const [visible, setVisible] = useState(Boolean(error));

  useEffect(() => {
    setVisible(Boolean(error));
  }, [error]);

  useEffect(() => {
    if (!visible || !autoHideMs) return;
    const t = setTimeout(() => setVisible(false), autoHideMs);
    return () => clearTimeout(t);
  }, [visible, autoHideMs]);

  if (!visible || !error) return null;

  return (
    <div
      className="err-alert"
      role="alert"
      aria-live="assertive"
      onAnimationEnd={(e) => {
        // keep mounted during fade-out triggered by class toggle if needed
      }}
    >
      <div className="err-left">
        {/* inline SVG icon (exclamation triangle) */}
        <svg
          className="err-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff7675" />
              <stop offset="100%" stopColor="#ff4757" />
            </linearGradient>
          </defs>
          <path
            fill="url(#g1)"
            d="M1 21h22L12 2 1 21z"
          />
          <path fill="#fff" d="M12 8.5a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0v-3a1 1 0 0 0-1-1zm0 7a1.25 1.25 0 1 0 .001 2.501A1.25 1.25 0 0 0 12 15.5z"/>
        </svg>
      </div>

      <div className="err-body">
        <div className="err-title">Something went wrong</div>
        <div className="err-text">{error}</div>
      </div>

      <button
        className="err-close"
        aria-label="Dismiss error"
        onClick={() => {
          setVisible(false);
          if (typeof onClose === "function") onClose();
        }}
      >
        {/* close X */}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.9a1 1 0 0 0 1.41-1.41L13.41 12l4.9-4.89a1 1 0 0 0 0-1.4z"/>
        </svg>
      </button>
    </div>
  );
}
