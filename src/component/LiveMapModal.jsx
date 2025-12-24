import React from "react";
import LiveMap from "./LiveMap";

const LiveMapModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999999999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Fullscreen modal */}
      <div className="relative z-10 w-full h-full bg-white">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white shadow px-3 py-1 rounded-full"
        >
          ✕
        </button>

        {/* Map */}
        <div className="w-[80%] h-[90%]">
          <LiveMap open={open} />
        </div>
      </div>
    </div>
  );
};

export default LiveMapModal;
