import React from "react";
import LiveMap from "./LiveMap";

const LiveMapModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] w-[300px] sm:w-[350px] h-[220px] bg-white rounded-xl shadow-xl border border-gray-300 overflow-hidden"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 bg-white shadow p-1 rounded-full text-gray-700 hover:bg-gray-100"
      >
        ✕
      </button>

      {/* Map content */}
      <LiveMap />
    </div>
  );
};

export default LiveMapModal;
