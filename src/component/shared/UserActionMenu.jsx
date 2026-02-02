import { useState, useEffect, useRef } from "react";
import {
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Slash,
  ShieldX,
  X,
  Loader2,
  Ban,
} from "lucide-react";

const UserActionMenu = ({
  isOwnPost,
  isFollowing,
  isBlocked,
  handleFollow,
  handleBlock,
  handleDeletePost, // ➕ add delete prop
}) => {
  const [showActionBar, setShowActionBar] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // "follow" or "block" or "delete"
  const menuRef = useRef(null);

  // ✅ Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowActionBar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = async (type) => {
    try {
      setLoadingAction(type);
      if (type === "follow") await handleFollow();
      else if (type === "block") await handleBlock();
      else if (type === "delete" && handleDeletePost) await handleDeletePost();
    } finally {
      setLoadingAction(null);
      setShowActionBar(false);
    }
  };

  return (
    <div ref={menuRef} className="relative mt-1">
      {/* ⋯ Menu Button */}
      <button
        onClick={() => setShowActionBar((prev) => !prev)}
        className="p-1.5 rounded-full hover:bg-gray-100 transition"
      >
        <MoreHorizontal className="w-5 h-5 text-[var(--primary)]" />
      </button>

      {/* Dropdown Action Menu */}
      {showActionBar && (
  <div
    className="
      absolute right-0 mt-3 w-48 z-50 overflow-hidden
      rounded-2xl px-2 py-1
      bg-white/90 backdrop-blur-xl
      border border-gray-200/60
      shadow-[0_10px_30px_rgba(0,0,0,0.12)]
      animate-scaleFade
    "
  >
    {/* Follow / Unfollow */}
    {!isOwnPost && (
      <button
        onClick={() => handleAction("follow")}
        disabled={loadingAction === "follow"}
        className="
          group w-full flex items-center gap-3
          px-4 py-3 text-sm font-medium
          text-gray-800
          transition-all duration-200
          hover:bg-gray-100/70
          active:scale-[0.98]
          disabled:opacity-50 rounded-xl
          
        "
      >
        {loadingAction === "follow" ? (
          <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
        ) : isFollowing ? (
          <UserMinus className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition" />
        ) : (
          <UserPlus className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition" />
        )}
        <span>{isFollowing ? "Unfollow" : "Follow"}</span>
      </button>
    )}

    {/* Block / Unblock */}
    {!isOwnPost && (
      <button
        onClick={() => handleAction("block")}
        disabled={loadingAction === "block"}
        className="
          group w-full flex items-center gap-3
          px-4 py-3 text-sm font-medium
          text-gray-800
          transition-all duration-200
          hover:bg-red-50
          active:scale-[0.98]
          disabled:opacity-50 rounded-xl
        "
      >
        {loadingAction === "block" ? (
          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
        ) : isBlocked ? (
          <ShieldX className="w-4 h-4 text-red-500 group-hover:scale-110 transition" />
        ) : (
          <Ban className="w-4 h-4 text-red-500 group-hover:scale-110 transition" />
        )}
        <span>{isBlocked ? "Unblock" : "Block"}</span>
      </button>
    )}

    {/* Delete Post */}
    {isOwnPost && handleDeletePost && (
      <button
        onClick={() => handleAction("delete")}
        disabled={loadingAction === "delete"}
        className="
          group w-full flex items-center gap-3
          px-4 py-3 text-sm font-semibold
          text-red-600
          hover:bg-red-50
          transition-all
          active:scale-[0.98]
          disabled:opacity-50 rounded-xl
        "
      >
        <Slash className="w-4 h-4 group-hover:scale-110 transition" />
        <span>Delete Post</span>
      </button>
    )}

    {/* Cancel */}
    <button
      onClick={() => setShowActionBar(false)}
      className="
        w-full flex items-center justify-center gap-2
        px-4 py-3 text-sm font-medium
        text-gray-500
        hover:bg-gray-100
        border-t border-gray-200/60
        transition
      "
    >
      <X className="w-4 h-4" />
      <span>Cancel</span>
    </button>
  </div>
)}

    </div>
  );
};

export default UserActionMenu;
