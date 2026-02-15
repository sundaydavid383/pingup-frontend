import { X, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";
import VideoPlayer from "./VideoPlayer";

const MediaViewer = ({ post, initialIndex = 0, onClose }) => {
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showFullText, setShowFullText] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const [ready, setReady] = useState(false);

  // Track loaded state per image
  const [loadedImages, setLoadedImages] = useState({});


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

  /* 🔹 Scroll to initial index on mount and when initialIndex changes */

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    containerRef.current.scrollLeft = width * initialIndex;
    setCurrentIndex(initialIndex);
    requestAnimationFrame(() => {
      setReady(true);
    });
  }, [initialIndex]);

  /* 🔹 Handle image load for specific image */
  const handleImageLoad = (index) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  /* 🔹 Navigate to previous image */
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        containerRef.current.scrollTo({ left: width * newIndex, behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  /* 🔹 Navigate to next image */
  const goToNext = useCallback(() => {
    if (currentIndex < allMedia.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        containerRef.current.scrollTo({ left: width * newIndex, behavior: 'smooth' });
      }
    }
  }, [currentIndex, allMedia.length]);

  /* 🔹 Keyboard navigation */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, onClose]);


  /* 🔹 Update index based on scroll position */
  const handleScroll = () => {
    if (!containerRef.current) return;

    // Use each item width instead of clientWidth
    const itemWidth = containerRef.current.firstChild?.clientWidth || containerRef.current.clientWidth;
    const { scrollLeft } = containerRef.current;
    const index = Math.round(scrollLeft / itemWidth); // precise per item
    setCurrentIndex(index);
    setShowFullText(false);
  };
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      containerRef.current.scrollLeft = currentIndex * containerRef.current.clientWidth;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentIndex]);


  if (!allMedia.length) return null;

  return (
    <div className="fixed inset-0 z-[999995550] bg-black/95">

      {/* ❌ Close */}
      <button onClick={onClose} className="close-btn">
        <X className="w-5 h-5" />
      </button>

      {/* 🔹 Navigation arrows */}
      {allMedia.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentIndex < allMedia.length - 1 && (
            <button
              onClick={goToNext}
              className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </>
      )}

      {/* 🔹 WhatsApp-style progress */}
      <div className="fixed top-3 left-3 right-3 z-[6] flex gap-1">
        {allMedia.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < currentIndex
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
        className={`flex h-full w-full overflow-x-scroll overflow-y-hidden snap-x snap-mandatory touch-pan-x
    transition-opacity duration-200
    ${ready ? "opacity-100" : "opacity-40"}
  `}
      >

        {allMedia.map((item, index) => {
          const isVideo = typeof item === "string"
            ? item.includes(".mp4") || item.includes("youtube")
            : item.url?.includes(".mp4") || item.url?.includes("youtube");

          return (
            <div
              key={index}
              className="flex-shrink-0 snap-start flex items-center justify-center"
              style={{ width: `${containerRef.current?.clientWidth || window.innerWidth}px`, height: "100%" }}
            >
              {isVideo ? (
                <VideoPlayer
                  src={item.url || item}
                  poster={item.poster}
                  maxHeight="80vh"
                  autoPlayOnView={index === currentIndex}
                  unmuteOnView={false}
                />
              ) : (
                <div className="relative max-h-[80vh] max-w-[90vw] flex items-center justify-center">
                  {!loadedImages[index] && (
                    <img
                      src={item.url || item}
                      alt="media"
                      className="absolute inset-0 w-full h-full object-contain blur-2xl scale-110 opacity-60"
                    />
                  )}

                  <img
                    src={item.url || item}
                    alt="media"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onLoad={() => handleImageLoad(index)}
                    style={{ userSelect: "none" }}
                    className={`relative z-10 max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-lg
      transition-opacity duration-300
      ${loadedImages[index] ? "opacity-100" : "opacity-0"}
    `}
                  />
                </div>)
              }
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
