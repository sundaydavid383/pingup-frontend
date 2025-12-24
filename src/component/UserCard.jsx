import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MapPin, UserPlus, MessageSquare, Check, Clock, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CustomAlert from "./shared/CustomAlert";
import ProfileAvatar from "../component/shared/ProfileAvatar";

const BASE = import.meta.env.VITE_SERVER || "";

export default function UserCard({ user: rawUser, onUserUpdate }) {
  const { user: ctxUser, token: ctxToken } = useAuth();
  const navigate = useNavigate();

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("springsConnectUser")) || {};
    } catch {
      return {};
    }
  })();

  const activeUser = ctxUser && ctxUser._id ? ctxUser : storedUser;
  const activeToken = ctxToken || localStorage.getItem("token") || null;

  const authHeaders = () =>
    activeToken ? { Authorization: `Bearer ${activeToken}` } : {};

  const user = {
    _id: rawUser._id || (rawUser.id && String(rawUser.id)),
    name: rawUser.name || rawUser.full_name || rawUser.displayName || "",
    username: rawUser.username || rawUser.handle || "",
    profilePic: rawUser.profilePicUrl || rawUser.profile_image || rawUser.profileImage || "",
    bio: rawUser.bio || rawUser.description || "",
    location: rawUser.currentCity || rawUser.location || rawUser.city || "",
    followersCount: Array.isArray(rawUser.followers)
      ? rawUser.followers.length
      : rawUser.followersCount ?? 0,
    __raw: rawUser,
  };

  const [connectionStatus, setConnectionStatus] = useState("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    Array.isArray(activeUser.following)
      ? activeUser.following.map(String).includes(String(user._id))
      : false
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [followersCount, setFollowersCount] = useState(user.followersCount);
  const [disabledFollow, setDisabledFollow] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: "", type: "info" });

  useEffect(() => {
    if (!activeUser || !user._id) return;
    const userIdStr = String(user._id);

    if ((activeUser.connections || []).map(String).includes(userIdStr)) {
      setConnectionStatus("connected");
    } else if ((activeUser.pendingConnections || []).some(c => String(c._id) === userIdStr && c.direction === "outgoing")) {
      setConnectionStatus("pending_out");
    } else if ((activeUser.incomingRequests || []).map(String).includes(userIdStr)) {
      setConnectionStatus("pending_in");
    } else {
      setConnectionStatus("none");
    }
  }, [activeUser, rawUser]);

  const showAlert = (message, type = "info") => {
    setAlert({ open: true, message, type });
  };

  const handleFollow = async () => {
    if (!activeUser?._id) {
      showAlert("Please login to follow users.", "error");
      return;
    }
    const prev = isFollowing;
    const action = isFollowing ? "unfollowUser" : "followUser";
    setIsFollowing(!prev);
    setFollowersCount((c) => (prev ? Math.max(0, c - 1) : c + 1));
    setDisabledFollow(true);

    try {
      const res = await axios.get(`${BASE}api/user/${action}?userId=${activeUser._id}&id=${user._id}`, { headers: authHeaders() });
      if (!res.data.success) {
        setIsFollowing(prev);
        setFollowersCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      }
      showAlert(res.data.message || (prev ? "Unfollowed" : "Followed"), res.data.success ? "success" : "error");
    } catch (err) {
      setIsFollowing(prev);
      setFollowersCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      showAlert("Could not update follow. Try again.", "error");
    } finally {
      setDisabledFollow(false);
    }
  };

  const handleConnectionRequest = async () => {
    if (!activeUser?._id) {
      showAlert("Please login to send connection requests.", "error");
      return;
    }
    setIsConnecting(true);
    try {
      const res = await axios.get(`${BASE}api/user/connect?userId=${activeUser._id}&id=${user._id}`, { headers: authHeaders() });
      showAlert(res.data.message || "Request sent.", res.data.success ? "success" : "error");
    } catch (err) {
      showAlert("Could not send request. Try again.", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccept = async () => {
    if (!activeUser?._id) return;
    setIsProcessing(true);
    try {
      const res = await axios.get(`${BASE}api/user/accept?userId=${activeUser._id}&id=${user._id}`, { headers: authHeaders() });
      if (res.data.success) {
        setConnectionStatus("connected");
        showAlert("Connection accepted!", "success");
      }
    } catch (err) {
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

      <div className="p-5 w-full shadow-md border border-gray-200 rounded-xl bg-white hover:shadow-xl transition-all duration-200 flex flex-col justify-between min-h-[240px] md:min-h-[260px]">
        {/* TOP SECTION: PROFILE INFO */}
        <div className="flex flex-col md:flex-row gap-4 items-start w-full">
          {/* Avatar */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div 
              className="w-20 h-20 rounded-full shadow ring-2 ring-blue-50 cursor-pointer overflow-hidden"
              onClick={() => navigate(`/profile/${user?._id}`)}
            >
              <ProfileAvatar
                user={{
                  name: user?.name || "User",
                  profilePicUrl: user.profilePic,
                  profilePicBackground: rawUser?.profilePicBackground,
                }}
                size={80}
              />
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 flex flex-col text-center md:text-left">
            <p className="font-bold text-gray-800 truncate text-base">
              {user.name || user.username}
            </p>
            {user.username && <p className="text-xs text-gray-500">@{user.username}</p>}

            {/* Followers & Location Pills */}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mt-2">
              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-tight">
                {followersCount} Followers
              </span>
              {user.location && (
                <div className="flex items-center gap-1 bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-md text-[10px] min-w-0 max-w-full">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{user.location}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-sm text-gray-600 mt-3 line-clamp-3 md:line-clamp-2 italic leading-relaxed">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: ACTIONS */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <button
            onClick={handleFollow}
            disabled={disabledFollow}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-xs transition-all
              ${isFollowing ? "bg-gray-100 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {disabledFollow ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>{isFollowing ? "Following" : "Follow"}</span>
          </button>

          {connectionStatus === "connected" && (
            <button
              onClick={() => navigate(`/chatbox/${user._id}`)}
              className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2 text-xs"
            >
              <MessageSquare size={16} /> <span>Message</span>
            </button>
          )}

          {connectionStatus === "pending_in" && (
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 text-xs"
            >
              <Check size={16} /> <span>{isProcessing ? "..." : "Accept"}</span>
            </button>
          )}

          {connectionStatus === "pending_out" && (
            <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          )}

          {connectionStatus === "none" && (
            <button
              onClick={handleConnectionRequest}
              disabled={isConnecting}
              className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center"
            >
              {isConnecting ? (
                <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <Plus size={18} />
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}