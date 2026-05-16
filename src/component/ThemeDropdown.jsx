import React, { useEffect, useRef, useState } from "react";
import { FaArrowDown } from "react-icons/fa";
import "./themeDropdown.css";
import { useTheme } from "../context/ThemeContext";

// Theme map with consistent primary variables
export const THEMES = {
  Default: {
    name: "Light",
    vars: {
      "--primary": "#6366f1",
      "--primary-hover": "#4f46e5",
      "--input-primary": "#ffffffff",
      "--input-accent": "#6366f1",
      "--input-bg-color": "#f9fafb",
      "--input-text-color": "#0f172a",
      "--input-shadow": "0 8px 24px rgba(15, 23, 42, 0.08)",
      "--input-chatbox-bg-gradient": "linear-gradient(180deg, #f9fafb 0%, #eef2ff 100%)",
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
      "--primary": "#3055d1",
      "--primary-hover": "#6366f1",
      "--input-primary": "#000000ff",
      "--input-accent": "#3055d1",
      "--input-bg-color": "#020617",
      "--input-text-color": "#e5e7eb",
      "--input-shadow": "0 10px 30px rgba(0,0,0,0.6)",
      "--input-chatbox-bg-gradient": "linear-gradient(180deg, #020617 0%, #020617 60%, #030a1a 100%)",
      "--input-bubble-sender": "#020617",
      "--input-bubble-receiver": "#3055d1",
      "--input-ui-overlay": "rgba(2,6,23,0.85)",
      "--input-error": "#f87171",
      "--input-sending": "#facc15",
      "--input-sent-check": "#94a3b8",
      "--input-delivered-check": "#3055d1",
      "--input-seen-check": "#34d399"
    }
  },

  Ocean: {
    name: "Ocean",
    vars: {
      "--primary": "#0ea5e9",
      "--primary-hover": "#0284c7",
      "--input-primary": "#0ea5e9",
      "--input-accent": "#0ea5e9",
      "--input-bg-color": "#f8fafc",
      "--input-text-color": "#0f172a",
      "--input-shadow": "0 8px 26px rgba(14,165,233,0.25)",
      "--input-chatbox-bg-gradient": "linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)",
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
      "--primary": "#15803d",
      "--primary-hover": "#166534",
      "--input-primary": "#15803d",
      "--input-accent": "#15803d",
      "--input-bg-color": "#dcfce7",
      "--input-text-color": "#065f46",
      "--input-shadow": "0 2px 2px 2px rgba(21, 128, 61, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#bbf7d0 0%,#86efac 50%,#15803d 100%)",
      "--input-bubble-sender": "#d1fae5",
      "--input-bubble-receiver": "#15803d",
      "--input-ui-overlay": "rgba(220, 252, 231, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#eab308",
      "--input-sent-check": "#4b5563",
      "--input-delivered-check": "#15803d",
      "--input-seen-check": "#059669"
    }
  },

  Candy: {
    name: "Candy",
    vars: {
      "--primary": "#ec4899",
      "--primary-hover": "#db2777",
      "--input-primary": "#ec4899",
      "--input-accent": "#ec4899",
      "--input-bg-color": "#fff0f6",
      "--input-text-color": "#831843",
      "--input-shadow": "0 2px 2px 2px rgba(236, 72, 153, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#ffe4f0 0%,#f9a8d4 50%,#ec4899 100%)",
      "--input-bubble-sender": "#fce7f3",
      "--input-bubble-receiver": "#ec4899",
      "--input-ui-overlay": "rgba(255, 240, 246, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#facc15",
      "--input-sent-check": "#6b7280",
      "--input-delivered-check": "#ec4899",
      "--input-seen-check": "#059669"
    }
  },

  Purple: {
    name: "Purple",
    vars: {
      "--primary": "#a855f7",
      "--primary-hover": "#9333ea",
      "--input-primary": "#a855f7",
      "--input-accent": "#a855f7",
      "--input-bg-color": "#faf5ff",
      "--input-text-color": "#581c87",
      "--input-shadow": "0 2px 2px 2px rgba(168, 85, 247, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#f3e8ff 0%,#d8b4fe 50%,#a855f7 100%)",
      "--input-bubble-sender": "#f5d0fe",
      "--input-bubble-receiver": "#a855f7",
      "--input-ui-overlay": "rgba(250, 245, 255, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#facc15",
      "--input-sent-check": "#6b7280",
      "--input-delivered-check": "#a855f7",
      "--input-seen-check": "#059669"
    }
  },

  Rose: {
    name: "Rose",
    vars: {
      "--primary": "#f43f5e",
      "--primary-hover": "#e11d48",
      "--input-primary": "#f43f5e",
      "--input-accent": "#f43f5e",
      "--input-bg-color": "#fff1f2",
      "--input-text-color": "#881337",
      "--input-shadow": "0 2px 2px 2px rgba(244, 63, 94, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#ffe4e6 0%,#fda4af 50%,#f43f5e 100%)",
      "--input-bubble-sender": "#ffe4e6",
      "--input-bubble-receiver": "#f43f5e",
      "--input-ui-overlay": "rgba(255, 241, 242, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#facc15",
      "--input-sent-check": "#6b7280",
      "--input-delivered-check": "#f43f5e",
      "--input-seen-check": "#059669"
    }
  },

  Orange: {
    name: "Orange",
    vars: {
      "--primary": "#f97316",
      "--primary-hover": "#ea580c",
      "--input-primary": "#f97316",
      "--input-accent": "#f97316",
      "--input-bg-color": "#fff7ed",
      "--input-text-color": "#7c2d12",
      "--input-shadow": "0 2px 2px 2px rgba(249, 115, 22, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#ffedd5 0%,#fdba74 50%,#f97316 100%)",
      "--input-bubble-sender": "#ffedd5",
      "--input-bubble-receiver": "#f97316",
      "--input-ui-overlay": "rgba(255, 247, 237, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#facc15",
      "--input-sent-check": "#6b7280",
      "--input-delivered-check": "#f97316",
      "--input-seen-check": "#059669"
    }
  },

  Teal: {
    name: "Teal",
    vars: {
      "--primary": "#14b8a6",
      "--primary-hover": "#0d9488",
      "--input-primary": "#14b8a6",
      "--input-accent": "#14b8a6",
      "--input-bg-color": "#f0fdfa",
      "--input-text-color": "#134e4a",
      "--input-shadow": "0 2px 2px 2px rgba(20, 184, 166, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#ccfbf1 0%,#5eead4 50%,#14b8a6 100%)",
      "--input-bubble-sender": "#ccfbf1",
      "--input-bubble-receiver": "#14b8a6",
      "--input-ui-overlay": "rgba(240, 253, 250, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#facc15",
      "--input-sent-check": "#6b7280",
      "--input-delivered-check": "#14b8a6",
      "--input-seen-check": "#059669"
    }
  },

  Amber: {
    name: "Amber",
    vars: {
      "--primary": "#f59e0b",
      "--primary-hover": "#d97706",
      "--input-primary": "#f59e0b",
      "--input-accent": "#f59e0b",
      "--input-bg-color": "#fffbeb",
      "--input-text-color": "#78350f",
      "--input-shadow": "0 2px 2px 2px rgba(245, 158, 11, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#fef3c7 0%,#fcd34d 50%,#f59e0b 100%)",
      "--input-bubble-sender": "#fef3c7",
      "--input-bubble-receiver": "#f59e0b",
      "--input-ui-overlay": "rgba(255, 251, 235, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#facc15",
      "--input-sent-check": "#6b7280",
      "--input-delivered-check": "#f59e0b",
      "--input-seen-check": "#059669"
    }
  },

  Emerald: {
    name: "Emerald",
    vars: {
      "--primary": "#10b981",
      "--primary-hover": "#059669",
      "--input-primary": "#10b981",
      "--input-accent": "#10b981",
      "--input-bg-color": "#ecfdf5",
      "--input-text-color": "#064e3b",
      "--input-shadow": "0 2px 2px 2px rgba(16, 185, 129, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#d1fae5 0%,#6ee7b7 50%,#10b981 100%)",
      "--input-bubble-sender": "#d1fae5",
      "--input-bubble-receiver": "#10b981",
      "--input-ui-overlay": "rgba(236, 253, 245, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#facc15",
      "--input-sent-check": "#6b7280",
      "--input-delivered-check": "#10b981",
      "--input-seen-check": "#059669"
    }
  },

  Slate: {
    name: "Slate",
    vars: {
      "--primary": "#64748b",
      "--primary-hover": "#475569",
      "--input-primary": "#64748b",
      "--input-accent": "#64748b",
      "--input-bg-color": "#f8fafc",
      "--input-text-color": "#1e293b",
      "--input-shadow": "0 2px 2px 2px rgba(100, 116, 139, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#f1f5f9 0%,#cbd5e1 50%,#64748b 100%)",
      "--input-bubble-sender": "#f1f5f9",
      "--input-bubble-receiver": "#64748b",
      "--input-ui-overlay": "rgba(248, 250, 252, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#facc15",
      "--input-sent-check": "#6b7280",
      "--input-delivered-check": "#64748b",
      "--input-seen-check": "#059669"
    }
  },

  Coral: {
    name: "Coral",
    vars: {
      "--primary": "#fb7185",
      "--primary-hover": "#f43f5e",
      "--input-primary": "#fb7185",
      "--input-accent": "#fb7185",
      "--input-bg-color": "#fff1f2",
      "--input-text-color": "#881337",
      "--input-shadow": "0 2px 2px 2px rgba(251, 113, 133, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#ffe4e6 0%,#fda4af 50%,#fb7185 100%)",
      "--input-bubble-sender": "#ffe4e6",
      "--input-bubble-receiver": "#fb7185",
      "--input-ui-overlay": "rgba(255, 241, 242, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#facc15",
      "--input-sent-check": "#6b7280",
      "--input-delivered-check": "#fb7185",
      "--input-seen-check": "#059669"
    }
  },

  Sky: {
    name: "Sky",
    vars: {
      "--primary": "#0ea5e9",
      "--primary-hover": "#0284c7",
      "--input-primary": "#0ea5e9",
      "--input-accent": "#0ea5e9",
      "--input-bg-color": "#f0f9ff",
      "--input-text-color": "#0c4a6e",
      "--input-shadow": "0 2px 2px 2px rgba(14, 165, 233, 0.4)",
      "--input-chatbox-bg-gradient": "linear-gradient(90deg,#e0f2fe 0%,#7dd3fc 50%,#0ea5e9 100%)",
      "--input-bubble-sender": "#e0f2fe",
      "--input-bubble-receiver": "#0ea5e9",
      "--input-ui-overlay": "rgba(240, 249, 255, 0.9)",
      "--input-error": "#dc2626",
      "--input-sending": "#facc15",
      "--input-sent-check": "#6b7280",
      "--input-delivered-check": "#0ea5e9",
      "--input-seen-check": "#059669"
    }
  }
};

