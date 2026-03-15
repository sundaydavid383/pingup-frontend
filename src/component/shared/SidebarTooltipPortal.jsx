import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// Global state to track tooltip visibility and position
let tooltipState = {
  visible: false,
  label: "",
  x: 0,
  y: 0,
};

let listeners = [];

// Subscribe to tooltip state changes
export const useSidebarTooltip = () => {
  const [tooltip, setTooltip] = useState(tooltipState);

  useEffect(() => {
    const handler = (newState) => setTooltip({ ...newState });
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  const showTooltip = useCallback((label, x, y) => {
    tooltipState = { visible: true, label, x, y };
    listeners.forEach((l) => l(tooltipState));
  }, []);

  const hideTooltip = useCallback(() => {
    tooltipState = { ...tooltipState, visible: false };
    listeners.forEach((l) => l(tooltipState));
  }, []);

  return { tooltip, showTooltip, hideTooltip };
};

// Tooltip component that renders at document body level
const SidebarTooltipPortal = () => {
  const { tooltip } = useSidebarTooltip();

  if (!tooltip.visible) return null;

  // Position tooltip to the right of the icon
  const style = {
    position: "fixed",
    left: tooltip.x + 20, // 20px to the right of cursor/icon
    top: tooltip.y,
    transform: "translateY(-50%)",
    padding: "6px 12px",
    background: "#1f2937",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: 500,
    whiteSpace: "nowrap",
    borderRadius: "6px",
    zIndex: 99999,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    pointerEvents: "none",
    opacity: 1,
    transition: "opacity 0.15s ease, left 0.15s ease",
  };

  return createPortal(
    <div style={style}>
      {tooltip.label}
    </div>,
    document.body
  );
};

export default SidebarTooltipPortal;
