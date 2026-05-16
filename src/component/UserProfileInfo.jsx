import {
  CalendarHeart,
  MapPin,
  PenBox,
  Verified,
  Briefcase,
  Heart,
  Church,
  Globe,
  User,
  UserPlus,
  Eye,
  UserCheck,
  UserMinus,
  Link as LinkIcon,
  MessageSquare,
  Clock,
} from "lucide-react";
import moment from "moment";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosBase from "../utils/axiosBase";
import { useAuth } from "../context/AuthContext";
import ProfileAvatar from "../component/shared/ProfileAvatar"
import ProfileViewersDropdown from "./ProfileViewersDropdown";
import "./userProfile.css";
import assets from "../assets/assets";

const BASE = import.meta.env.VITE_SERVER;

const UserProfileInfo = ({ user, posts, profileId, setShowEdit, isUnauthenticatedVisitor }) => {
  const { user: currentUser, token } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("none"); 
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [canChat, setCanChat] = useState(false); 
  const [connectionsLoading, setConnectionsLoading] = useState(false); 
  const navigate = useNavigate();
  const isOwnProfile = currentUser?._id === user?._id;

  const checkConnectionStatus = async () => {
    if (!currentUser?._id || !user?._id) return;
    try {
      const res = await axiosBase.get(
        `${BASE}api/user/connections?userId=${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { connections = [], pendingConnections = [] } = res.data.data || {};
      const isConnected = connections.some((conn) => String(conn._id) === String(currentUser._id));
      if (isConnected) { setConnectionStatus("connected"); return; }
      const isPending = pendingConnections.some((conn) => String(conn._id) === String(currentUser._id));
      if (isPending) { setConnectionStatus("pending"); return; }
      setConnectionStatus("none");
    } catch (err) {
      console.error("Error checking connection:", err);
      setConnectionStatus("none");
    }
  };

  const fetchConnections = async () => {
    if (!user?._id) return;
    setConnectionsLoading(true);
    try {
      const res = await axiosBase.get(`/api/user/connections?userId=${user._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      const raw = res.data?.data?.connections || [];
      const cleaned = raw.map((conn) => ({
        _id: conn._id || conn.id,
        name: conn.name || "Unknown",
        username: conn.username || "",
        occupation: conn.occupation || "",
        profilePicUrl: conn.profilePicUrl || "",
        profilePicBackground: conn.profilePicBackground || "#999",
      }));
      setConnections(cleaned);
    } catch (err) {
      console.error("❌ Error fetching user connections:", err);
    } finally {
      setConnectionsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !currentUser) return;
    setIsFollowing(user.followers?.includes(currentUser._id));
    checkConnectionStatus();
    fetchConnections();
  }, [user?._id, currentUser]);




// Determine if chat is allowed
useEffect(() => {
  if (!currentUser?._id || !user?._id) return;

  const isConnected = connectionStatus === "connected";

  // Either user is following the other
  const isFollowingProfile = user.followers?.some(f => String(f) === String(currentUser._id));
  const isProfileFollowingMe = user.following?.some(f => String(f) === String(currentUser._id));

  setCanChat(isConnected || isFollowingProfile || isProfileFollowingMe);
}, [connectionStatus, user, currentUser]);

  const handleFollow = async () => {
    if (!user || !currentUser) return;
    setIsLoading(true);
    try {
      const endpoint = isFollowing ? "unfollowUser" : "followUser";
      await axiosBase.get(
        `${BASE}api/user/${endpoint}?userId=${currentUser._id}&id=${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Follow/Unfollow Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnection = async () => {
    if (!user || !currentUser) return;
    setIsLoading(true);
    try {
      if (connectionStatus === "none") {
        setConnectionStatus("loading");
        await axiosBase.get(
          `${BASE}api/user/connect?userId=${currentUser._id}&id=${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setConnectionStatus("pending");
      }
    } catch (err) {
      console.error("Connection error:", err);
      setConnectionStatus("none");
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionButton = () => {
    if (connectionStatus === "loading") {
      return (
        <button disabled className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-slate-100 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20">
           <div className="animate-spin h-4 w-4 border-2 border-slate-500 border-t-transparent rounded-full"></div>
           Connecting...
        </button>
      );
    }
    switch (connectionStatus) {
      case "connected":
        return (
          <button disabled className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-slate-100 text-slate-700 shadow-sm">
            <LinkIcon className="w-4 h-4" /> Connected
          </button>
        );
      case "pending":
        return (
          <button disabled className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-amber-100 text-amber-700 shadow-sm">
            <Clock className="w-4 h-4" /> Request Sent
          </button>
        );
      default:
        return (
          <button onClick={handleConnection} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-[var(--accent)] text-white shadow-sm transition duration-200 hover:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20">
            <UserCheck className="w-4 h-4" /> Connect
          </button>
        );
    }
  };

  if (!user) return null;

  return (
    <div className="profile-info-card bg-white/95 border border-slate-200/70 shadow-[0_28px_90px_-44px_rgba(15,23,42,0.24)] rounded-[28px] p-6 sm:p-7 md:p-8 space-y-7 overflow-visible font-[Inter]">
      <div className="relative flex flex-col items-center md:items-start">
        <div className="avatar-overlap-container">
          <ProfileAvatar
            user={{
              name: user?.name || "User",
              profilePicUrl: user?.profilePicUrl,
              profilePicBackground: user?.profilePicBackground,
            }}
            size="100%"
          />
        </div>

        <div className="w-full mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center md:text-left max-w-3xl">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
                {assets.capitalizeFullName(user.name) || "Unnamed User"}
              </h1>
              {user.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-200/80">
                  <Verified className="w-4 h-4" /> Verified
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-500">@{user.username || "username"}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {!isOwnProfile && !isUnauthenticatedVisitor ? (
              <>
                <button
                  onClick={handleFollow}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 ${isFollowing ? "bg-slate-100 text-slate-900 hover:bg-slate-200" : "bg-[var(--accent)] text-white hover:bg-slate-950"}`}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
                {getConnectionButton()}
              </>
            ) : (
              !isUnauthenticatedVisitor && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition duration-200 hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                >
                  <PenBox className="w-4 h-4" /> Edit Profile
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {user.bio && (
        <p className="max-w-3xl text-base leading-7 tracking-normal text-slate-600 text-center md:text-left whitespace-pre-wrap">
          {user.bio}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 items-start border-t border-slate-200/70 pt-5 text-sm text-slate-600">
        {user.occupation && (
          <span className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-2 shadow-sm">
            <Briefcase className="w-4 h-4 text-slate-400" /> {user.occupation}
          </span>
        )}
        {user.location && (
          <span className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-2 shadow-sm">
            <MapPin className="w-4 h-4 text-slate-400" /> {user.location}
          </span>
        )}
        {user.country && (
          <span className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-2 shadow-sm">
            <Globe className="w-4 h-4 text-slate-400" /> {user.country}
          </span>
        )}
        {user.createdAt && (
          <span className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-2 shadow-sm">
            <CalendarHeart className="w-4 h-4 text-slate-400" /> Joined {moment(user.createdAt).format("MMM YYYY")}
          </span>
        )}
      </div>

      <div className="rounded-[22px] border border-slate-200/70 bg-slate-50 px-4 py-5 shadow-sm">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-[18px] bg-white px-4 py-5 shadow-sm transition duration-200 hover:-translate-y-0.5">
            <span className="block text-3xl font-semibold text-slate-950 tracking-tight">
              {posts?.length || 0}
            </span>
            <span className="mt-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Posts</span>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-5 shadow-sm transition duration-200 hover:-translate-y-0.5">
            <span className="block text-3xl font-semibold text-slate-950 tracking-tight">
              {user.followers?.length || 0}
            </span>
            <span className="mt-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Followers</span>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-5 shadow-sm transition duration-200 hover:-translate-y-0.5">
            <span className="block text-3xl font-semibold text-slate-950 tracking-tight">
              {user.following?.length || 0}
            </span>
            <span className="mt-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Following</span>
          </div>
        </div>
      </div>

      {canChat && !isOwnProfile && !isUnauthenticatedVisitor && (
        <div className="w-full flex justify-center">
          <button
            onClick={() => navigate(`/chatbox/${user._id}`)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
        </div>
      )}

      {!isUnauthenticatedVisitor && (
        <div className="rounded-[24px] border border-slate-200/70 bg-slate-50 p-4 shadow-sm">
          <ProfileViewersDropdown viewers={user.profileViewers || []} totalViews={user.profileViews || 0} />
        </div>
      )}

<div className="pt-4">
  <div className="flex items-center justify-center md:justify-start mb-4">
    <h3 className="text-lg font-semibold text-slate-950">
      Connections
    </h3>
  </div>

<div className="flex justify-center items-center md:justify-start">
          {connectionsLoading ? (
            <div className="connections-stack">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="stack-img skeleton-circle" />
              ))}
            </div>
          ) : connections.length > 0 ? (
            <div className="connections-stack">
              {connections.slice(0, 8).map((conn, i) => (
                <div
                  key={conn._id}
                  className="stack-item"
                  style={{ zIndex: 10 - i }}
                  onClick={() => navigate(`/profile/${conn._id}`)}
                >
                  {conn.profilePicUrl ? (
                    <img src={conn.profilePicUrl} className="stack-img" alt={conn.name} />
                  ) : (
                    <div className="stack-img fallback" style={{ backgroundColor: conn.profilePicBackground }}>
                      {conn.name[0]}
                    </div>
                  )}
                  <div className="stack-tooltip">
                    <p className="tooltip-name">{conn.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic">No connections yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;