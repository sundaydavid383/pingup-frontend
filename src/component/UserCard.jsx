import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MapPin, MessageCircle, Plus, UserPlus, MessageSquare, Check, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CustomAlert from "./shared/CustomAlert";
import ProfileAvatar from "../component/shared/ProfileAvatar"


const BASE = import.meta.env.VITE_SERVER || "";

export default function UserCard({ user: rawUser, onUserUpdate }) {
  const { user: ctxUser, token: ctxToken } = useAuth();
  const navigate = useNavigate();
  // fallback to localStorage keys used by your app
  const storedUser = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem("springsConnectUser")) ||
        {}
      );
    } catch {
      return {};
    }
  })();

  // merged active user: prefer context user, else localStorage
  const activeUser = ctxUser && ctxUser._id ? ctxUser : storedUser;
  const activeToken = ctxToken || localStorage.getItem("token") || null;

  const authHeaders = () =>
    activeToken ? { Authorization: `Bearer ${activeToken}` } : {};

  // normalize incoming user shape
  const user = {
    _id: rawUser._id || (rawUser.id && String(rawUser.id)),
    name: rawUser.name || rawUser.full_name || rawUser.displayName || "",
    username: rawUser.username || rawUser.handle || "",
    profilePic:
      rawUser.profilePicUrl || rawUser.profile_image || rawUser.profileImage || "",
    bio: rawUser.bio || rawUser.description || "",
    location: rawUser.currentCity || rawUser.location || rawUser.city || "",
    followersCount: Array.isArray(rawUser.followers)
      ? rawUser.followers.length
      : rawUser.followersCount ?? 0,
    mutualConnections: rawUser.mutualConnections || rawUser.mutuals || 0,
    __raw: rawUser,
  };

  // Add this near your other useState declarations
  const [connectionStatus, setConnectionStatus] = useState("none"); // "none", "pending_out", "pending_in", "connected"
  const [isProcessing, setIsProcessing] = useState(false);

