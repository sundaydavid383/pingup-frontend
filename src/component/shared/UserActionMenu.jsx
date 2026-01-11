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
          className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fadeIn overflow-hidden"
        >
          {/* Follow / Unfollow (only for non-owner) */}
          {!isOwnPost && (
            <button
              onClick={() => handleAction("follow")}
              disabled={loadingAction === "follow"}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition disabled:opacity-50"
            >
              {loadingAction === "follow" ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
              ) : isFollowing ? (
                <UserMinus className="w-4 h-4 text-[var(--primary)]" />
              ) : (
                <UserPlus className="w-4 h-4 text-[var(--primary)]" />
              )}
              <span>{isFollowing ? "Unfollow" : "Follow"}</span>
            </button>
          )}

          {/* Block / Unblock (only for non-owner) */}
          {!isOwnPost && (
            <button
              onClick={() => handleAction("block")}
              disabled={loadingAction === "block"}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition disabled:opacity-50"
            >
              {loadingAction === "block" ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              ) : isBlocked ? (
                <ShieldX className="w-4 h-4 text-red-500" />
              ) : (
                <Ban className="w-4 h-4 text-red-500" />
              )}
              <span>{isBlocked ? "Unblock" : "Block"}</span>
            </button>
          )}

          {/* Delete Post (only for owner) */}
          {isOwnPost && handleDeletePost && (
            <button
              onClick={() => handleAction("delete")}
              disabled={loadingAction === "delete"}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              <Slash className="w-4 h-4" />
              <span>Delete Post</span>
            </button>
          )}

          {/* Cancel */}
          <button
            onClick={() => setShowActionBar(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 border-t"
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
