// SkeletonUserCard.jsx
import React from "react";

export default function SkeletonUserCard() {
  return (
    <div className="p-5 w-full shadow-md border border-gray-200 rounded-xl bg-white animate-pulse">
      <div className="flex flex-row gap-6 items-end w-full min-h-[140px] flex-nowrap">
        {/* COLUMN 1 — Avatar + Name */}
        <div className="flex flex-col items-center md:items-start justify-end">
          <div className="w-24 h-24 bg-gray-200 rounded-full shadow mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>

        {/* COLUMN 2 — Meta Info */}
        <div className="flex flex-col items-center justify-end gap-3">
          <div className="h-5 bg-gray-200 rounded-full w-20"></div>
          <div className="h-5 bg-gray-200 rounded-full w-24"></div>
        </div>

        {/* COLUMN 3 — Actions */}
        <div className="flex flex-col items-center md:items-end justify-end gap-3">
          <div className="h-8 bg-gray-200 rounded-full w-24 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded-full w-28 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  );
}