useEffect(() => {
  if (!activeUser || !user) return;

  const userIdStr = String(user._id);

  // Already connected
  if ((activeUser.connections || []).map(String).includes(userIdStr)) {
    setConnectionStatus("connected");
  } 
  // Outgoing request sent by activeUser
  else if ((activeUser.pendingConnections || []).some(c => String(c._id) === userIdStr && c.direction === "outgoing")) {
    setConnectionStatus("pending_out");
  } 
  // Incoming request sent by other user to activeUser
  else if ((activeUser.incomingRequests || []).map(String).includes(userIdStr)) {
    setConnectionStatus("pending_in");
  } 
  // No connection
  else {
    setConnectionStatus("none");
  }
}, [activeUser, rawUser]);




  // UI / state
  const [isFollowing, setIsFollowing] = useState(
    Array.isArray(activeUser.following)
      ? activeUser.following.map(String).includes(String(user._id))
      : false
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [followersCount, setFollowersCount] = useState(user.followersCount);
  const [disabledFollow, setDisabledFollow] = useState(false);

  // CustomAlert state
  const [alert, setAlert] = useState({ open: false, message: "", type: "info" });
  const showAlert = (message, type = "info") => {
    setAlert({ open: true, message, type });
  };

  // Follow / Unfollow
  const handleFollow = async () => {
    if (!activeUser || !activeUser._id) {
      showAlert("Please login to follow users.", "error");
      return;
    }

    const prev = isFollowing;
    const action = isFollowing ? "unfollowUser" : "followUser";

    // Optimistic UI update
    setIsFollowing(!prev);
    setFollowersCount((c) => (prev ? Math.max(0, c - 1) : c + 1));
    setDisabledFollow(true);

    try {
      const res = await axios.get(
        `${BASE}api/user/${action}?userId=${activeUser._id}&id=${user._id}`,
        { headers: authHeaders() }
      );

      if (!res.data.success) {
        // rollback UI
        setIsFollowing(prev);
        setFollowersCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      }

      showAlert(res.data.message || (prev ? "Unfollowed" : "Followed"), res.data.success ? "success" : "error");

      // update parent if needed
      if (onUserUpdate) {
        const updatedUser = {
          ...rawUser,
          followers: prev
            ? (rawUser.followers || []).filter((f) => String(f) !== String(activeUser._id))
            : [...(rawUser.followers || []), activeUser._id],
        };
        onUserUpdate(updatedUser);
      }
    } catch (err) {
      // rollback on error
      setIsFollowing(prev);
      setFollowersCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      console.error("Follow/unfollow failed:", err);
      showAlert("Could not update follow. Try again.", "error");
    } finally {
      setDisabledFollow(false);
    }
  };

  // Send connection request
  const handleConnectionRequest = async () => {
    if (!activeUser || !activeUser._id) {
      showAlert("Please login to send connection requests.", "error");
      return;
    }

    setIsConnecting(true);

    try {
      const res = await axios.get(
        `${BASE}api/user/connect?userId=${activeUser._id}&id=${user._id}`,
        { headers: authHeaders() }
      );

      showAlert(res.data.message || "Connection request sent.", res.data.success ? "success" : "error");
    } catch (err) {
      console.error("Connection request failed:", err);
      showAlert("Could not send connection request. Try again.", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccept = async () => {
    if (!activeUser || !activeUser._id) return;
    setIsProcessing(true);

    try {
      const res = await axios.get(
        `${BASE}api/user/accept?userId=${activeUser._id}&id=${user._id}`,
        { headers: authHeaders() }
      );

      if (res.data.success) {
        setConnectionStatus("connected");
        showAlert("Connection accepted!", "success");
      } else {
        showAlert(res.data.message || "Could not accept connection.", "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error accepting connection.", "error");
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <>
      {alert.open && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ open: false, message: "", type: "info" })}
        />
      )}

<div className="p-5 w-full shadow-md border border-gray-200 rounded-xl bg-white hover:shadow-xl hover:-translate-y-1 transition-transform duration-200">

  {/* 3 Columns Layout */}
  {/* NOTE: items-end aligns each grid cell to the bottom of the row */}
  <div className="flex flex-row gap-6 items-end w-full min-h-[140px] flex-nowrap">
    {/* COLUMN 1 — Avatar + Name */}
    {/* justify-end pushes content to the bottom of this column */}
    <div className="flex flex-col items-center md:items-start justify-end">
      <div
        className="w-24 h-24 object-cover rounded-full shadow ring-2 ring-blue-50 cursor-pointer"
        onClick={() => navigate(`/profile/${user?._id}`)}
      >
        <ProfileAvatar
          user={{
            name: user?.name || "User",
            profilePicUrl: user.profilePic,
            profilePicBackground: rawUser?.profilePicBackground,
          }}
          size={98}
        />
      </div>

{/* Name */}
<p className="mt-3 font-semibold text-gray-800 max-w-[150px] truncate text-center text-sm">
  {user.name || user.username}
</p>

{user.username && (
  <p className="text-xs text-gray-500 max-w-[100px] truncate text-center">
    @{user.username}
  </p>
)}

    </div>

    {/* COLUMN 2 — Meta Info */}
  <div className="flex flex-col items-center justify-end gap-3">
  <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1 bg-gray-50 text-[10px]">
  {followersCount} Followers
</div>

{user.location && (
  <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1 bg-gray-50 text-[10px]">
    <MapPin className="w-4 h-4" /> {user.location}
  </div>
)}
    </div>

    {/* COLUMN 3 — Actions */}
  <div className="flex flex-col items-center md:items-end justify-end gap-3">

      {/* Follow Button */}
      <button
        onClick={handleFollow}
        disabled={disabledFollow}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-xs transition
          ${isFollowing
            ? "bg-gray-100 text-gray-600 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
      >
        {disabledFollow ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          </svg>
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {isFollowing ? "Following" : "Follow"}
      </button>

      {/* Connection Buttons */}
      {connectionStatus === "connected" && (
        <button
          onClick={() => navigate(`/chatbox/${user._id}`)}
          className="px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
        >
          <MessageSquare size={18} /> Message
        </button>
      )}

      {connectionStatus === "pending_in" && (
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <Check size={18} />
          {isProcessing ? "..." : "Accept"}
        </button>
      )}

      {connectionStatus === "pending_out" && (
        <button className="px-4 py-2 rounded-full bg-gray-300 text-gray-600 flex items-center gap-2">
          <Clock size={18} /> 
        </button>
      )}
{connectionStatus === "none" && (
  <button
    onClick={handleConnectionRequest}
    disabled={isConnecting}
    className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
  >
    {isConnecting ? (
      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
      </svg>
    ) : (
      <>
        <Plus className="w-5 h-5" />
        
      </>
    )}
  </button>
)}

    </div>

  </div>
</div>


    </>
  );
}
