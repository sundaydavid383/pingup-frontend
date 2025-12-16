import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, ChevronDown } from "lucide-react"; // React icons

const ProfileViewersDropdown = ({ viewers = [], totalViews = 0 }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition flex items-center gap-2"
      >
        <Eye className="w-4 h-4" />
        {totalViews} Views
        <ChevronDown
          className={`w-4 h-4 ml-1 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 bottom-12 mt-2 w-64 bg-white shadow-lg rounded-lg max-h-60 overflow-y-auto border border-gray-200 z-50">
          {viewers.length === 0 ? (
            <p className="p-2 text-sm text-gray-500">No viewers yet.</p>
          ) : (
            viewers.map((viewer) => (
              <Link
                key={viewer._id}
                to={`/profile/${viewer._id}`}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 transition"
              >
                <img
                  src={viewer.profilePicUrl || ""}
                  alt={viewer.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{viewer.name || viewer.username}</span>
                  <span className="text-xs text-gray-500">@{viewer.username}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileViewersDropdown;
