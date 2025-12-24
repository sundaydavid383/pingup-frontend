import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axiosBase from "../utils/axiosBase";
import assets from "../assets/assets";
import "../styles/ui.css";
// NOTE: we no longer use the Loading component here — we render skeletons instead
import UserProfileInfo from "../component/UserProfileInfo";
import PostCard from "../component/PostCard";
import moment from "moment";
import ProfileViewersDropdown from "../component/ProfileViewersDropdown";
import ProfileModal from "../component/ProfileModal";
import { useAuth } from "../context/AuthContext";
import CustomAlert from "../component/shared/CustomAlert";
import { ArrowLeft } from "lucide-react";
import ProfileSkeleton from "../component/skeleton/ProfileSkeleton";
import BackButton from "../component/shared/BackButton";
import RightSidebar from "../component/RightSidebar";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";
import "../styles/profile.css";
const Profile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token, sponsors } = useAuth() || {};

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Alert state
  const [alert, setAlert] = useState({ show: false, message: "", type: "info" });
  const showAlert = (message, type = "info") => setAlert({ show: true, message, type });

  // Top progress bar state (YouTube-like)
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const progressIntervalRef = useRef(null);

  const startProgress = () => {
    clearInterval(progressIntervalRef.current);
    setShowProgress(true);
    setProgress(8); // initial small progress
    // slowly increase to simulate loading (but never reach 100%)
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 8; // random increment
        return next >= 85 ? 85 : next;
      });
    }, 350);
  };

  const finishProgress = () => {
    clearInterval(progressIntervalRef.current);
    setProgress(100);
    // allow animation to show 100% then hide
    setTimeout(() => {
      setShowProgress(false);
      setProgress(0);
    }, 350);
  };

  // Fetch both user + posts (server interactions left intact)
  const fetchProfileData = async () => {
    startProgress();
    setLoading(true);
    try {
      let userData = null;
      let userPosts = [];
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      if (!profileId || profileId === "notifications") {
        console.warn("⛔ Skipping invalid profileId:", profileId);
        return;
      }

      if (!profileId && currentUser?._id) {
        // Viewing own profile
        userData = currentUser;
        const res = await axiosBase.get(`/api/user/${currentUser._id}`, headers);
        userPosts = Array.isArray(res.data.posts) ? res.data.posts : [];
      } else if (profileId) {
        // Viewing someone else's profile
        const res = await axiosBase.get(`/api/user/${profileId}`, headers);
        userData = res.data.user || {};
        userPosts = Array.isArray(res.data.posts) ? res.data.posts : [];

        // Check if already blocked
        if (res.data.user?.blockedBy?.includes(currentUser?._id)) {
          setIsBlocked(true);
        }
      }

      setProfileUser(userData);
      setPosts(userPosts);
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      // fallback to assets to avoid UI break (keeps interactions intact)
      setProfileUser(assets.currentUser);
      setPosts([]);
      showAlert("Failed to load profile data.", "error");
    } finally {
      setLoading(false);
      finishProgress();
    }
  };

  // Block user (keeps exactly your server call and behavior)
  const handleBlockUser = async () => {
    if (!token || !profileId) return;
    if (!window.confirm(`Are you sure you want to block ${profileUser?.name || "this user"}?`))
      return;

    setBlocking(true);
    try {
      const res = await axiosBase.put(
        `/api/user/block?userId=${currentUser._id}&id=${profileId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Blocked user:", res.data);
      setIsBlocked(true);
      showAlert(`${profileUser?.name || "User"} has been blocked successfully.`, "success");
    } catch (err) {
      console.error("❌ Error blocking user:", err);
      showAlert("Failed to block user. Please try again.", "error");
    } finally {
      setBlocking(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    // cleanup on unmount
    return () => {
      clearInterval(progressIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, currentUser]); // same dependencies as before

  const isCurrentUser = currentUser?._id === profileId;
 




  

return (
 <>
  {showProgress && (
    <div
      className="top-progress"
      style={{
        width: `${progress}%`,
        maxWidth: "var(--profile-main-width)",
      }}
    />
  )}
   
  <div className="profile-layout no-scrollbar">
    {loading && !profileUser ? (
      <ProfileSkeleton />
    ) : 
    (
      <div
        className="profile-main"
     
      >
        {alert.show && (
          <CustomAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert({ ...alert, show: false })}
          />
        )}

        <BackButton top="2" right="2" />

        <div className="profile-card">
          <div className="cover-wrapper bg-multi-gradient">
            {loading ? (
              <div className="bg-skeleton animate-skeleton" />
            ) : profileUser?.coverPhotoUrl || profileUser?.cover_photo ? (
              <img
                src={profileUser.coverPhotoUrl || profileUser.cover_photo}
                alt="Cover"
                className="cover-image"
              />
            ) : null}
          </div>

          {loading ? (
            <ProfileSkeleton />
          ) : (
            <UserProfileInfo
              user={profileUser}
              posts={posts}
              profileId={profileId}
              setShowEdit={setShowEdit}
              isCurrentUser={isCurrentUser}
            />
          )}

          {!isCurrentUser && (
            <div className="block-wrapper">
              {loading ? (
                <div className="bg-skeleton animate-skeleton" />
              ) : (
                <button
                  disabled={blocking || isBlocked}
                  onClick={handleBlockUser}
                  className={`block-btn ${
                    isBlocked
                      ? "block-btn-disabled"
                      : "block-btn-active"
                  }`}
                >
                  {blocking
                    ? "Blocking..."
                    : isBlocked
                    ? "User Blocked"
                    : "Block User"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="tabs-wrapper">
          <div className="tabs-container">
            {["posts", "media", "likes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-btn ${
                  activeTab === tab ? "tab-active" : "tab-inactive"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "posts" && (
          <div className="posts-wrapper">
            {posts.length ? (
              posts.map((post) => (
                <PostCard
                  post={post}
                  key={post._id}
                  setFeeds={setPosts}
                />
              ))
            ) : (
              <p className="text-center text-muted mt-6">
                No posts yet.
              </p>
            )}
          </div>
        )}
      </div>
    )}
<div className="right-sidebar">
 <RightSidebar sponsors={sponsors} loading={!sponsors} />
</div>
 <MediumSidebarToggle sponsors={sponsors} />
    {showEdit && <ProfileModal setShowEdit={setShowEdit} />}
  </div>
</>

);

};

export default Profile;
