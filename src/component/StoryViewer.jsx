import { BadgeCheck, X, Trash2, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import axiosBase from "../utils/axiosBase";
import "./story.css";
import { useAuth } from "../context/AuthContext";
import VideoPlayer from "./shared/VideoPlayer";
import ActionNotifier from "./shared/ActionNotifier";
import StoryTextOverlay from "./shared/StoryTextOverlay";
import moment from "moment";
import assets from "../assets/assets";

const StoryViewer = ({ viewStory, setViewStory, stories, setStories }) => {
  const { user: currentUser } = useAuth();
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [newReply, setNewReply] = useState("");
  const typingTimeout = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justAddedReplyId, setJustAddedReplyId] = useState(null);


  const rawUser = viewStory?.user || {};
  const storyUserId = rawUser.userId || rawUser._id || rawUser.id;
  const currentId = currentUser?._id || currentUser?.id;
  
  const isOwnerOrAdmin = (currentId && storyUserId && String(currentId) === String(storyUserId)) || currentUser?.role === "admin";
  
  const displayName = rawUser.name || rawUser.full_name || rawUser.displayName || "User";
  const profilePic = rawUser.profile_image || assets.defaultProfile;

  const userStories = useMemo(() => {
    if (!storyUserId) return [];
    return stories.filter(s => {
      const sUid = s.user?.userId || s.user?._id || s.user?.id;
      return String(sUid) === String(storyUserId);
    });
  }, [stories, storyUserId]);

const visibleReplies = useMemo(() => {
  if (!viewStory?.replies) return [];
  if (isOwnerOrAdmin) return viewStory.replies;
  return viewStory.replies.filter(
    r => String(r.userId) === String(currentUser?._id)
  );
}, [viewStory, currentUser, isOwnerOrAdmin]);



  const currentSubIndex = userStories.findIndex(s => (s._id || s.id) === (viewStory._id || viewStory.id));
const submitReply = async () => {
  if (!newReply.trim() || isSubmitting) return;

  try {
    setIsSubmitting(true); // ⏳ start loading

    const storyId = viewStory._id || viewStory.id;
    const res = await axiosBase.post(
      `/api/stories/${storyId}/replies`,
      { replyText: newReply }
    );

    const newReplyObj = res.data.reply;

    // 1️⃣ Update viewStory (instant UI)
    setViewStory(prev => ({
      ...prev,
      replies: [...(prev.replies || []), newReplyObj]
    }));

    setJustAddedReplyId(newReplyObj._id);

// auto clear after animation
setTimeout(() => setJustAddedReplyId(null), 600);

    // 2️⃣ Update stories (SOURCE OF TRUTH)
    setStories(prev =>
      prev.map(story =>
        (story._id || story.id) === storyId
          ? {
              ...story,
              replies: [...(story.replies || []), newReplyObj]
            }
          : story
      )
    );

    setNewReply("");
  } catch (err) {
    console.error("Reply failed:", err);
  } finally {
    setIsSubmitting(false); // ✅ stop loading
  }
};



const handleDeleteReply = async (reply) => {
  try {
    const storyId = viewStory._id || viewStory.id;
    const replyId = reply._id;

    await axiosBase.delete(`/api/stories/${storyId}/replies/${replyId}`);

    // 1️⃣ Update viewStory
    setViewStory(prev => ({
      ...prev,
      replies: prev.replies.filter(r => r._id !== replyId)
    }));

    // 2️⃣ Update stories
    setStories(prev =>
      prev.map(story =>
        (story._id || story.id) === storyId
          ? {
              ...story,
              replies: story.replies.filter(r => r._id !== replyId)
            }
          : story
      )
    );
  } catch (err) {
    console.error("Delete reply failed:", err);
  }
};


const handleEditReply = async (reply) => {
  const newText = prompt("Edit your reply:", reply.replyText);
  if (!newText) return;

  try {
    const storyId = viewStory._id || viewStory.id;
    const replyId = reply._id;

    const res = await axiosBase.put(
      `/api/stories/${storyId}/replies/${replyId}`,
      { replyText: newText }
    );

    const updatedReply = res.data.reply;

    // 1️⃣ Update viewStory
    setViewStory(prev => ({
      ...prev,
      replies: prev.replies.map(r =>
        r._id === replyId ? updatedReply : r
      )
    }));

    // 2️⃣ Update stories
    setStories(prev =>
      prev.map(story =>
        (story._id || story.id) === storyId
          ? {
              ...story,
              replies: story.replies.map(r =>
                r._id === replyId ? updatedReply : r
              )
            }
          : story
      )
    );
  } catch (err) {
    console.error("Edit reply failed:", err);
  }
};


  useEffect(() => {
    if (!viewStory) return;
    if (viewStory.media_type !== "video") {
      const duration = 10000;
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
    }
  }, [viewStory, isPaused]);

  const handleNextStory = () => {
    const globalIndex = stories.findIndex(s => (s._id || s.id) === (viewStory._id || viewStory.id));
    if (globalIndex !== -1 && globalIndex < stories.length - 1) {
      setViewStory(stories[globalIndex + 1]);
      resetProgress();
    } else {
      setViewStory(null);
    }
  };

  const handlePrevStory = () => {
    const globalIndex = stories.findIndex(s => (s._id || s.id) === (viewStory._id || viewStory.id));
    if (globalIndex > 0) {
      setViewStory(stories[globalIndex - 1]);
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
      const storyId = viewStory.id || viewStory._id;
      await axiosBase.delete(`/api/stories/${storyId}`);
      setViewStory(null);
      window.location.reload(); 
    } catch (err) {
      console.error("🚨 Delete failed:", err);
    }
  };

  useEffect(() => {
  setShowAllReplies(false);
}, [viewStory]);

  useEffect(() => {
  {isSubmitting && setIsPaused(true);}
}, [isSubmitting]);


  if (!viewStory) return null;

  return (
    <div className="fixed inset-0 h-screen w-full z-[1000000001] flex items-center justify-center bg-black/95 backdrop-blur-xl overflow-hidden p-4">
      <div className="absolute inset-0 z-0" onClick={() => setViewStory(null)} />

      {/* Navigation Arrows */}
      <div className="hidden md:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-8 z-50 pointer-events-none">
        <button onClick={handlePrevStory} className={`p-3 rounded-full bg-white/10 text-white pointer-events-auto hover:bg-white/20 transition ${stories.indexOf(viewStory) === 0 ? 'invisible' : 'visible'}`}>
          <ChevronLeft size={32} />
        </button>
        <button onClick={handleNextStory} className="p-3 rounded-full bg-white/10 text-white pointer-events-auto hover:bg-white/20 transition">
          <ChevronRight size={32} />
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[420px] h-full max-h-[85vh] bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-white/5 flex flex-col">
        
        {/* Progress Bars */}
        <div className="absolute top-4 left-0 w-full px-4 flex gap-1.5 z-50">
          {userStories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear" 
                style={{ width: idx === currentSubIndex ? `${progress}%` : idx < currentSubIndex ? '100%' : '0%' }} 
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-10 left-4 z-50 flex items-center gap-3 w-full pr-4">
          <div className="viewer-profile-circle border border-white/20 shadow-lg">
  <img 
    src={profilePic} 
    className="story-image-fill" 
    alt="" 
  />
</div>
          <div className="flex flex-col text-white truncate max-w-[140px]">
            <span className="text-sm font-bold flex items-center gap-1 drop-shadow-md">
              {displayName} <BadgeCheck size={14} className="text-blue-400 fill-blue-400" />
            </span>
            <span className="text-[10px] opacity-70 drop-shadow-sm">{moment(viewStory.createdAt).fromNow()}</span>
          </div>

          <div className="ml-auto flex items-center gap-2 mr-12">
            <button onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }} className="p-2 hover:bg-white/10 rounded-full text-white transition">
              {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
            </button>
            {isOwnerOrAdmin && (
              <button onClick={(e) => { e.stopPropagation(); setShowDeletePopup(true); }} className="p-2 hover:bg-red-500/20 rounded-full text-red-500 transition">
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        <button onClick={() => setViewStory(null)} className="absolute top-10 right-4 z-[60] text-white/70 hover:text-white transition-colors">
          <X size={28} />
        </button>

        {/* --- IMPROVED MEDIA CONTAINER --- */}
        <div 
            className="flex-1 w-full bg-black flex items-center justify-center relative overflow-hidden"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
          {/* Blurred Background for Wide/Tall Images */}
          {viewStory.media_url && (
            <img 
              src={viewStory.media_url} 
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110" 
              alt="" 
            />
          )}

          {/* Actual Media Content - Using object-contain to prevent "Half Image" */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
  {viewStory.media_type === "image" && (
    <img 
      src={viewStory.media_url} 
      className="max-w-full max-h-full object-contain" // This is correct for full images
      alt="Story" 
    />
            )}
            {viewStory.media_type === "video" && (
              <VideoPlayer 
                src={viewStory.media_url} 
                onEnded={handleNextStory} 
                autoPlayOnView 
                isPaused={isPaused} 
                className="max-w-full max-h-full object-contain"
              />
            )}
            {!viewStory.media_url && (
               <div className="w-full h-full flex items-center justify-center p-8 text-center" style={{ background: viewStory.background_color || '#18181b' }}>
                  <h2 className="text-white text-2xl font-bold leading-tight drop-shadow-xl">{viewStory.content}</h2>
               </div>
            )}
          </div>

          {/* Caption Overlay */}
          {viewStory.media_url && viewStory.content && (
            <div className="absolute bottom-10 left-0 w-full px-6 text-center z-40">
               <p className="bg-black/60 backdrop-blur-md text-white py-2.5 px-4 rounded-xl text-sm inline-block shadow-2xl border border-white/10">
                {viewStory.content}
               </p>
            </div>
          )}
        </div>

        {/* Navigation Touch Zones */}
        {!isPaused && (
            <div className="absolute inset-0 flex z-30 md:hidden">
              <div onClick={handlePrevStory} className="h-full w-1/3" />
              <div onClick={handleNextStory} className="h-full w-2/3" />
            </div>
        )}




      </div>

      {/* --- Replies Section --- */}
<div className="absolute bottom-17 left-0 right-0 px-4 z-[9998] max-h-48 flex flex-col space-y-2 overflow-hidden">
  {visibleReplies.length > 0 ? (
    <>
      {/* --- Show first visible reply --- */}
      <div
        className={`flex items-start gap-2 bg-[var(--form-bg)]
        text-[var(--text-main)] p-2 rounded-[var(--radius)]
        shadow-md backdrop-blur-[var(--backdrop-blur)]
        border border-[var(--input-border)]
        ${justAddedReplyId === visibleReplies[0]._id ? "reply-animate" : ""}`}
      >
        <img
          src={visibleReplies[0].profilePic || assets.defaultProfile}
          className="w-8 h-8 rounded-full border border-[var(--primary)]"
          alt={visibleReplies[0].userName}
        />
        <div className="flex-1">
          <span className="font-semibold text-sm text-[var(--primary)]">
            {visibleReplies[0].userName}
          </span>
          <p className="text-xs text-[var(--text-secondary)]">
            {visibleReplies[0].replyText}
          </p>
        </div>
      </div>

      {/* --- Collapse / Expand (ONLY story owner sees this) --- */}
      {isOwnerOrAdmin && visibleReplies.length > 1 && (
        <button
          className="self-start text-xs text-[var(--primary)] hover:underline transition-[var(--transition-default)] mt-1"
          onClick={() => setShowAllReplies(prev => !prev)}
        >
          {showAllReplies
            ? "Collapse"
            : `View all ${visibleReplies.length} replies`}
        </button>
      )}

      {/* --- Expanded replies (owner only) --- */}
      {isOwnerOrAdmin &&
        showAllReplies &&
        visibleReplies.map((r, idx) => {
          if (idx === 0) return null;

          const isMine = String(r.userId) === String(currentUser?._id);

          return (
            <div
              key={r._id}
              className={`flex items-start gap-2 bg-[var(--form-bg)]
              text-[var(--text-main)] p-2 rounded-[var(--radius)]
              shadow-md backdrop-blur-[var(--backdrop-blur)]
              border border-[var(--input-border)]
              ${justAddedReplyId === r._id ? "reply-animate" : ""}`}
            >
              <img
                src={r.profilePic || assets.defaultProfile}
                className="w-8 h-8 rounded-full border border-[var(--primary)]"
                alt={r.userName}
              />
              <div className="flex-1 relative">
                <span className="font-semibold text-sm text-[var(--primary)]">
                  {r.userName}
                </span>
                <p className="text-xs text-[var(--text-secondary)]">
                  {r.replyText}
                </p>

                {isMine && (
                  <div className="absolute top-0 right-0 flex gap-1">
                    <button
                      onClick={() => handleEditReply(r)}
                      className="text-xs text-[var(--primary)] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReply(r)}
                      className="text-xs text-[var(--error)] hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </>
  ) : (
    <p className="text-xs text-[var(--text-muted)] italic">
      No replies yet.
    </p>
  )}
</div>



{/* --- Reply Input --- */}
{!isOwnerOrAdmin &&
<div className="absolute bottom-0 left-0 right-0 px-4 py-2 z-[9999] flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm">
<input
  type="text"
  value={newReply}
  disabled={isSubmitting}
  onChange={(e) => {
    setNewReply(e.target.value);
    setIsPaused(true); // Pause immediately when typing

    // Clear previous timer
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    // Set new 2-second timer to resume progress
    typingTimeout.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  }}
  onFocus={() => setIsPaused(true)} // pause when user clicks in
  onBlur={() => {
    setIsPaused(false); // resume when input loses focus
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  }}
  placeholder="Write a reply..."
    className={`flex-1 rounded-full px-3 py-2 
    ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}
    bg-zinc-800 text-white placeholder:text-zinc-400 focus:outline-none`}
  onKeyDown={(e) => { 
    if (e.key === 'Enter') {
      submitReply();
      setIsPaused(false); // resume immediately after sending
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    }
  }}
/>

<button
  onClick={submitReply}
  disabled={isSubmitting}
  className={`btn flex items-center gap-2 
    ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
>
  {isSubmitting ? (
    <>
      <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
      Sending…
    </>
  ) : (
    "Send"
  )}
</button>

</div> }



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