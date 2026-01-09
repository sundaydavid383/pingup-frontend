// SkeletonUserCard.jsx
import React from "react";

export default function SkeletonUserCard() {
  return (
    <div className="p-5 w-full shadow-md border border-gray-200 rounded-xl bg-white animate-pulse flex flex-col justify-between min-h-[240px] md:min-h-[260px]">
      
      {/* TOP SECTION */}
      <div className="flex flex-col md:flex-row gap-4 items-start w-full">
        
        {/* Avatar */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <div className="w-20 h-20 rounded-full bg-gray-200 shadow" />
        </div>

        {/* Text content */}
        <div className="flex-1 w-full flex flex-col items-center md:items-start">
          
          {/* Name */}
          <div className="h-4 bg-gray-200 rounded w-40 mb-2" />

          {/* Username */}
          <div className="h-3 bg-gray-200 rounded w-28 mb-3" />

          {/* Pills */}
          <div className="flex gap-2 mb-3">
            <div className="h-4 w-20 bg-gray-200 rounded-md" />
            <div className="h-4 w-24 bg-gray-200 rounded-md" />
          </div>

          {/* Bio (2 lines) */}
          <div className="w-full space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
