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
  <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-h-[60vh] bg-black/60 text-white flex flex-col items-center z-[999998] rounded-2xl overflow-hidden backdrop-blur-sm p-6">
    
    {/* Cancel button - moved slightly for centered layout */}
    <button
      className="absolute top-3 right-3 text-white text-xs bg-white/10 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition z-10"
      onClick={() => setTextVisible(false)}
    >
      ✕
    </button>

    {/* Scrollable text content centered */}
    <div className="w-full overflow-y-auto h-full flex flex-col items-center justify-center">
      <p className="text-center text-lg sm:text-2xl font-medium leading-snug">
        {content} {/* Using full content for centered stories often looks better */}
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
