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

const UserProfileInfo = ({ user, posts, profileId, setShowEdit }) => {
  const { user: currentUser, token } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("none"); 
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState([]); 
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
        <button disabled className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700">
           <div className="animate-spin h-4 w-4 border-2 border-blue-700 border-t-transparent rounded-full"></div>
           Connecting...
        </button>
      );
    }
    switch (connectionStatus) {
      case "connected":
        return <button disabled className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700"><LinkIcon className="w-4 h-4" /> Connected</button>;
      case "pending":
        return <button disabled className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-yellow-100 text-yellow-700"><Clock className="w-4 h-4" /> Request Sent</button>;
      default:
        return <button onClick={handleConnection} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"><UserCheck className="w-4 h-4" /> Connect</button>;
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 space-y-8 font-[Inter] overflow-visible">
      
      {/* 🔝 HEADER SECTION: Overlapping Avatar & Info */}
      <div className="relative flex flex-col items-center md:items-start">
        {/* Profile Picture Overlay Wrapper */}
        <div className="avatar-overlap-container">
          <ProfileAvatar
            user={{
              name: user?.name || "User",
              profilePicUrl: user?.profilePicUrl,
              profilePicBackground: user?.profilePicBackground,
            }}
            size={120}
          />
        </div>

        {/* Name and Actions */}
        <div className="w-full mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {assets.capitalizeFullName(user.name) || "Unnamed User"}
              </h1>
              {user.isVerified && <Verified className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="text-gray-500 text-sm">@{user.username || "username"}</p>
          </div>

          <div className="flex gap-3 justify-center">
            {!isOwnProfile ? (
              <>
                <button onClick={handleFollow} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${isFollowing ? "bg-gray-200" : "bg-[var(--accent)] text-white"}`}>
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
                {getConnectionButton()}
              </>
            ) : (
              <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <PenBox className="w-4 h-4" /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 📝 BIO */}
      {user.bio && (
        <p className="text-gray-700 text-base max-w-2xl leading-relaxed text-center md:text-left">
          {user.bio}
        </p>
      )}

      {/* 🌍 DETAILS (Location, Occupation, etc.) */}
      <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-3 text-sm text-gray-600 border-t border-gray-50 pt-4">
        {user.occupation && <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> {user.occupation}</span>}
        {user.location && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> {user.location}</span>}
        {user.country && <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> {user.country}</span>}
        {user.createdAt && <span className="flex items-center gap-2"><CalendarHeart className="w-4 h-4 text-blue-500" /> Joined {moment(user.createdAt).format("MMM YYYY")}</span>}
      </div>

      {/* 📊 STATS (Posts, Followers, Following) */}
<div className="grid grid-cols-3 gap-2 sm:gap-4 border-y border-gray-100 py-6">
  {/* Posts Column */}
  <div className="text-center border-r border-gray-100 px-1">
    <span className="block text-lg sm:text-2xl font-bold text-gray-900">
      {posts?.length || 0}
    </span>
    <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-medium">
      Posts
    </span>
  </div>

  {/* Followers Column */}
  <div className="text-center border-r border-gray-100 px-1 cursor-pointer hover:bg-gray-50 transition-colors rounded-md">
    <span className="block text-lg sm:text-2xl font-bold text-gray-900">
      {user.followers?.length || 0}
    </span>
    <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-medium">
      Followers
    </span>
  </div>

  {/* Following Column */}
  <div className="text-center px-1 cursor-pointer hover:bg-gray-50 transition-colors rounded-md">
    <span className="block text-lg sm:text-2xl font-bold text-gray-900">
      {user.following?.length || 0}
    </span>
    <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-medium">
      Following
    </span>
  </div>
</div>

      {/* 👁️ PROFILE VIEWS */}
      <div className="bg-gray-50 rounded-xl p-4 flex justify-center">
        <ProfileViewersDropdown viewers={user.profileViewers || []} totalViews={user.profileViews || 0} />
      </div>

      {/* 🤝 CONNECTIONS */}
      <div className="pt-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 text-center md:text-left">Connections</h3>
        <div className="flex justify-center md:justify-start">
          {connectionsLoading ? (
            <div className="connections-stack">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="stack-img skeleton-circle" />)}
            </div>
          ) : connections.length > 0 ? (
            <div className="connections-stack">
              {connections.slice(0, 8).map((conn, i) => (
                <div key={conn._id} className="stack-item" style={{ zIndex: 10 - i }} onClick={() => navigate(`/profile/${conn._id}`)}>
                  {conn.profilePicUrl ? <img src={conn.profilePicUrl} className="stack-img" alt="" /> : <div className="stack-img fallback" style={{backgroundColor: conn.profilePicBackground}}>{conn.name[0]}</div>}
                  <div className="stack-tooltip"><p className="tooltip-name">{conn.name}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No connections yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;