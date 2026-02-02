// src/component/chat/MediaDropdown.jsx
import React, { useEffect, useRef } from "react";
import { ImageIcon, FileText, Video } from "lucide-react";

const MediaDropdown = ({ open, onClose, onSelect }) => {
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };

    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-2 w-48 bg-white rounded-xl shadow-lg border z-50 animate-fadeIn"
    >
      <button
        onClick={() => onSelect("image")}
        className="flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-100"
      >
        <ImageIcon size={18} /> Image
      </button>

      <button
        onClick={() => onSelect("file")}
        className="flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-100"
      >
        <FileText size={18} /> File
      </button>

      <button
        onClick={() => onSelect("video")}
        className="flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-100"
      >
        <Video size={18} /> Video
      </button>
    </div>
  );
};

export default MediaDropdown;
