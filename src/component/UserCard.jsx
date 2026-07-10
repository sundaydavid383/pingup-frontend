import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MapPin, UserPlus, MessageSquare, Check, Clock, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CustomAlert from "./shared/CustomAlert";
import ProfileAvatar from "../component/shared/ProfileAvatar";

const BASE = (import.meta.env.VITE_SERVER || "").replace(/\/$/, "");

const cardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

  .uc-card {
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border-radius: 20px;
    border: 1px solid rgba(59, 92, 203, 0.11);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.95) inset,
      0 1px 3px rgba(59,92,203,0.04),
      0 8px 28px rgba(26,41,74,0.08);
    padding: 0;
    display: flex;
    flex-direction: column;
    min-height: 240px;
    transition:
      transform 0.28s cubic-bezier(.22,1,.36,1),
      box-shadow 0.28s cubic-bezier(.22,1,.36,1),
      border-color 0.22s ease;
    position: relative;
    overflow: hidden;
    font-family: 'Sora', sans-serif;
  }
  .uc-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1.5px;
    background: linear-gradient(90deg, transparent 0%, rgba(59,92,203,0.3) 30%, rgba(131,109,240,0.25) 65%, transparent 100%);
    border-radius: 20px 20px 0 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s;
  }
  .uc-card::after {
    content: '';
    position: absolute;
    width: 160px; height: 160px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59,92,203,0.06) 0%, transparent 70%);
    top: -40px; right: -40px;
    pointer-events: none;
    transform: scale(0.7);
    opacity: 0;
    transition: opacity 0.3s, transform 0.35s cubic-bezier(.22,1,.36,1);
  }
  .uc-card:hover { transform: translateY(-4px) scale(1.008); border-color: rgba(59,92,203,0.22); box-shadow: 0 1px 0 rgba(255,255,255,0.95) inset, 0 4px 8px rgba(59,92,203,0.06), 0 20px 50px rgba(26,41,74,0.14), 0 0 0 1px rgba(59,92,203,0.08); }
  .uc-card:hover::before { opacity: 1; }
  .uc-card:hover::after  { opacity: 1; transform: scale(1); }
  .uc-body { padding: 22px 20px 0; display: flex; flex-direction: column; flex: 1; gap: 0; }
  .uc-profile-row { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px; }
  .uc-avatar-ring { flex-shrink: 0; cursor: pointer; border-radius: 50%; padding: 2.5px; background: linear-gradient(135deg, rgba(59,92,203,0.35) 0%, rgba(131,109,240,0.25) 100%); transition: all 0.22s cubic-bezier(.4,0,.2,1); position: relative; }
  .uc-avatar-ring:hover { transform: scale(1.07); background: linear-gradient(135deg, rgba(59,92,203,0.6) 0%, rgba(131,109,240,0.5) 100%); box-shadow: 0 0 0 3px rgba(59,92,203,0.12), 0 4px 14px rgba(59,92,203,0.2); }
  .uc-avatar-inner { border-radius: 50%; overflow: hidden; background: #f0f3fb; display: block; }
  .uc-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .uc-name { font-family: 'Sora', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--secondary); letter-spacing: -0.015em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.25; margin: 0; }
  .uc-handle { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); font-weight: 400; margin: 0; letter-spacing: 0.01em; }
  .uc-pills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; align-items: center; }
  .uc-pill { display: inline-flex; align-items: center; gap: 4px; font-family: 'Sora', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; border-radius: 99px; padding: 3px 9px; line-height: 1; white-space: nowrap; }
  .uc-pill-followers { background: rgba(59,92,203,0.09); color: var(--primary-color); border: 1px solid rgba(59,92,203,0.18); }
  .uc-pill-location { background: rgba(26,41,74,0.05); color: var(--text-muted); border: 1px solid rgba(26,41,74,0.1); max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
  .uc-pill-location svg { flex-shrink: 0; }
  .uc-bio { font-size: 12.5px; color: var(--text-muted); line-height: 1.6; font-style: italic; margin: 12px 0 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
  .uc-divider { height: 1px; background: linear-gradient(90deg, rgba(59,92,203,0.08) 0%, rgba(131,109,240,0.06) 50%, transparent 100%); margin: 16px 0 0; }
  .uc-actions { padding: 12px 20px 18px; display: flex; align-items: center; gap: 8px; }
  .uc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 10px; font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(.4,0,.2,1); border: 1.5px solid transparent; outline: none; white-space: nowrap; letter-spacing: -0.01em; position: relative; overflow: hidden; }
  .uc-btn::after { content: ''; position: absolute; inset: 0; background: rgba(255,255,255,0.12); opacity: 0; transition: opacity 0.15s; pointer-events: none; }
  .uc-btn:hover::after { opacity: 1; }
  .uc-btn:active { transform: scale(0.96); }
  .uc-btn-follow { flex: 1; padding: 8px 12px; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary) 100%); color: #fff; border-color: transparent; box-shadow: 0 3px 10px rgba(59,92,203,0.28); }
  .uc-btn-follow:hover:not(:disabled) { transform: translateY(-1.5px); box-shadow: 0 6px 18px rgba(59,92,203,0.38); }
  .uc-btn-following { flex: 1; padding: 8px 12px; background: rgba(59,92,203,0.07); color: var(--primary-color); border-color: rgba(59,92,203,0.2); }
  .uc-btn-following:hover:not(:disabled) { background: rgba(59,92,203,0.12); border-color: rgba(59,92,203,0.3); }
  .uc-btn-message { flex: 1; padding: 8px 12px; background: rgba(22,163,74,0.08); color: #15803d; border-color: rgba(22,163,74,0.22); }
  .uc-btn-message:hover { background: #16a34a; color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(22,163,74,0.3); transform: translateY(-1px); }
  .uc-btn-accept { flex: 1; padding: 8px 12px; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary) 100%); color: #fff; border-color: transparent; box-shadow: 0 3px 10px rgba(59,92,203,0.25); }
  .uc-btn-accept:hover:not(:disabled) { transform: translateY(-1.5px); box-shadow: 0 6px 18px rgba(59,92,203,0.35); }
  .uc-btn-accept:disabled { opacity: 0.6; cursor: not-allowed; }
  .uc-btn-connect { padding: 8px 12px; min-width: 38px; background: rgba(59,92,203,0.07); color: var(--primary-color); border-color: rgba(59,92,203,0.18); }
  .uc-btn-connect:hover:not(:disabled) { background: var(--primary-color); color: #fff; border-color: transparent; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,92,203,0.28); }
  .uc-btn-connect:disabled { opacity: 0.6; cursor: not-allowed; }
  .uc-btn-pending { padding: 8px 12px; min-width: 38px; background: rgba(245,158,11,0.08); color: #d97706; border-color: rgba(245,158,11,0.2); cursor: default; }
  .uc-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; }
  .uc-spin { display: inline-block; animation: uc-rotate 0.75s linear infinite; }
  @keyframes uc-rotate { to { transform: rotate(360deg); } }
  @media (max-width: 480px) {
    .uc-body { padding: 18px 16px 0; }
    .uc-actions { padding: 10px 16px 16px; }
    .uc-name { font-size: 13.5px; }
  }
`;

const Spinner = () => (
  <span className="uc-spin">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  </span>
);

export default function UserCard({ user: rawUser, onUserUpdate }) {
  const { user: ctxUser, token: ctxToken } = useAuth();
  const navigate = useNavigate();

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("springsCircleUser")) || {}; }
    catch { return {}; }
  })();

  const activeUser  = ctxUser?._id ? ctxUser : storedUser;
  const activeToken = ctxToken || localStorage.getItem("token") || null;
  const authHeaders = () => activeToken ? { Authorization: `Bearer ${activeToken}` } : {};

  // ── Normalise incoming prop ────────────────────────────────────────────────
  const user = {
    _id:              rawUser._id || String(rawUser.id || ""),
    name:             rawUser.name || rawUser.full_name || rawUser.displayName || "",
    username:         rawUser.username || rawUser.handle || "",
    profilePic:       rawUser.profilePicUrl || rawUser.profile_image || rawUser.profileImage || "",
    profilePicBackground: rawUser.profilePicBackground,
    bio:              rawUser.bio || rawUser.description || "",
    location:         rawUser.currentCity || rawUser.location || rawUser.city || "",
    followersCount:   Array.isArray(rawUser.followers)
                        ? rawUser.followers.length
                        : (rawUser.followersCount ?? 0),
    isFollowing:      rawUser.isFollowing      ?? false,
    connectionStatus: rawUser.connectionStatus ?? "none",
  };

  // ── Local state — initialised from prop, then owned locally ───────────────
  const [followersCount,    setFollowersCount]    = useState(user.followersCount);
  const [isFollowing,       setIsFollowing]       = useState(user.isFollowing);
  const [connectionStatus,  setConnectionStatus]  = useState(user.connectionStatus);
  const [disabledFollow,    setDisabledFollow]    = useState(false);
  const [isConnecting,      setIsConnecting]      = useState(false);
  const [isProcessing,      setIsProcessing]      = useState(false);
  const [alert,             setAlert]             = useState({ open: false, message: "", type: "info" });
  const isSelf = activeUser?._id && String(activeUser._id) === String(user._id);
  // ── KEY FIX: sync state when the parent re-renders with fresh props ────────
  // This is what makes the cache-bust + refresh actually update the buttons.
  useEffect(() => {
    setIsFollowing(rawUser.isFollowing ?? false);
    setConnectionStatus(rawUser.connectionStatus ?? "none");
    setFollowersCount(
      Array.isArray(rawUser.followers)
        ? rawUser.followers.length
        : (rawUser.followersCount ?? 0)
    );
  }, [rawUser.isFollowing, rawUser.connectionStatus, rawUser.followersCount, rawUser.followers]);

  const showAlert = (message, type = "info") =>
    setAlert({ open: true, message, type });

  // ── Notify parent of any state change ─────────────────────────────────────
  // Keeps the Discover page list and its sessionStorage cache in sync.
  const notifyParent = (patch) => {
    if (typeof onUserUpdate === "function") {
      onUserUpdate({ ...rawUser, ...patch });
    }
  };

  // ── Follow / Unfollow ─────────────────────────────────────────────────────
  const handleFollow = async () => {
    if (!activeUser?._id) { showAlert("Please login to follow users.", "error"); return; }

    const wasFollowing = isFollowing;
    const action = wasFollowing ? "unfollowUser" : "followUser";

    // Optimistic update
    setIsFollowing(!wasFollowing);
    setFollowersCount((c) => wasFollowing ? Math.max(0, c - 1) : c + 1);
    setDisabledFollow(true);

    try {
      const res = await axios.get(
        `${BASE}/api/user/${action}?userId=${activeUser._id}&id=${user._id}`,
        { headers: authHeaders() }
      );

      if (res.data.success) {
        const newFollowing = !wasFollowing;
        notifyParent({ isFollowing: newFollowing });
        showAlert(res.data.message || (newFollowing ? "Followed" : "Unfollowed"), "success");
      } else {
        // Revert on failure
        setIsFollowing(wasFollowing);
        setFollowersCount((c) => wasFollowing ? c + 1 : Math.max(0, c - 1));
        showAlert(res.data.message || "Could not update follow.", "error");
      }
    } catch {
      setIsFollowing(wasFollowing);
      setFollowersCount((c) => wasFollowing ? c + 1 : Math.max(0, c - 1));
      showAlert("Could not update follow. Try again.", "error");
    } finally {
      setDisabledFollow(false);
    }
  };

  // ── Send connection request ───────────────────────────────────────────────
  const handleConnectionRequest = async () => {
    if (!activeUser?._id) { showAlert("Please login to send connection requests.", "error"); return; }
    setIsConnecting(true);

    try {
      const res = await axios.get(
        `${BASE}/api/user/connect?userId=${activeUser._id}&id=${user._id}`,
        { headers: authHeaders() }
      );

      if (res.data.success) {
        // Optimistically move to pending_out — server confirmed the request was created
        setConnectionStatus("pending_out");
        notifyParent({ connectionStatus: "pending_out" });
        showAlert(res.data.message || "Request sent.", "success");
      } else {
        showAlert(res.data.message || "Could not send request.", "error");
      }
    } catch {
      showAlert("Could not send request. Try again.", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Accept incoming connection ────────────────────────────────────────────
  const handleAccept = async () => {
    if (!activeUser?._id) return;
    setIsProcessing(true);

    try {
      const res = await axios.get(
        `${BASE}/api/user/accept?userId=${activeUser._id}&id=${user._id}`,
        { headers: authHeaders() }
      );

      if (res.data.success) {
        // Accepted → show Message button
        setConnectionStatus("connected");
        notifyParent({ connectionStatus: "connected" });
        showAlert(res.data.message || "Connection accepted!", "success");
      } else {
        showAlert(res.data.message || "Failed to accept connection.", "error");
      }
    } catch {
      showAlert("Error accepting connection. Try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <style>{cardStyles}</style>

      {alert.open && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ open: false, message: "", type: "info" })}
        />
      )}

      <div className="uc-card">
        <div className="uc-body">
          <div className="uc-profile-row">
            <div
              className="uc-avatar-ring"
              onClick={() => navigate(`/profile/${user._id}`)}
            >
              <div className="uc-avatar-inner">
                <ProfileAvatar
                  user={{
                    name:                user.name || "User",
                    profilePicUrl:       user.profilePic,
                    profilePicBackground:user.profilePicBackground,
                  }}
                  size={56}
                />
              </div>
            </div>

            <div className="uc-text">
              <p className="uc-name">{user.name || user.username}</p>
              {user.username && (
                <p className="uc-handle">@{user.username}</p>
              )}
              <div className="uc-pills">
                <span className="uc-pill uc-pill-followers">
                  {followersCount} followers
                </span>
                {user.location && (
                  <span className="uc-pill uc-pill-location">
                    <MapPin size={9} />
                    {user.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {user.bio && <p className="uc-bio">"{user.bio}"</p>}
        </div>

        <div className="uc-divider" />

        {!isSelf && <div className="uc-actions">
          {/* ── Follow / Following ── */}
          <button
            onClick={handleFollow}
            disabled={disabledFollow}
            className={`uc-btn ${isFollowing ? "uc-btn-following" : "uc-btn-follow"}`}
          >
            {disabledFollow ? <Spinner /> : <UserPlus size={13} />}
            <span>{isFollowing ? "Following" : "Follow"}</span>
          </button>

          {/* ── Connected → Message ── */}
          {connectionStatus === "connected" && (
            <button
              onClick={() => navigate(`/chatbox/${user._id}`)}
              className="uc-btn uc-btn-message"
            >
              <MessageSquare size={13} />
              <span>Message</span>
            </button>
          )}

          {/* ── They sent me a request → Accept ── */}
          {connectionStatus === "pending_in" && (
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="uc-btn uc-btn-accept"
            >
              {isProcessing ? <Spinner /> : <Check size={13} />}
              <span>{isProcessing ? "Accepting…" : "Accept"}</span>
            </button>
          )}

          {/* ── I sent a request → Pending clock ── */}
          {connectionStatus === "pending_out" && (
            <button className="uc-btn uc-btn-pending" tabIndex={-1} disabled>
              <Clock size={13} />
              <span>Pending</span>
            </button>
          )}

          {/* ── No connection at all → Connect ── */}
          {connectionStatus === "none" && (
            <button
              onClick={handleConnectionRequest}
              disabled={isConnecting}
              className="uc-btn uc-btn-connect"
              title="Send connection request"
            >
              {isConnecting ? <Spinner /> : <Plus size={15} />}
            </button>
          )}
        </div>}
      </div>
    </>
  );
}