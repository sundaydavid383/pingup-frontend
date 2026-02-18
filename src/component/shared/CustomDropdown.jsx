import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import "./customDropdown.css";

const CustomDropdown = ({
  id,
  label,
  options = [],
  value,
  onChange = () => { },
  openDropdownId,
  setOpenDropdownId,
  setInput,
}) => {
  const isOpen = openDropdownId === id;
  const toggleRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});
  const [highlighted, setHighlighted] = useState(-1);

  const open = useCallback(() => {
    setOpenDropdownId(id);
  }, [id, setOpenDropdownId]);

  const close = useCallback(() => {
    setOpenDropdownId(null);
    setHighlighted(-1);
  }, [setOpenDropdownId]);

  useEffect(() => {
    if (!isOpen) return;
    const rect = toggleRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Use fixed positioning to escape parent containers
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 6 + "px",
      left: rect.left + "px",
      width: rect.width + "px",
      zIndex: 99999,
    });
  }, [isOpen]);

  // Close when clicking outside (checks both toggle and portal menu)
  useEffect(() => {
    const onPointerDown = (e) => {
      const target = e.target;
      if (toggleRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, options.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      }
      if (e.key === "Enter" && highlighted >= 0) {
        const opt = options[highlighted];
        onChange(opt);
        setInput && setInput(opt);
        close();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [close, isOpen, options, highlighted, onChange, setInput]);

  const handleSelect = (opt) => {
    onChange(opt);
    setInput && setInput(opt);
    close();
  };

  const renderMenu = () => (
    <div
      className="custom-dropdown__menu-portal"
      ref={menuRef}
      style={menuStyle}
      role="listbox"
      aria-labelledby={`dropdown-${id}`}
    >
      {options.map((opt, idx) => (
        <div
          key={opt}
          role="option"
          aria-selected={value === opt}
          tabIndex={0}
          className={`custom-dropdown__option ${highlighted === idx ? "highlighted" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleSelect(opt);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setHighlighted(idx)}
        >
          {opt}
        </div>
      ))}
    </div>
  );

  return (
    <div className="custom-dropdown" style={{ position: "relative" }}>
      <button
        id={`dropdown-${id}`}
        ref={toggleRef}
        type="button"
        className="custom-dropdown__toggle"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? close() : open())}
      >
        <span className="custom-dropdown__label">{value || `Select ${label}`}</span>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(renderMenu(), document.body)
        : null}
    </div>
  );
};

export default CustomDropdown;
