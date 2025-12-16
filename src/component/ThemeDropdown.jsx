import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaArrowDown } from "react-icons/fa";
import "./themeDropdown.css";
import { useTheme } from "../context/ThemeContext";

// Theme map  
const THEMES = {
  Default: {
    name: "Default",
    vars: {
      "--input-primary": "#1e40af",
      "--input-accent": "#0f172a",
      "--input-bg-color": "#f8fafc",
      "--input-text-color": "#0f172a",
      "--input-shadow": "0 2px 2px 2px rgba(20, 50, 87, 0.5)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#d1d1d8ff 0%,#d3bbfaff 50%,#c4d9ddff 100%)",
      "--input-bubble-sender": "#ffffff",
      "--input-bubble-receiver": "#7c3aed",
      "--input-ui-overlay": "rgba(255,255,255,0.9)",
      // Sent status colors
      "--input-error": "#ef4444",          // red for failed
      "--input-sending": "#524202ff",        // yellow for sending
      "--input-sent-check": "#6b7280",     // gray for sent
      "--input-delivered-check": "#1854b3ff",// blue for delivered
      "--input-seen-check": "#09a772ff"      // green for seen
    }
  },
  Dark: {
    name: "Dark",
    vars: {
      "--input-primary": "#0ea5a4",
      "--input-accent": "#349273ff",
      "--input-bg-color": "#0b1220",
      "--input-text-color": "#f1ededff",
      "--input-shadow": "0 2px 2px 2px rgba(198, 215, 236, 0.5)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#0e1f3bff 0%,#102029ff 50%,#181f24ff 100%)",
      "--input-bubble-sender": "#0f1724",
      "--input-bubble-receiver": "#3f6cb6ff",
      "--input-ui-overlay": "rgba(10,10,10,0.85)",
      "--col1": "#0e1f3bff",
      "--col2": "#102029ff",
      "col3": "#181f24ff",
  
      // Sent status colors
      "--input-error": "#f87171",          
      "--input-sending": "#facc15",        
      "--input-sent-check": "#9ca3af",     
      "--input-delivered-check": "#3b82f6",
      "--input-seen-check": "#34d399"
    }
  },

  // Add these inside your THEMES object

  Sunset: {
    name: "Sunset",
    vars: {
      "--input-primary": "#f97316",
      "--input-accent": "#b45309",
      "--input-bg-color": "#fff7ed",
      "--input-text-color": "#7c2d12",
      "--input-shadow": "0 2px 2px 2px rgba(249, 115, 22, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#ffedd5 0%,#fdba74 50%,#fb923c 100%)",
      "--input-bubble-sender": "#fed7aa",
      "--input-bubble-receiver": "#f97316",
      "--input-ui-overlay": "rgba(255, 247, 237, 0.9)",
"--input-error": "#dc2626",          // deeper warm red
"--input-sending": "#fbbf24",        // warm amber
"--input-sent-check": "#92400e",     // dark orange-brown for contrast
"--input-delivered-check": "#f97316",// uses theme primary
"--input-seen-check": "#059669"      // warm green

    }
  },

  Ocean: {
    name: "Ocean",
    vars: {
      "--input-primary": "#0284c7",
      "--input-accent": "#0369a1",
      "--input-bg-color": "#e0f2fe",
      "--input-text-color": "#0369a1",
      "--input-shadow": "0 2px 2px 2px rgba(2, 132, 199, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#bae6fd 0%,#7dd3fc 50%,#0284c7 100%)",
      "--input-bubble-sender": "#dbeafe",
      "--input-bubble-receiver": "#0284c7",
      "--input-ui-overlay": "rgba(224, 242, 254, 0.9)",
 "--input-error": "#dc2626",          // universal readable red
"--input-sending": "#facc15",        // soft yellow on blue
"--input-sent-check": "#475569",     // cool gray
"--input-delivered-check": "#0284c7",// theme primary blue
"--input-seen-check": "#16a34a"      // cool sea-green

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
          className="theme-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => toggleOpen()}
        >
          <FaArrowDown
            style={{
              marginLeft: 6,
              fontSize: 11,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform .18s",
            }}
          />
          <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600 }}>Theme</span>
        </button>
      </div>
      {open && typeof document !== "undefined" ? createPortal(Menu, document.body) : null}
    </>
  );
};

export default ThemeDropdown;
