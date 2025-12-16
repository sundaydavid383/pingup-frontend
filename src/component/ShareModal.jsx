import React, { useEffect, useState, useMemo } from "react";
import { X, Link as LinkIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axiosBase from "../utils/axiosBase";
import { useNavigate } from "react-router-dom";
import CustomAlert from "./shared/CustomAlert";
import "../styles/sharemodal.css"; // import CSS
import ProfileAvatar from "./shared/ProfileAvatar";

export default function ShareModal({post, 
  onClose, onShareSuccess }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState(null); // { message, type }

  // Fetch friends
  useEffect(() => {
    if (!currentUser?._id) return;
    let canceled = false;

    const fetchFriends = async () => {
      setLoadingFriends(true);
      setFriends([]);
      try {
        const res = await axiosBase.get(
          `/api/user/connections?userId=${currentUser._id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
        );

        const raw = res.data?.data?.connections || [];
        const cleaned = raw.map((conn) => ({
          _id: conn._id || conn.id,
          full_name: conn.name || conn.full_name || conn.username || "Unknown",
          username: conn.username || "",
          profilePicUrl: conn.profilePicUrl || conn.profilePic || "",
          profilePicBackground: conn.profilePicBackground || conn.profilePicBg || "#999",
        }));

        if (!canceled) setFriends(cleaned);
      } catch (err) {
        console.error("❌ Error fetching friends:", err);
        if (!canceled) setFriends([]);
      } finally {
        if (!canceled) setLoadingFriends(false);
      }
    };

    fetchFriends();
    return () => (canceled = true);
  }, [currentUser]);

  const filtered = useMemo(() => {
    if (!search) return friends;
    const q = search.toLowerCase();
    return friends.filter(
      (f) =>
        (f.full_name || "").toLowerCase().includes(q) ||
        (f.username || "").toLowerCase().includes(q)
    );
  }, [friends, search]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(link);
      setAlert({ message: "🔗 Link copied!", type: "success" });
    } catch {
      setAlert({ message: "Failed to copy link", type: "error" });
    }
  };

 
  const handleSend = async () => {
    if (!currentUser) return navigate("/signin");
    if (selected.size === 0) {
      setAlert({ message: "Select at least one friend to share with", type: "warning" });
      return;
    }

    setSending(true);
    try {
      const to = Array.from(selected);
      const res = await axiosBase.post(
        `/api/posts/${post._id}/share`,
        { to },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
      );
      setAlert({ message: "✅ Shared successfully", type: "success" });
      setSelected(new Set());
      const updatedCount = res.data.updatedSharesCount;
      onShareSuccess(updatedCount); // 🔥 update feed
      onClose();
    } catch (err) {
      console.error("❌ Share failed:", err);
      setAlert({ message: err.response.data.message || "Failed to share post", type: "error" });
    } finally {
      setSending(false);
    }
  };




  return (
    <div className="fixed inset-0 z-5550 flex items-center justify-center">
      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-lg w-[min(540px,95%)] p-4 z-60">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Share post</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Copy Link */}
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
            title="Copy post link"
          >
            <LinkIcon className="w-4 h-4" /> Copy link
          </button>
        </div>

        {/* Friends List */}
        <div className="max-h-80 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {loadingFriends ? (
              <>
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="animate-pulse flex flex-col items-center gap-2"
      >
        {/* Avatar skeleton */}
        <div className="w-12 h-12 rounded-full bg-[var(--bg-light)]"></div>

        {/* Username skeleton */}
        <div className="w-16 h-3 rounded-md bg-[var(--bg-light)]"></div>
      </div>
    ))}
  </>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-500">
              No friends found
            </div>
          ) : (
filtered.map((friend) => {
  const isSelected = selected.has(friend._id);
  const alreadyShared = post?.shares?.includes(friend._id);

  return (
    <div
      key={friend._id}
      className={`
        friend-card
        ${isSelected ? "selected" : ""}
        ${alreadyShared ? "opacity-50 cursor-not-allowed" : ""}
        
      `}
      onClick={(e) => {
        e.stopPropagation();
        if (!alreadyShared) toggleSelect(friend._id);
        console.log("Clicked friend:", friend._id, "Already shared:", alreadyShared, "Is selected:", isSelected);
      }}
    >
      {/* Avatar */}
      <div className="friend-avatar">
        <ProfileAvatar
          user={{
            name: friend.name,
            profilePicUrl: friend.profilePicUrl,
            profilePicBackground: friend.profilePicBackground,
          }}
          size={40}
        />
      </div>

      {/* Username */}
      <div className="friend-info">
        <div className="friend-name">@{friend.username || "unknown"}</div>
      </div>

      {/* Already shared badge */}
      {alreadyShared && (
        <div className="text-xs text-red-500 mt-1 font-medium">
          Already shared
        </div>
      )}

      {/* Selected badge */}
      {isSelected && !alreadyShared && (
        <div className="text-xs text-blue-600 mt-1 font-medium">
          Selected
        </div>
      )}
    </div>
  );
})


          )}
        </div>

        {/* Send Button */}
        <div className="mt-3 text-right">
          <button
            onClick={handleSend}
            disabled={sending || selected.size === 0}
            className={`px-4 py-1.5 rounded-md text-sm text-white btn ${
              sending || selected.size === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[var(--accent)] hover:bg-[var(--accent-dark)]"
            }`}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
