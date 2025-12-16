import React from "react";

const RecentMessagesSkeleton = () => {
  return (
    <div className="flex flex-col max-h-56 overflow-y-scroll no-scrollbar">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex items-start gap-2 px-2 py-3 animate-pulse">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gray-200"></div>

          {/* Content */}
          <div className="flex-1 border-b border-gray-100 pb-2">
            {/* Name + Timestamp */}
            <div className="flex items-center justify-between mb-1">
              <div className="w-24 h-3 bg-gray-200 rounded"></div>
              <div className="w-10 h-3 bg-gray-200 rounded"></div>
            </div>

            {/* Preview */}
            <div className="w-40 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentMessagesSkeleton;
