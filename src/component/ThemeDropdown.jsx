import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaArrowDown } from "react-icons/fa";
import "./themeDropdown.css";
import { useTheme } from "../context/ThemeContext";

// Theme map  
const THEMES = {
  Default: {
  name: "Light",
  vars: {
    "--input-primary": "#ffffffff",        // indigo-500 (modern, trusted)
    "--input-accent": "#2451bbff",         // slate-900
    "--input-bg-color": "#f9fafb",       // softer than pure white
    "--input-text-color": "#0f172a",
    "--input-shadow": "0 8px 24px rgba(15, 23, 42, 0.08)",

    "--input-chatbox-bg-gradient":
      "linear-gradient(180deg, #f9fafb 0%, #eef2ff 100%)",

    "--input-bubble-sender": "#ffffff",
    "--input-bubble-receiver": "#6366f1",

    "--input-ui-overlay": "rgba(255,255,255,0.75)",

    "--input-error": "#ef4444",
    "--input-sending": "#f59e0b",
    "--input-sent-check": "#64748b",
    "--input-delivered-check": "#6366f1",
    "--input-seen-check": "#22c55e"
  }
},

  Dark: {
  name: "Dark",
  vars: {
    "--input-primary": "#000000ff",        // soft indigo
    "--input-accent": "#596170ff",
    "--input-bg-color": "#020617",       // true deep navy
    "--input-text-color": "#e5e7eb",

    "--input-shadow": "0 10px 30px rgba(0,0,0,0.6)",

    "--input-chatbox-bg-gradient":
      "linear-gradient(180deg, #020617 0%, #020617 60%, #030a1a 100%)",

    "--input-bubble-sender": "#020617",
    "--input-bubble-receiver": "#4f46e5",

    "--input-ui-overlay": "rgba(2,6,23,0.85)",

    "--input-error": "#f87171",
    "--input-sending": "#facc15",
    "--input-sent-check": "#94a3b8",
    "--input-delivered-check": "#818cf8",
    "--input-seen-check": "#34d399"
  }
}
,
  // Add these inside your THEMES object

  Lavender: {
  name: "Lavender Glow",
  vars: {
    "--input-primary": "#8b5cf6",
    "--input-accent": "#ede9fe",
    "--input-bg-color": "#fafafa",
    "--input-text-color": "#1e1b4b",

    "--input-shadow": "0 10px 30px rgba(139,92,246,0.25)",

    "--input-chatbox-bg-gradient":
      "linear-gradient(180deg, #fafafa 0%, #f5f3ff 100%)",

    "--input-bubble-sender": "#ffffff",
    "--input-bubble-receiver": "#8b5cf6",

    "--input-ui-overlay": "rgba(245,243,255,0.8)",

    "--input-error": "#ef4444",
    "--input-sending": "#f59e0b",
    "--input-sent-check": "#6b7280",
    "--input-delivered-check": "#8b5cf6",
    "--input-seen-check": "#22c55e"
  }
},

  Ocean: {
  name: "Ocean",
  vars: {
    "--input-primary": "#0ea5e9",
    "--input-accent": "#8bb1caff",
    "--input-bg-color": "#f8fafc",
    "--input-text-color": "#0f172a",

    "--input-shadow": "0 8px 26px rgba(14,165,233,0.25)",

    "--input-chatbox-bg-gradient":
      "linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)",

    "--input-bubble-sender": "#ffffff",
    "--input-bubble-receiver": "#0ea5e9",

    "--input-ui-overlay": "rgba(224,242,254,0.8)",

    "--input-error": "#ef4444",
    "--input-sending": "#facc15",
    "--input-sent-check": "#64748b",
    "--input-delivered-check": "#0ea5e9",
    "--input-seen-check": "#22c55e"
  }
},


  Forest: {
    name: "Forest",
    vars: {
      "--input-primary": "#15803d",
      "--input-accent": "#065f46",
      "--input-bg-color": "#dcfce7",
      "--input-text-color": "#065f46",
      "--input-shadow": "0 2px 2px 2px rgba(21, 128, 61, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#bbf7d0 0%,#86efac 50%,#15803d 100%)",
      "--input-bubble-sender": "#d1fae5",
      "--input-bubble-receiver": "#15803d",
      "--input-ui-overlay": "rgba(220, 252, 231, 0.9)",
"--input-error": "#dc2626",          // readable red on green bg
"--input-sending": "#eab308",        // earthy yellow
"--input-sent-check": "#4b5563",     // dark muted gray
"--input-delivered-check": "#15803d",// theme primary green
"--input-seen-check": "#059669"      // natural green

    }
  },

  Lavender: {
    name: "Lavender",
    vars: {
      "--input-primary": "#8b5cf6",
      "--input-accent": "#7c3aed",
      "--input-bg-color": "#f5f3ff",
      "--input-text-color": "#4c1d95",
      "--input-shadow": "0 2px 2px 2px rgba(139, 92, 246, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#ede9fe 0%,#c4b5fd 50%,#8b5cf6 100%)",
      "--input-bubble-sender": "#ede9fe",
      "--input-bubble-receiver": "#8b5cf6",
      "--input-ui-overlay": "rgba(245, 243, 255, 0.9)",
"--input-error": "#dc2626",          // readable red on purple bg
"--input-sending": "#eab308",        // gold contrasts purple
"--input-sent-check": "#6b7280",     // neutral gray for clarity
"--input-delivered-check": "#8b5cf6",// theme primary purple
"--input-seen-check": "#10b981"      // mint green looks clean on purple

    }
  },

  Candy: {
    name: "Candy",
    vars: {
      "--input-primary": "#ec4899",
      "--input-accent": "#db2777",
      "--input-bg-color": "#fff0f6",
      "--input-text-color": "#831843",
      "--input-shadow": "0 2px 2px 2px rgba(236, 72, 153, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#ffe4f0 0%,#f9a8d4 50%,#ec4899 100%)",
      "--input-bubble-sender": "#fce7f3",
      "--input-bubble-receiver": "#ec4899",
      "--input-ui-overlay": "rgba(255, 240, 246, 0.9)",
"--input-error": "#dc2626",          // strong red—contrast with pink
"--input-sending": "#facc15",        // gold works well with candy colors
"--input-sent-check": "#6b7280",     // soft but readable gray
"--input-delivered-check": "#ec4899",// theme primary pink
"--input-seen-check": "#059669"      // soft green, not harsh

    }
  },

  // add more themes...
};


