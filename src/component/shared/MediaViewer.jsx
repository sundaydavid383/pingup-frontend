import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import VideoPlayer from "./VideoPlayer";

const MediaViewer = ({ post, initialIndex = 0, onClose }) => {
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showFullText, setShowFullText] = useState(false);
  const [textVisible, setTextVisible] = useState(true);

  const attachments = Array.isArray(post?.attachments) ? post.attachments : [];
  const videos = Array.isArray(post?.video_urls) ? post.video_urls : [];
  const allMedia = [...attachments, ...videos].filter(Boolean);

  const content = post.content || "";
const TEXT_LIMIT = 120;

const isLongText = content.length > TEXT_LIMIT;

const truncatedText = content.slice(0, TEXT_LIMIT) + "...";

const displayText = showFullText || !isLongText
  ? content
  : truncatedText;

  /* 🔹 Scroll to initial index on mount */
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    containerRef.current.scrollLeft = width * initialIndex;
  }, [initialIndex]);

  /* 🔹 Update index based on scroll position */
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setCurrentIndex(index);
    setShowFullText(false);
  };

  if (!allMedia.length) return null;

  return (
    <div className="fixed inset-0 z-[995550] bg-black/95">

      {/* ❌ Close */}
      <button onClick={onClose} className="close-btn">
        <X className="w-5 h-5" />
      </button>

      {/* 🔹 WhatsApp-style progress */}
      <div className="fixed top-3 left-3 right-3 z-[6] flex gap-1">
        {allMedia.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < currentIndex
                ? "bg-white"
                : i === currentIndex
                ? "bg-white/80"
                : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* 🔹 Horizontal swipe container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="
          flex h-full w-full overflow-x-scroll overflow-y-hidden
          snap-x snap-mandatory scroll-smooth
          touch-pan-x
        "
      >
        {allMedia.map((item, index) => {
          const isVideo =
            typeof item === "string"
              ? item.includes(".mp4") || item.includes("youtube")
              : item.url?.includes(".mp4") || item.url?.includes("youtube");

          return (
            <div
              key={index}
              className="w-screen h-full flex-shrink-0 snap-center flex items-center justify-center"
            >
              {isVideo ? (
                <div className="w-full max-w-4xl px-4">
                  <VideoPlayer
                    src={item.url || item}
                    poster={item.poster}
                    maxHeight="80vh"
                    autoPlayOnView={index === currentIndex}
                    unmuteOnView={false}
                  />
                </div>
              ) : (
                <img
                  src={item.url || item}
                  alt="media"
                  className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 🔹 Toggle text */}
      {content && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
          <button
            className="text-[var(--primary)] text-sm bg-black/50 px-3 py-1 rounded"
            onClick={() => setTextVisible((p) => !p)}
          >
            {textVisible ? "" : "Show Text"}
          </button>
        </div>
      )}

      {/* 🔹 Text overlay */}
 {textVisible && content && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-black/80 p-4 rounded-xl text-gray-100 z-[50]">
    
<p className="text-center text-sm font-normal leading-loose">
  {displayText}
</p>


    {isLongText && (
      <div className="flex justify-center mt-2">
        <button
          className="text-[var(--primary)] text-sm font-semibold hover:underline"
          onClick={() => setShowFullText((prev) => !prev)}
        >
          {showFullText ? "See less" : "See more"}
        </button>
      </div>
    )}

    <button
      className="absolute top-[-0.5rem] right-2 text-xs bg-red-600 px-4 py-1 rounded"
      onClick={() => setTextVisible(false)}
    >
      ✕
    </button>
  </div>
)}

    </div>
  );
};

export default MediaViewer;
