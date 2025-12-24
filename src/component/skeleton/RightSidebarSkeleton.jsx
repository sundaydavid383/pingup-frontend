// src/component/RightSidebarSkeleton.jsx
import React from "react";

const RightSidebarSkeleton = () => {
  return (
    <div className="w-full bg-white rounded-md shadow p-3 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-2/3 mb-3"></div>
      <div className="h-28 bg-slate-200 rounded mb-3"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded w-3/4"></div>

      <div className="mt-6">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>

        {/* 3 message previews */}
        <div className="space-y-2">
          <div className="h-10 bg-slate-200 rounded"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebarSkeleton;
