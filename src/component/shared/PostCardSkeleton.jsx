// src/component/PostCardSkeleton.jsx
import React from "react";
import "./postcard-skeleton.css";

const generateRandom = () => {
  return Math.floor(Math.random() * 5) + 3; // random 3–7 items
};

const PostCardSkeleton = () => {
  const count = generateRandom();

  return (
    <div className="w-full flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-card"
        >
          {/* HEADER */}
          <div className="flex items-center gap-3 mb-3">
            <div className="skeleton avatar"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton short"></div>
              <div className="skeleton tiny"></div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="space-y-2 mb-3">
            <div className="skeleton long"></div>
            <div className="skeleton medium"></div>
            <div className="skeleton tiny"></div>
          </div>

          {/* MEDIA SECTION */}
          <div className="skeleton media"></div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-6 mt-4">
            <div className="skeleton icon"></div>
            <div className="skeleton icon"></div>
            <div className="skeleton icon"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostCardSkeleton;
