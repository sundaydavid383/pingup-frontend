import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axiosBase from "../utils/axiosBase";
import assets from "../assets/assets";
import "../styles/ui.css";
// NOTE: we no longer use the Loading component here — we render skeletons instead
import UserProfileInfo from "../component/UserProfileInfo";
import PostCard from "../component/PostCard";
import moment from "moment";
import ProfileModal from "../component/ProfileModal";
import { useAuth } from "../context/AuthContext";
import CustomAlert from "../component/shared/CustomAlert";
import ProfileSkeleton from "../component/skeleton/ProfileSkeleton";
import BackButton from "../component/shared/BackButton";
import RightSidebar from "../component/RightSidebar";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";
import AuthContainer from "./AuthContainer";
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
  const [isBlocked, setIsBlocked] = useState(() => {
  return localStorage.getItem(`blocked_${profileId}`) === 'true';
});

  const isUnauthenticatedVisitor = !currentUser;


  // Alert state
  const [alert, setAlert] = useState({ show: false, message: "", type: "info" });
  const showAlert = (message, type = "info") => setAlert({ show: true, message, type });

  const uniqueById = (items = []) => {
    const seen = new Set();
    return Array.isArray(items)
      ? items.filter((item) => {
          const id = item?._id?.toString();
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
      : [];
  };

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
        const res = await axiosBase.get(`/api/user/${profileId}?context=profile`, headers);
        userData = res.data.user || {};
        userPosts = Array.isArray(res.data.posts) ? res.data.posts : [];

if (res.data.user?.viewerHasBlocked === true) {
  setIsBlocked(true);
  localStorage.setItem(`blocked_${profileId}`, 'true');
} else if (res.data.user?.viewerHasBlocked === false) {
  localStorage.removeItem(`blocked_${profileId}`);
  setIsBlocked(false);
}
// If viewerHasBlocked is undefined (e.g., viewing own profile), leave as is
      }
      setProfileUser(userData);
      setPosts(uniqueById(userPosts));
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      // fallback to assets to avoid UI break (keeps interactions intact)
      // setProfileUser(assets.currentUser);
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
  const action = isBlocked ? 'unblock' : 'block';
  if (!window.confirm(`Are you sure you want to ${action} ${profileUser?.name || "this user"}?`))
    return;

  setBlocking(true);
  try {
    // Use the POST toggle route which handles both block and unblock
    const res = await axiosBase.post(
      `/api/user/block/${profileId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const nowBlocked = res.data?.blocked;
    setIsBlocked(nowBlocked);

    // Sync with localStorage so ChatBox knows
    if (nowBlocked) {
      localStorage.setItem(`blocked_${profileId}`, 'true');
      showAlert(`${profileUser?.name || "User"} has been blocked successfully.`, "success");
    } else {
      localStorage.removeItem(`blocked_${profileId}`);
      showAlert(`${profileUser?.name || "User"} has been unblocked.`, "success");
    }
  } catch (err) {
    console.error("❌ Error blocking/unblocking user:", err);
    showAlert(
      err?.response?.data?.message || `Failed to ${action} user. Please try again.`,
      "error"
    );
  } finally {
    setBlocking(false);
  }
};

  useEffect(() => {
    fetchProfileData();
    // cleanup on unmount - close the edit modal when leaving the profile page
    return () => {
      clearInterval(progressIntervalRef.current);
      setShowEdit(false);
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

      <div className="w-full min-h-screen no-scrollbar bg-slate-50 flex justify-center relative overflow-x-hidden">
        <div className={`w-full max-w-[1200px] no-scrollbar flex flex-wrap gap-0 px-0 sm:px-0 ${isUnauthenticatedVisitor ? "flex-col md:flex-row" : ""}`}>
          {loading && !profileUser ? (
            <ProfileSkeleton />
          ) : (
<main
  className={`${isUnauthenticatedVisitor ? "w-full md:w-[60%]" : "profile-main flex-1"} no-scrollbar h-screen profile_max_width overflow-y-scroll py-1 md:py-3 mx-auto box-border overflow-x-hidden profile-main-content`}
            >
              {alert.show && (
                <CustomAlert
                  message={alert.message}
                  type={alert.type}
                  onClose={() => setAlert({ ...alert, show: false })}
                />
              )}

              {/* <BackButton top="2" right="2" /> */}

              <div className="profile-card">
                <div className="cover-wrapper bg-multi-gradient">
                  {loading ? (
                    <div className="bg-skeleton animate-skeleton w-full h-full" />
                  ) : (profileUser?.coverPhotoUrl || profileUser?.cover_photo) ? (
                    <img
                      src={profileUser.coverPhotoUrl || profileUser.cover_photo}
                      alt="Cover"
                      className="cover-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="cover-placeholder" />
                  )}
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
                    isUnauthenticatedVisitor={isUnauthenticatedVisitor}
                  />
                )}

                {!isUnauthenticatedVisitor && !isCurrentUser && (
                  <div className="block-wrapper">
                    {loading ? (
                      <div className="bg-skeleton animate-skeleton" />
                    ) : (
                     <button
                    disabled={blocking}
                    onClick={handleBlockUser}
                    className={`block-btn ${isBlocked ? "block-btn-unblock" : "block-btn-active"}`}
                  >
                    {blocking
                      ? isBlocked ? "Unblocking..." : "Blocking..."
                      : isBlocked
                        ? "Unblock User"
                        : "Block User"}
                  </button>
                    )}
                  </div>
                )}
              </div>

              {!isUnauthenticatedVisitor && <div className="tabs-wrapper">
                <div className="tabs-container">
                  {["posts", "media", "likes"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`tab-btn ${activeTab === tab ? "tab-active" : "tab-inactive"
                        }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>}

              {!isUnauthenticatedVisitor && activeTab === "posts" && (
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
            </main>
          )}
          {!isUnauthenticatedVisitor && <RightSidebar sponsors={sponsors} loading={!sponsors} />}

          {!isUnauthenticatedVisitor && <MediumSidebarToggle sponsors={sponsors} />}
          {!isUnauthenticatedVisitor && showEdit && <ProfileModal setShowEdit={setShowEdit} />}
          {isUnauthenticatedVisitor && (
  <div className="w-full md:w-[40%] auth-side-wrapper">
    <div className="auth-inner">
      <AuthContainer
        isModal={true}
        onClose={() => navigate("/")}
        initialTab="login"
      />
    </div>
  </div>
)}
        </div>
      </div>
    </>
  );
};

export default Profile;