// Apply theme variables locally to container
const applyThemeVars = (themeVars, container) => {
  if (!container) return;
  Object.entries(themeVars).forEach(([k, v]) => {
    container.style.setProperty(k, v);
  });
};

const MAX_Z = 2147483647;
const ThemeDropdown = ({
  onChange = () => {},
  currentTheme: externalTheme,
  containerRef = { current: null },   // <-- safe default
  items = [], // optional settings items: [{ label, onClick }]
}) => {
  const hostRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 20 });
  const { currentTheme, setCurrentTheme, THEME_KEY } = useTheme();

  // Apply theme on mount (use saved or external)
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) || "Default";
    const initialTheme = externalTheme || savedTheme;

    setCurrentTheme(initialTheme);

    // Only apply if we have a valid container element
    if (containerRef.current) {
      applyThemeVars(
        THEMES[initialTheme]?.vars || THEMES.Default.vars,
        containerRef.current
      );
    }
  }, [containerRef]);   // re‑run if the ref changes

  // Sync externalTheme if parent changes it
  useEffect(() => {
    if (externalTheme && externalTheme !== currentTheme) {
      setCurrentTheme(externalTheme);
      if (containerRef.current) {
        applyThemeVars(
          THEMES[externalTheme]?.vars || THEMES.Default.vars,
          containerRef.current
        );
      }
      localStorage.setItem(THEME_KEY, externalTheme);
    }
  }, [externalTheme, containerRef, currentTheme, THEME_KEY]);

  const computePosition = () => {
    const btn = hostRef.current?.querySelector("button");
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const menuWidth = 220;
    const gap = 8;

    let left = rect.right - menuWidth;
    if (left < 8) left = rect.left;

    const top = Math.min(window.innerHeight - 48, rect.bottom + gap);
    setCoords({ top: Math.max(8, top), left, width: menuWidth });
  };

  const toggleOpen = (next = null) => {
    const val = next === null ? !open : next;
    if (val) {
      computePosition();
      requestAnimationFrame(() => setOpen(true));
    } else {
      setOpen(false);
    }
  };

  const handleSelect = (key) => {
    setCurrentTheme(key);
    if (containerRef.current) {
      applyThemeVars(
        THEMES[key]?.vars || THEMES.Default.vars,
        containerRef.current
      );
    }
    localStorage.setItem(THEME_KEY, key);
    onChange(key);
    setOpen(false);
  };

  const Menu = (
    <div
      className="theme-dropdown-portal"
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: MAX_Z,
        pointerEvents: "auto",
      }}
      role="menu"
      aria-hidden={!open}
    >
      <div className="theme-dropdown-panel" role="list">
        {items && items.length > 0 && (
          <div className="theme-settings-section" style={{ padding: 8 }}>
            {items.map((it, i) => (
              <button key={`s-${i}`} className="theme-dropdown-item" onClick={() => { it.onClick && it.onClick(); setOpen(false); }}>
                <div className="theme-preview">
                  <span className="theme-name">{it.label}</span>
                </div>
              </button>
            ))}
            <div style={{ height: 8 }} />
          </div>
        )}

        {Object.keys(THEMES).map((key) => {
          const theme = THEMES[key];
          const selected = currentTheme === key;
          return (
            <button
              key={key}
              type="button"
              role="menuitem"
              className={`theme-dropdown-item ${selected ? "selected" : ""}`}
              onClick={() => handleSelect(key)}
            >
              <div className="theme-preview">
                <span
                  className="theme-swatch"
                  aria-hidden
                  style={{
                    background: theme.vars["--input-primary"],
                    boxShadow: `inset 0 0 0 2px ${theme.vars["--input-primary"]}22`,
                    border: `1px dashed var(--white)`
                  }}
                />
                <span className="theme-name">{theme.name}</span>
              </div>
              {selected && <span className="theme-check">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div ref={hostRef} className="chatbox-theme-picker" style={{ display: "inline-block" }}>
       <button
  type="button"
  className="p-2 hover:brightness-110 active:scale-95 transition"
  aria-label="Change Theme"
  onClick={() => toggleOpen()}
  style={{
    backgroundColor: THEMES[currentTheme]?.vars["--input-primary"] || "#6366f1",
    color: "black",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: "500",
    fontSize: "14px",
    padding: "6px 12px",
  }}
>
  Theme
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m8.66-10h-1M4.34 12h-1m15.07 6.07l-.7-.7M6.34 6.34l-.7-.7m12.73 12.73l-.7-.7M6.34 17.66l-.7-.7M12 5a7 7 0 000 14 7 7 0 000-14z"
    />
  </svg>
</button>

      </div>
      {open && typeof document !== "undefined" ? createPortal(Menu, document.body) : null}
    </>
  );
};

export default ThemeDropdown;
