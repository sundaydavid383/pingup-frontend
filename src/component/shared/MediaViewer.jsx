import { X, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import VideoPlayer from "./VideoPlayer"; // use your existing VideoPlayer

const MediaViewer = ({ post, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  console.log("this is the post we are currently renderingn ", post)

  const attachments = Array.isArray(post?.attachments) ? post.attachments : [];
  const videos = Array.isArray(post?.video_urls) ? post.video_urls : [];
  const allMedia = [...attachments, ...videos].filter(Boolean);
  const currentItem = allMedia[currentIndex];

  const isVideo =
    typeof currentItem === "string"
      ? currentItem.includes(".mp4") || currentItem.includes("youtube")
      : currentItem.url?.includes(".mp4") || currentItem.url?.includes("youtube");

  // Detect portrait orientation for images
  useEffect(() => {
    if (!currentItem || isVideo) return;
    const img = new Image();
    img.src = currentItem.url || currentItem;
    img.onload = () => {
      setIsPortrait(img.height > img.width * 1.2);
    };
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

  const MAX_LENGTH = 150;
  const content = post.content || "";
  const shouldTruncate = content.length > MAX_LENGTH;
  const displayText = showFullText ? content : content.slice(0, MAX_LENGTH);

  return (
    <div className="absolute inset-0 z-5550 flex flex-col items-center justify-center bg-black/95 p-4 py-11 overflow-auto">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="close-btn"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2
       text-gray-300 text-sm font-semibold z-[60] mb-9" >
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
      <div className="w-full flex justify-center items-center my-4 ">
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
                ? "max-h-[90vh] max-w-[60vw] object-contain"
                : "max-h-[90vh] max-w-full object-contain"
            }`}
          />
        )}
      </div>

      {/* Post Text */}
      {content && (
        <div className="max-w-3xl text-center text-gray-100 text-sm leading-relaxed mt-0 ">
          <span>{displayText}</span>
          {shouldTruncate && (
            <>
              {!showFullText && <span>... </span>}
              <button
                onClick={() => setShowFullText((prev) => !prev)}
                className="text-[var(--primary)] font-semibold ml-1 hover:underline"
              >
                {showFullText ? "Show less" : "Read more"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaViewer;