// Apply theme variables locally to container and globally to document
export const applyThemeVars = (themeVars, container) => {
  // Apply to container if provided
  if (container) {
    Object.entries(themeVars).forEach(([k, v]) => {
      container.style.setProperty(k, v);
    });
  }
  // Always apply to document root for global cascade
  Object.entries(themeVars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
};

const MAX_Z = 2147483647;
const ThemeDropdown = ({
  onChange = () => { },
  currentTheme: externalTheme,
  containerRef = { current: null },
  items = [],
}) => {
  const hostRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 20 });
  const { currentTheme, setCurrentTheme, THEME_KEY } = useTheme();

  // Apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) || "Default";
    const initialTheme = externalTheme || savedTheme;
    setCurrentTheme(initialTheme);

    if (containerRef.current) {
      applyThemeVars(
        THEMES[initialTheme]?.vars || THEMES.Default.vars,
        containerRef.current
      );
    }
  }, [containerRef]);

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

  const toggleOpen = (event, next = null) => {
    event?.stopPropagation?.();
    const val = next === null ? !open : next;
    if (val) {
      computePosition();
      requestAnimationFrame(() => setOpen(true));
    } else {
      setOpen(false);
    }
  };

  const handleSelect = (key, event) => {
    // Stop propagation to prevent closing parent dropdowns
    event?.stopPropagation?.();
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
        position: "absolute",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 1000,
        pointerEvents: "auto",
      }}
      role="menu"
      aria-hidden={!open}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="theme-dropdown-panel" role="list">
        {items && items.length > 0 && (
          <div className="theme-settings-section" style={{ padding: 8 }}>
            {items.map((it, i) => (
                  <button
                    key={`s-${i}`}
                    className="theme-dropdown-item"
                    onClick={(event) => {
                      event.stopPropagation();
                      it.onClick && it.onClick();
                      setOpen(false);
                    }}
                  >
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
              onClick={(event) => handleSelect(key, event)}
            >
              <div className="theme-preview">
                <span
                  className="theme-swatch"
                  aria-hidden
                  style={{
                    background: theme.vars["--input-accent"],
                    boxShadow: `inset 0 0 0 2px ${theme.vars["--input-accent"]}22`,
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
      <div ref={hostRef} className="chatbox-theme-picker" style={{ display: "inline-block", position: "relative" }}>
        <button
          type="button"
          className="p-2 hover:brightness-110 active:scale-95 transition"
          aria-label="Change Theme"
          onClick={(event) => toggleOpen(event)}
          style={{
            backgroundColor: THEMES[currentTheme]?.vars["--input-accent"] || "#6366f1",
            color: "white",
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
        {open && Menu}
      </div>
    </>
  );
};

export default ThemeDropdown;
