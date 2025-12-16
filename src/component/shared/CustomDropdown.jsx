import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import "./customDropdown.css"; // import CSS

const CustomDropdown = ({
  id,
  label,
  options,
  value,
  onChange,
  openDropdownId,
  setOpenDropdownId,
  setInput
}) => {
  const dropdownRef = useRef(null);
  const isOpen = openDropdownId === id;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpenDropdownId]);

 const handleSelect = (option, e) => {
  e.stopPropagation(); // prevent click from closing immediately
  console.log("Selected option.......:", option);
  onChange(option); // update filter
  setInput && setInput(option);
  setOpenDropdownId(null);
};


  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div
        className="custom-dropdown__toggle"
        onClick={() => setOpenDropdownId(isOpen ? null : id)}
      >
        <span className="custom-dropdown__label">{value || `Select ${label}`}</span>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </div>

      {isOpen && (
        <div className="custom-dropdown__menu">
{options.map((opt) => (
  <div
    key={opt}
    className="custom-dropdown__option"
    onClick={(e) => handleSelect(opt, e)}
  >
    {opt}
  </div>
))}

        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
