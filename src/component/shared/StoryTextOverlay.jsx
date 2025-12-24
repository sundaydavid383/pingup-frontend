import React, { useState } from "react";

const StoryTextOverlay = ({ content }) => {
  const [expanded, setExpanded] = useState(false); // Show full text or truncated
  const [textVisible, setTextVisible] = useState(true); // Toggle entire text overlay

  const MAX_LENGTH = 120; // Adjust as needed
  const isLong = content.length > MAX_LENGTH;
  const displayText = expanded || !isLong ? content : content.slice(0, MAX_LENGTH);

  return (
    <>
      {/* Always-visible toggle */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[99999999]">
        <button
          className="text-[var(--primary)] font-semibold text-sm hover:underline bg-black/50 px-3 py-1 rounded"
          onClick={() => setTextVisible((prev) => !prev)}
        >
          {!textVisible && "Show Text"}
        </button>
      </div>

      {/* Overlay text */}
    { /* Overlay text */ }
{textVisible && (
  <div className="fixed  left-0 w-full h-[20vh] bottom-17 sm:h-[20vh] sm:bottom-0 bg-black/85 text-white flex flex-col items-center z-[999998] rounded-t-xl overflow-hidden">
    
    {/* Cancel button at top-right */}
    <button
      className="absolute top-2 right-2 text-white text-sm bg-red-600 px-2 py-1 rounded hover:bg-red-700 z-10"
      onClick={() => setTextVisible(false)}
    >
      ✕
    </button>

    {/* Scrollable text content */}
    <div className="w-full px-4 overflow-y-auto h-full flex flex-col items-center justify-center">
      <p className={`text-center text-sm sm:text-base leading-relaxed ${!expanded ? "line-clamp-4" : ""}`}>
        {displayText}
      </p>

      {/* Show more / Show less */}
      {isLong && (
        <button
          className="mt-2 text-[var(--primary)] font-semibold hover:underline text-sm"
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? "Show less" : "See more"}
        </button>
      )}
    </div>
  </div>
)}



    </>
  );
};

export default StoryTextOverlay;
