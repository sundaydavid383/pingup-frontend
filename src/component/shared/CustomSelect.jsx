import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import "../../styles/customselect.css";

export default function CustomSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div className="custom-select" ref={selectRef}>
      <div className="custom-select-header" onClick={() => setOpen(!open)}>
        {value || placeholder}
        <ChevronDown size={18} className={`chevron ${open ? "open" : ""}`} />
      </div>

      {open && (
        <ul className="custom-select-options">
          {options.map((opt) => (
          <li
  key={opt}
  className={`custom-select-option ${opt === value ? "selected" : ""}`}
  onClick={() => handleSelect(opt)}
>
  {opt.label ?? opt}
</li>

          ))}
        </ul>
      )}
    </div>
  );
}
