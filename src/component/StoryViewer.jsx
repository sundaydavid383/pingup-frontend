import { BadgeCheck, X, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosBase from "../utils/axiosBase";
import "./story.css";
import { useAuth } from "../context/AuthContext";
import VideoPlayer from "./shared/VideoPlayer";
import ActionNotifier from "./shared/ActionNotifier";
import StoryTextOverlay from "./shared/StoryTextOverlay";
import moment from "moment";

const StoryViewer = ({ viewStory, setViewStory, stories }) => {
  const { user: currentUser } = useAuth();
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const isOwnerOrAdmin = currentUser?._id === viewStory?.user?.userId || currentUser?.role === "admin";
  const rawUser = viewStory?.user || {};
  const displayName = rawUser.name || rawUser.full_name || rawUser.displayName || "";

  useEffect(() => {
    if (!viewStory || viewStory.media_type === "video") return;
    const duration = 10000; // 10 seconds per story
    const tick = 100;

    let interval = setInterval(() => {
      if (!isPaused) {
        setElapsed(prev => {
          const next = prev + tick;
          setProgress((next / duration) * 100);
          if (next >= duration) handleNextStory();
          return next;
        });
      }
    }, tick);
    return () => clearInterval(interval);
  }, [viewStory, isPaused]);

  const handleNextStory = () => {
    const index = stories.findIndex(s => (s._id || s.id) === (viewStory._id || viewStory.id));
    if (index !== -1 && index < stories.length - 1) {
      setViewStory(stories[index + 1]);
      resetProgress();
    } else {
      setViewStory(null); // Close viewer if last story
    }
  };

  const handlePrevStory = () => {
    const index = stories.findIndex(s => (s._id || s.id) === (viewStory._id || viewStory.id));
    if (index > 0) {
      setViewStory(stories[index - 1]);
      resetProgress();
    }
  };

  const resetProgress = () => {
    setProgress(0);
    setElapsed(0);
    setIsPaused(false);
  };

  const confirmDeleteStory = async () => {
    try {
      setLoadingDelete(true);
      await axiosBase.delete(`/api/stories/${viewStory.id || viewStory._id}`);
      setViewStory(null);
    } catch (err) {
      console.error("🚨 Error deleting story:", err);
    } finally {
      setLoadingDelete(false);
    }
  };

  if (!viewStory) return null;

  return (
    <div className="fixed inset-0 h-screen w-full z-[5550] flex flex-col items-center justify-center bg-black">
      {/* Progress Bars Container */}
      <div className="absolute top-2 left-0 w-full px-2 flex gap-1 z-[9999]">
        <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* User Info Header Overlay */}
      <div className="absolute top-6 left-4 z-[9999] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full ring-2 ring-[var(--primary)] overflow-hidden aspect-square">
          <img
            src={rawUser.profile_image}
            className="w-full h-full object-cover rounded-full aspect-square"
            alt="Avatar"
          />
        </div>
        <div className="text-white drop-shadow-md">
          <p className="text-sm font-bold flex items-center gap-1">
            {displayName} <BadgeCheck size={14} className="text-blue-400" />
          </p>
          <p className="text-[10px] opacity-80">{moment(viewStory.createdAt).fromNow()}</p>
        </div>
      </div>

      {/* Close/Delete Actions */}
      <div className="absolute top-6 right-4 z-[9999] flex gap-3">
        {isOwnerOrAdmin && (
          <button onClick={() => setShowDeletePopup(true)} className="p-2 bg-red-600/20 hover:bg-red-600 rounded-full text-white transition">
            <Trash2 size={20} />
          </button>
        )}
        <button onClick={() => setViewStory(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
          <X size={20} />
        </button>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-0 flex justify-between items-center z-40 pointer-events-none">
        <div onClick={handlePrevStory} className="h-full w-1/4 pointer-events-auto cursor-pointer" />
        <div onClick={handleNextStory} className="h-full w-1/4 pointer-events-auto cursor-pointer" />
      </div>

      {/* Visual Navigation Buttons */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-50 pointer-events-none">
        <button onClick={handlePrevStory} className="p-3 bg-black/40 text-white rounded-full pointer-events-auto hover:bg-black/60">◀</button>
        <button onClick={handleNextStory} className="p-3 bg-black/40 text-white rounded-full pointer-events-auto hover:bg-black/60">▶</button>
      </div>

      {/* Content Rendering */}
      <div className="w-full h-full flex items-center justify-center p-2">
        {viewStory.media_type === "image" && (
          <img src={viewStory.media_url} className="max-h-screen max-w-full rounded-lg object-contain" alt="story" />
        )}
        {viewStory.media_type === "video" && (
          <VideoPlayer src={viewStory.media_url} onEnded={handleNextStory} autoPlayOnView />
        )}
        {viewStory.content && <StoryTextOverlay content={viewStory.content} />}
      </div>

      {showDeletePopup && (
        <ActionNotifier 
          action="delete this story" 
          onConfirm={confirmDeleteStory} 
          onCancel={() => setShowDeletePopup(false)} 
        />
      )}
    </div>
  );
};

export default StoryViewer;