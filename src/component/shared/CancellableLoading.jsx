// src/components/shared/CancellableLoading.jsx
import React from "react";

export default function CancellableLoading({ text = "Loading...", onCancel }) {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-6 bg-zinc-900 rounded-lg shadow-lg">
        <div className="w-12 h-12 border-4 border-t-[var(--primary,#1f6feb)] border-gray-300 rounded-full animate-spin" />
        <p className="text-white text-lg">{text}</p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
