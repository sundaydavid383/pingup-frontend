import React, { useEffect, useRef } from "react";
import { useGlobalVideo } from "../../context/GlobalVideoContext";
import VideoPlayer from "./VideoPlayer"; // use your existing VideoPlayer
import { X } from "lucide-react";

export default function GlobalVideoModal() {
  const { videoState, updateVideoState, resetVideoState } = useGlobalVideo();
  const modalRef = useRef(null);
const isVisible = videoState.src && videoState.isDetached;


  // Sync currentTime every second
  useEffect(() => {
    if (!videoState.inlineRef || !videoState.playing) return;

    const interval = setInterval(() => {
      const vid = videoState.inlineRef;
      if (vid) {
        updateVideoState({ currentTime: vid.currentTime });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [videoState.inlineRef, videoState.playing]);

  if (!isVisible) return null;

  return (
    <div
      ref={modalRef}
      className="fixed bottom-4 right-4 z-50 w-[350px] md:w-[500px] bg-black rounded-xl shadow-lg overflow-hidden flex flex-col"
    >
      {/* Close button */}
      <button
        className="absolute top-2 right-2 text-white p-1 hover:bg-gray-800 rounded-full"
        onClick={() => {
  const inline = videoState.inlineRef;

  if (inline) {
    inline.currentTime = videoState.currentTime || 0;
    inline.play().catch(() => {});
  }

  updateVideoState({
    isDetached: false,
  });
}}

      >
        <X size={20} />
      </button>

      {/* Video player */}
    <VideoPlayer
  src={videoState.src}
  poster={videoState.poster}
  autoPlayOnView={false}
  sectionId="global-modal"
  maxHeight="280px"
  onEnded={() => resetVideoState()}
  onLoadedMetadata={(vid) => {
    vid.currentTime = videoState.currentTime || 0;
    if (videoState.playing) vid.play().catch(() => {});
  }}
/>

    </div>
  );
}
