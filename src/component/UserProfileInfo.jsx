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
  const [connectionStatus, setConnectionStatus] = useState("none"); // 'none' | 'pending' | 'connected'
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState([]); // holds all connections
  const [connectionsLoading, setConnectionsLoading] = useState(false); // loader for connections section
  const hasFetched = useRef(false); // ensures we fetch only once
  const navigate = useNavigate()
  const isOwnProfile = currentUser?._id === user?._id;
   const [hoveredId, setHoveredId] = useState(null);


const checkConnectionStatus = async () => {
  if (!currentUser?._id || !user?._id) return;

  try {
    const res = await axiosBase.get(
      `${BASE}api/user/connections?userId=${user._id}`, // fetch profile user's connections
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { connections = [], pendingConnections = [] } = res.data.data || {};

    // ✅ Check accepted connections
    const isConnected = connections.some(
      (conn) => String(conn._id) === String(currentUser._id)
    );

    if (isConnected) {
      setConnectionStatus("connected");
      return;
    }

    // ✅ Check pending connections (incoming or outgoing)
    const isPending = pendingConnections.some(
      (conn) => String(conn._id) === String(currentUser._id)
    );

    if (isPending) {
      setConnectionStatus("pending");
      return;
    }

    // Default: no connection
    setConnectionStatus("none");
  } catch (err) {
    console.error("Error checking connection:", err);
    setConnectionStatus("none");
  }
};



  // ✅ Check follow + connection status on load
  useEffect(() => {
    if (!user || !currentUser) return;
    setIsFollowing(user.followers?.includes(currentUser._id));
    checkConnectionStatus();
  }, [user, currentUser]);

  useEffect(() => {
  if (user?.connections?.length) {
    console.log("🔹 Connection IDs:", user.connections);
  }
}, [user]);

const fetchConnections = async () => {
  if (!user?._id) return;

  setConnections([]); // reset previous connections
  setConnectionsLoading(true);

  try {
    const res = await axiosBase.get(`/api/user/connections?userId=${user._id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
    });

    const raw = res.data?.data?.connections || [];
    const cleaned = raw.map((conn) => ({
      _id: conn._id || conn.id,
      name: conn.name || conn.full_name || conn.username || "Unknown",
      username: conn.username || "",
      occupation: conn.occupation || "",
      profilePicUrl: conn.profilePicUrl || conn.profilePic || "",
      profilePicBackground: conn.profilePicBackground || conn.profilePicBg || "#999",
    }));

    setConnections(cleaned);
  } catch (err) {
    console.error("❌ Error fetching user connections:", err);
    setConnections([]);
  } finally {
    setConnectionsLoading(false);
  }
};






 useEffect(() => {
  fetchConnections();
}, [user?._id]);


  // ✅ Handle follow/unfollow
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

  // ✅ Handle connection logic (Send Request / Cancel / Accept)
const handleConnection = async () => {
  if (!user || !currentUser) return;

  // Start spinner immediately
  setIsLoading(true);

  try {
    if (connectionStatus === "none") {
      // 🔹 Optimistically show connecting
      setConnectionStatus("loading"); // new temporary status

      const res = await axiosBase.get(
        `${BASE}api/user/connect?userId=${currentUser._id}&id=${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(res.data.message);

      // 🔹 Update to final status after request completes
      setConnectionStatus("pending");
    }
  } catch (err) {
    console.error("Connection error:", err);
    setConnectionStatus("none");
  } finally {
    setIsLoading(false);
  }
};


  if (!user) return null;

  // ✅ Button display logic
const getConnectionButton = () => {

  // 🔵 Show loading while request is processing
 if (connectionStatus === "loading") {
  return (
    <button
      disabled
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 shadow-sm"
    >
      <svg
        className="animate-spin h-4 w-4 text-blue-700"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      Connecting...
    </button>
  );
}


  // 🟢 Normal status handling
  switch (connectionStatus) {
    case "connected":
      return (
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 shadow-sm"
        >
          <LinkIcon className="w-4 h-4" /> Connected
        </button>
      );

    case "pending":
      return (
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-yellow-100 text-yellow-700 shadow-sm"
        >
          <Clock className="w-4 h-4" /> Request Sent
        </button>
      );

    default:
      return (
        <button
          onClick={handleConnection}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
        >
          <UserCheck className="w-4 h-4" /> Connect
        </button>
      );
  }
};


  return (
    <div
      className="bg-white rounded-2xl  shadow-lg p-5 sm:p-7 md:p-10 space-y-6 sm:space-y-8 font-[Inter]"
      style={{ lineHeight: "1.7" }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-start gap-8 md:gap-12 text-center md:text-left">
        {/* 👤 Profile Picture */}
        <div className="flex justify-start md:justify-start">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md bg-gray-100 overflow-hidden flex items-center justify-center">
             <ProfileAvatar
              user={{
                name: user?.name || "User",
                profilePicUrl: user?.profilePicUrl,
                profilePicBackground: user?.profilePicBackground,
              }}
              size={103}
            />
          </div>
        </div>

        {/* ℹ️ Info Section */}
        <div className="flex-1 space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">

  {/* Left (Name + Username) */}
  <div>
    <div className="flex items-center justify-center md:justify-start gap-2.5">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-wide">
        {assets.capitalizeFullName(user.name) || "Unnamed User"}
      </h1>
      {user.isVerified && (
        <Verified className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
      )}
    </div>

    <p className="text-gray-500 text-sm sm:text-base mt-1 tracking-wide text-center sm:text-left">
      {user.username ? `@${user.username}` : "Add a username"}
    </p>
  </div>

  {/* Buttons */}
  {!isOwnProfile ? (
    <div className="flex gap-3 w-full justify-center sm:w-auto sm:justify-end">
      {/* Follow button */}
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-all ${
          isFollowing
            ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
            : "bg-[var(--accent)] text-white hover:bg-[var(--secondary)]"
        }`}
      >
        {isFollowing ? (
          <>
            <UserMinus className="w-4 h-4" /> Unfollow
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" /> Follow
          </>
        )}
      </button>

      {/* Connection button */}
      {getConnectionButton()}
    </div>
  ) : (
    <button onClick={() => setShowEdit(true)} className="btn">
      <PenBox className="w-4 h-4 mr-2" />
      Edit Profile
    </button>
  )}
</div>


          {/* 📝 Bio */}
          {user.bio && (
            <p className="text-gray-700 text-sm sm:text-base max-w-md mx-auto md:mx-0 leading-relaxed mt-2">
              {user.bio}
            </p>
          )}

          {/* 🌍 Details */}
     {/* 🌍 Details */}
<div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-3 text-xs sm:text-sm text-gray-700 mt-4 sm:mt-6 max-w-3xl mx-auto">
  {user.gender && (
    <span className="flex items-center gap-2">
      <User className="w-4 h-4 text-[var(--accent)]" /> {user.gender}
    </span>
  )}
  {user.occupation && (
    <span className="flex items-center gap-2">
      <Briefcase className="w-4 h-4 text-[var(--accent)]" /> {user.occupation}
    </span>
  )}
  {user.relationshipStatus && (
    <span className="flex items-center gap-2">
      <Heart className="w-4 h-4 text-[var(--accent)]" /> {user.relationshipStatus}
    </span>
  )}
  {user.churchName && (
    <span className="flex items-center gap-2">
      <Church className="w-4 h-4 text-[var(--accent)]" /> {user.churchName}
      {user.churchRole ? ` (${user.churchRole})` : ""}
    </span>
  )}
  {user.country && (
    <span className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-[var(--accent)]" /> {user.country}
    </span>
  )}
  {user.location && (
    <span className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-[var(--accent)]" /> {user.location}
    </span>
  )}
  {user.createdAt && (
    <span className="flex items-center gap-2">
      <CalendarHeart className="w-4 h-4 text-[var(--accent)]" /> Joined{" "}
      {moment(user.createdAt).format("MMMM YYYY")}
    </span>
  )}
</div>


          {/* 📊 Stats */}
  <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

  {/* Stats Section */}
  <div className="flex flex-wrap justify-center sm:justify-between items-center gap-6 border-t border-gray-200 pt-5">
    {[
      { label: "Posts", value: posts?.length || 0 },
      { label: "Followers", value: user.followers?.length || 0 },
      { label: "Following", value: user.following?.length || 0 },
    ].map((stat, i) => (
      <div key={i} className="flex-1 min-w-[90px] text-center space-y-1">
        <span className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 block">
          {stat.value}
        </span>
        <p className="text-xs sm:text-sm text-gray-500 tracking-wide">
          {stat.label}
        </p>
      </div>
    ))}
  </div>

  {/* Profile Views Dropdown */}
  <div className="mt-8 text-center">
    <ProfileViewersDropdown
      viewers={user.profileViewers || []}
      totalViews={user.profileViews || 0}
    />
  </div>


<div className="mt-10">
  <h3 className="text-2xl font-extrabold mb-8 text-center sm:text-left text-gradient ">
    Connections
  </h3>

  <div className="flex flex-wrap justify-center gap-6">
    {connectionsLoading
      ? <div className="connections-stack">
  {Array.from({ length: 6 }).map((_, i) => (
    <div
      key={`skeleton-${i}`}
      className="stack-item skeleton-item"
      style={{ zIndex: 100 - i }}
    >
      {/* Circle Skeleton */}
      <div className="stack-img skeleton-circle"></div>

      {/* Tooltip Skeleton */}
      <div className="stack-tooltip skeleton-tooltip">
        <div className="tooltip-arrow skeleton-arrow"></div>
        <div className="skeleton-line skeleton-name"></div>
        <div className="skeleton-line skeleton-occupation"></div>
      </div>
    </div>
  ))}
</div>

      : connections && connections.some(Boolean)
      ? 
   <div className="connections-stack">
  {connections
    ?.filter((c) => String(c._id) !== String(currentUser?._id))
    ?.slice(0, 8)
    ?.map((conn, i) => (
      <div
        key={conn._id}
        className="stack-item"
        style={{ zIndex: connections.length - i }}
        onClick={() => navigate(`/profile/${conn._id}`)}
      >
        {conn.profilePicUrl ? (
          <img src={conn.profilePicUrl} alt={conn.name} className="stack-img" />
        ) : (
          <div
            className="stack-img fallback"
            style={{ backgroundColor: conn.profilePicBackground || "#888" }}
          >
            {conn.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}

        {/* Hover Tooltip */}
        <div className="stack-tooltip">
          <div className="tooltip-arrow"></div>
          <p className="tooltip-name">{conn.name}</p>
          <p className="tooltip-occupation">
            {conn.occupation || "No occupation yet"}
          </p>
        </div>
      </div>
    ))}
</div>

      : (
        <p className="text-gray-400 w-full text-center text-lg mt-6">No connections yet.</p>
      )}
  </div>
</div>








</div>

        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;
