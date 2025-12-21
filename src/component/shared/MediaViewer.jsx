import { X, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import VideoPlayer from "./VideoPlayer";
import "../../styles/sliderButtons.css";

const MediaViewer = ({ post, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [textVisible, setTextVisible] = useState(true); // toggle entire text block

  const attachments = Array.isArray(post?.attachments) ? post.attachments : [];
  const videos = Array.isArray(post?.video_urls) ? post.video_urls : [];
  const allMedia = [...attachments, ...videos].filter(Boolean);
  const currentItem = allMedia[currentIndex];

  const isVideo =
    typeof currentItem === "string"
      ? currentItem.includes(".mp4") || currentItem.includes("youtube")
      : currentItem.url?.includes(".mp4") || currentItem.url?.includes("youtube");

  useEffect(() => {
    if (!currentItem || isVideo) return;
    const img = new Image();
    img.src = currentItem.url || currentItem;
    img.onload = () => setIsPortrait(img.height > img.width * 1.2);
  }, [currentItem, isVideo]);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
    setShowFullText(false);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
    setShowFullText(false);
  };

  if (!currentItem) return null;

  const content = post.content || "";
  const MAX_LENGTH = 150;
  const shouldTruncate = content.length > MAX_LENGTH;
  const displayText = showFullText ? content : content.slice(0, MAX_LENGTH);

  return (
    <div className="absolute inset-0 z-[5550] flex flex-col items-center justify-center bg-black/95 p-4 overflow-auto">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="close-btn"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 text-gray-300 text-sm font-semibold z-[60]">
        {currentIndex + 1} / {allMedia.length}
      </div>

      {/* Navigation Buttons */}
      {allMedia.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="nav-btn nav-btn-prev"
          >
            <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>
          <button
            onClick={goNext}
            className="nav-btn nav-btn-next"
          >
            <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>
        </>
      )}

      {/* Media */}
      <div className="w-full flex justify-center items-center my-4">
        {isVideo ? (
          <div className="w-full max-w-4xl">
            <VideoPlayer
              src={currentItem.url || currentItem}
              poster={currentItem.poster}
              maxHeight="80vh"
              autoPlayOnView={false}
              unmuteOnView={false}
            />
          </div>
        ) : (
          <img
            src={currentItem.url || currentItem}
            alt="media"
            className={`rounded-lg shadow-lg ${
              isPortrait
                ? "max-h-[80vh] max-w-[60vw] object-contain"
                : "max-h-[80vh] max-w-full object-contain"
            }`}
          />
        )}
      </div>

      {/* Always-visible toggle button */}
      {content && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
          <button
            className="text-[var(--primary)] font-semibold text-sm hover:underline bg-black/50 px-2 py-1 rounded"
            onClick={() => setTextVisible((prev) => !prev)}
          >
            {textVisible ? "" : "Show Text"}
          </button>
        </div>
      )}

      {/* Text Overlay */}
      {textVisible && content && (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-3xl bg-black/80 p-4 text-gray-100 rounded-xl z-[50] flex flex-col items-center">
  {/* Text content */}
  <p
    className={`text-center text-sm leading-relaxed ${
      !showFullText ? "line-clamp-2" : ""
    }`}
  >
    {displayText}
  </p>

  {/* Buttons */}
  <div className="flex items-center gap-4 mt-2 flex-wrap justify-center w-full">
    {/* Show more / Show less */}
    {shouldTruncate && (
      <button
        className="text-[var(--primary)] font-semibold hover:underline text-sm"
        onClick={() => setShowFullText((prev) => !prev)}
      >
        {showFullText ? "Show less" : "See more"}
      </button>
    )}

    {/* Cancel hides the overlay */}
   <button
    className="absolute top-2 right-2 text-white text-xs bg-red-600 px-2 py-0.5 rounded hover:bg-red-700"
    onClick={() => setTextVisible(false)}
  >
    ✕
  </button>

  </div>
</div>

      )}

      <div className="h-8" />
    </div>
  );
};

export default MediaViewer;
