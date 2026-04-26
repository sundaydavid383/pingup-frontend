import React from "react";

const RecentMessagesSkeleton = () => {
  return (
    <div className="w-full bg-white rounded-xl shadow-md p-0 m-0 animate-pulse">
      {/* Header */}
      <div className="px-2 pt-2 mb-2">
        <div className="h-3 w-28 bg-gray-200 rounded"></div>
      </div>

      {/* List */}
      <div className="flex flex-col max-h-[60vh] overflow-y-auto">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="flex gap-3 px-3 py-3 rounded-lg"
          >
            {/* Avatar */}
            <div className="w-[44px] h-[44px] rounded-full bg-gray-200 shrink-0"></div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              {/* Top row: username + time */}
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                <div className="h-3 w-10 bg-gray-200 rounded"></div>
              </div>

              {/* Bottom row: message + badge */}
              <div className="flex justify-between items-center mt-1">
                <div className="h-3 w-40 bg-gray-200 rounded"></div>

                {/* Unread badge */}
                <div className="w-5 h-5 rounded-full bg-gray-200"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentMessagesSkeleton;