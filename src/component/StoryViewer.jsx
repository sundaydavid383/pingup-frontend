import { BadgeCheck, X, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosBase from "../utils/axiosBase";
import "./story.css";
import { useAuth } from "../context/AuthContext";
import VideoPlayer from "./shared/VideoPlayer";
import ActionNotifier from "./shared/ActionNotifier";

const StoryViewer = ({ viewStory, setViewStory, stories}) => {
  const { user: currentUser } = useAuth();
  const [progress, setProgress] = useState(0);
  const [musicUrl, setMusicUrl] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const [loadingDelete, setLoadingDelete] = useState(false);
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const isOwnerOrAdmin =
    currentUser?._id === viewStory?.user?.userId || currentUser?.role === "admin";

  // ------------------- Story Progress & Audio -------------------
useEffect(() => {
  if (!viewStory || viewStory.media_type === "video") return;
  const duration = 10000;
  const tick = 100;

  let interval = setInterval(() => {
    if (!isPaused) {
      setElapsed(prev => {
        const next = prev + tick;
        setProgress((next / duration) * 100);
        if (next >= duration) {
          setViewStory(null);
        }
        return next;
      });
    }
  }, tick);

  return () => clearInterval(interval);
}, [viewStory, isPaused]);

    // ------------------- NEXT STORY -------------------
// Inside StoryViewer component, add these helper functions:
const handleNextStory = () => {
  if (!stories || !viewStory) return;

  const index = stories.findIndex(
    (s) => s._id === viewStory._id || s.id === viewStory.id
  );
  if (index === -1) return;

  const nextIndex = index + 1;
  if (nextIndex >= stories.length) return; // optional: close viewer or loop
  setViewStory(stories[nextIndex]);
  setProgress(0);
  setElapsed(0);
  setExpanded(false);
  setIsPaused(false);
};

const handlePrevStory = () => {
  if (!stories || !viewStory) return;

  const index = stories.findIndex(
    (s) => s._id === viewStory._id || s.id === viewStory.id
  );
  if (index <= 0) return; // optional: prevent negative index or loop
  setViewStory(stories[index - 1]);
  setProgress(0);
  setElapsed(0);
  setExpanded(false);
  setIsPaused(false);
};


  const fetchMusic = async () => {
    try {
      const url = "https://filesamples.com/samples/audio/mp3/sample3.mp3";
      setMusicUrl(url);
      setTimeout(() => {
        audioRef.current?.play().catch(() =>
          console.warn("Autoplay blocked — waiting for user interaction")
        );
      }, 200);
    } catch (error) {
      console.error("Failed to fetch music:", error);
    }
  };

const pauseMusic = () => {
  if (audioRef.current) {
    audioRef.current.pause();
  }
};
const resumeMusic = () => {
  if (audioRef.current) {
    audioRef.current.play().catch(() => {});
  }
};

const handleClose = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }
  setViewStory(null);
};

  // ------------------- DELETE STORY -------------------
const confirmDeleteStory = async () => {
  if (!viewStory?.user?.userId) {
    console.error("❌ No story selected to delete!");
    return;
  }

  try {
    setLoadingDelete(true);
    const endpoint = `/api/stories/${viewStory.id}`;
    const response = await axiosBase.delete(endpoint);

    console.log("✅ Story deleted successfully:", response.data);
    setViewStory(null);
  } catch (err) {
    console.error("🚨 Error deleting story:", err.response || err);
  } finally {
    setLoadingDelete(false);
  }
};

const handleDeleteStory = () => {
  setShowDeletePopup(true);
};

  // ------------------- Render Story Text -------------------
  const renderStoryText = (text) => {
    const maxLength = 180;
    const isLong = text.length > maxLength;
    const displayText = expanded || !isLong ? text : text.slice(0, maxLength) + "...";
   




    return (
      <div className="text-center max-w-3xl">
        <p className="text-white text-lg sm:text-xl font-medium leading-relaxed whitespace-pre-wrap">
          {displayText}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-[var(--primary)] font-semibold hover:underline transition-all"
          >
            {expanded ? "Show Less" : "Show More"}
          </button>
        )}
      </div>
    );
  };

  // ------------------- Render Story Content -------------------
  const renderContent = () => {
    switch (viewStory.media_type) {
      case "image":
        return (
          <div className="relative status_image h-full flex flex-col items-center justify-center overflow-hidden rounded-2xl">
            <div className="flex-1 w-full flex items-center justify-center bg-black">
              <img
                src={viewStory.media_url}
                alt={viewStory.title}
                className="max-w-full max-h-[70vh] object-contain rounded-t-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-500"
              />
            </div>
            {viewStory.content && (
              <div className="w-full py-5 px-6 bg-black/60 backdrop-blur-md flex justify-center rounded-b-2xl">
                {renderStoryText(viewStory.content)}
              </div>
            )}
          </div>
        );
      case "video":
        return (
          <div className="relative w-full h-full flex flex-col items-center bg-red justify-center overflow-hidden rounded-2xl">
            <div className="flex-1 w-full flex items-center justify-center bg-red">
<VideoPlayer
  src={viewStory.media_url}
  poster={viewStory.thumbnail || ""}
  maxHeight="90vh"
  autoPlayOnView={true}
  unmuteOnView={true}   // ✅ NEW
  onEnded={() => setViewStory(null)}
/>
              
            </div>
            {viewStory.content && (
              <div className="w-full py-5 px-0 bg-black/60 backdrop-blur-md flex justify-center rounded-b-2xl">
                {renderStoryText(viewStory.content)}
              </div>
            )}
          </div>
        );
      case "text":
      default:
        return (
          <div
            className="flex flex-col justify-center items-center text-center w-full h-full p-8 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-700"
            style={{
              background: viewStory.background_color || "#1e293b",
            }}
          >
            {renderStoryText(viewStory.content || "No content available")}
          </div>
        );
    }
  };

  if (!viewStory) return null;

  return (
    <div
      className="absolute inset-0 h-screen w-[100%] z-5550 flex flex-col items-center justify-center backdrop-blur-3xl transition-all duration-700"
      style={{
        backgroundColor:
          viewStory.media_type === "text"
            ? viewStory.background_color || "#000"
            : "#000",
      }}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 overflow-hidden rounded-full">
        <div
          className="h-full bg-gradient-to-r from-[var(--primary)] to-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* User Info */}
      <div
        onClick={() => navigate(`/profile/${viewStory?.user?.userId}`)}
        className="cursor-pointer title z-[9999] absolute top-0 left-0 flex items-center space-x-3 p-3 px-6 backdrop-blur-2xl rounded-2xl bg-black/40 border border-white/10"
      >
        <img
          src={viewStory.user?.profile_image}
          alt="Profile"
          className="w-11 h-11 rounded-full ring ring-[var(--primary)]/40 shadow-md object-cover"
        />
        <div className="text-white font-medium flex items-center gap-2">
          <span className="text-base">{viewStory.user?.username || "Unknown"}</span>
          <BadgeCheck className="w-4 h-4 text-[var(--primary)]" />
        </div>
      </div>

      {/* Close Button */}
<button
  onClick={handleClose}
  className="absolute top-1 right-1 z-[9999] bg-black/40 hover:bg-black/60 
             rounded-full p-2.5 transition-all focus:outline-none shadow-lg 
             backdrop-blur-xl border border-white/10"
>
  <X className="w-6 h-6 text-white hover:text-[var(--primary)] transition-colors duration-200" />
</button>


      {/* Delete Button */}
{isOwnerOrAdmin && (
  <button
    onClick={handleDeleteStory}
    disabled={loadingDelete}
    className="absolute top-20 right-5 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg rounded-full transition-all duration-300 focus:outline-none"
  >
    <Trash2 className="w-5 h-5" />
    <span>{loadingDelete ? "Deleting..." : "Delete Story"}</span>
  </button>
)}


<div className="absolute top-[-70%] inset-0 flex items-center justify-between px-4">
  {/* Previous */}
  <button
    onClick={handlePrevStory}
    className="bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition"
  >
    ◀
  </button>

  {/* Next */}
  <button
    onClick={handlePrevStory}
    className="bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition"
  >
    ▶
  </button>
</div>


      {/* Main Story */}
      <div
        className="max-w-[90vw] max-h-[95vh] flex items-center justify-center relative"
      onMouseEnter={() => {
  if (viewStory.media_type !== "video") {
    setIsPaused(true);
    pauseMusic();
  }
}}
onMouseLeave={() => {
  if (viewStory.media_type !== "video") {
    setIsPaused(false);
    resumeMusic();
  }
}}

      >
        {renderContent()}
      </div>

      {musicUrl && <audio ref={audioRef} src={musicUrl} loop />}
      {showDeletePopup && (
  <ActionNotifier
    action="delete this story"
    onConfirm={() => {
      setShowDeletePopup(false);
      confirmDeleteStory();
    }}
    onCancel={() => setShowDeletePopup(false)}
  />
)}

    </div>
  );
};

export default StoryViewer;
