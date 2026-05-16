import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  UserRoundPen,
  MessageSquare,
  Check,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosBase from "../utils/axiosBase";
import "../styles/ui.css";
import BackButton from "../component/shared/BackButton";
import ProfileAvatar from "../component/shared/ProfileAvatar";
import CustomAlert from "../component/shared/CustomAlert";
import RightSidebar from "../component/RightSidebar";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";
import RefreshButton from "../component/shared/RefreshButton";
import { IconButton } from "../component/shared/IconButton";
import { User } from "lucide-react";

/* ─── Scoped styles ─────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&display=swap');

  .conn-root {
    min-height: 100svh;
    background: linear-gradient(160deg, #f0f4ff 0%, #ffffff 50%, #f5f0ff 100%);
    display: flex;
    position: relative;
    overflow-x: hidden;
  }

  /* Ambient blobs */
  .conn-root::before,
  .conn-root::after {
    content: '';
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(90px);
    opacity: 0.3;
  }
  .conn-root::before {
    width: 520px; height: 520px;
    top: -140px; left: -120px;
    background: radial-gradient(circle, rgba(59,92,203,0.25) 0%, transparent 70%);
  }
  .conn-root::after {
    width: 420px; height: 420px;
    bottom: -80px; right: -80px;
    background: radial-gradient(circle, rgba(131,109,240,0.2) 0%, transparent 70%);
  }

  .conn-main {
    flex: 1;
    padding: 32px 20px 56px;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  /* ── Page header ── */
  .conn-header {
    margin-bottom: 32px;
  }
  .conn-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--primary-color);
    background: rgba(59,92,203,0.08);
    border: 1px solid rgba(59,92,203,0.16);
    padding: 3px 12px;
    border-radius: 99px;
    margin-bottom: 12px;
  }
  .conn-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .conn-title {
    font-family: 'Sora', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--secondary);
    letter-spacing: -0.025em;
    line-height: 1.15;
    margin: 0 0 6px;
  }
  .conn-subtitle {
    font-size: 13.5px;
    color: var(--text-muted);
    margin: 0;
  }

  /* ── Stat cards ── */
  .conn-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 14px;
    margin-bottom: 28px;
  }
  .conn-stat-card {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(14px);
    border-radius: 16px;
    border: 1.5px solid rgba(59,92,203,0.1);
    padding: 18px 16px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-align: center;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(.4,0,.2,1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(59,92,203,0.05), 0 8px 24px rgba(59,92,203,0.07);
  }
  .conn-stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: transparent;
    transition: background 0.22s;
    border-radius: 16px 16px 0 0;
  }
  .conn-stat-card.active::before {
    background: linear-gradient(90deg, var(--primary-color), var(--hover-dark));
  }
  .conn-stat-card:hover:not(.active) {
    border-color: rgba(59,92,203,0.22);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(59,92,203,0.13);
  }
  .conn-stat-card.active {
    background: rgba(59,92,203,0.07);
    border-color: rgba(59,92,203,0.28);
    box-shadow: 0 0 0 3px rgba(59,92,203,0.08), 0 8px 24px rgba(59,92,203,0.1);
  }
  .conn-stat-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: var(--color-6);
    color: var(--primary-color);
    margin-bottom: 2px;
    transition: all 0.22s;
    flex-shrink: 0;
  }
  .conn-stat-card.active .conn-stat-icon {
    background: var(--primary-color);
    color: #fff;
  }
  .conn-stat-count {
    font-family: 'Sora', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--secondary);
    line-height: 1;
    letter-spacing: -0.03em;
  }
  .conn-stat-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.01em;
  }

  /* ── Section heading + notice ── */
  .conn-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .conn-section-title {
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--secondary);
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: -0.01em;
  }
  .conn-section-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    background: var(--primary-color);
    color: #fff;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    padding: 0 6px;
    font-family: inherit;
  }
  .conn-notice {
    font-size: 11.5px;
    color: var(--text-muted);
    background: rgba(59,92,203,0.06);
    border: 1px solid rgba(59,92,203,0.12);
    border-radius: 8px;
    padding: 5px 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .conn-notice::before {
    content: 'ℹ';
    font-size: 12px;
    color: var(--primary-color);
  }

  /* ── Tab bar ── */
  .conn-tabs {
    display: flex;
    gap: 6px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(12px);
    border: 1.5px solid rgba(59,92,203,0.1);
    border-radius: 14px;
    padding: 6px;
    margin-bottom: 24px;
    flex-wrap: wrap;
    box-shadow: 0 2px 12px rgba(59,92,203,0.07);
  }
  .conn-tab-btn {
    flex: 1;
    min-width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: 9px;
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(.4,0,.2,1);
    white-space: nowrap;
  }
  .conn-tab-btn:hover:not(.active) {
    background: var(--color-6);
    color: var(--secondary);
  }
  .conn-tab-btn.active {
    background: var(--primary-color);
    color: #fff;
    box-shadow: 0 3px 10px rgba(59,92,203,0.28);
  }
  .conn-tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    padding: 0 5px;
    background: rgba(255,255,255,0.22);
    color: inherit;
    transition: all 0.2s;
  }
  .conn-tab-btn:not(.active) .conn-tab-count {
    background: rgba(59,92,203,0.1);
    color: var(--primary-color);
  }

  /* ── User cards grid ── */
  .conn-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }

  .conn-user-card {
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(14px);
    border-radius: 16px;
    border: 1.5px solid rgba(59,92,203,0.1);
    padding: 18px;
    display: flex;
    gap: 14px;
    align-items: flex-start;
    transition: all 0.22s cubic-bezier(.4,0,.2,1);
    box-shadow: 0 1px 3px rgba(59,92,203,0.04), 0 6px 20px rgba(59,92,203,0.06);
    position: relative;
    overflow: hidden;
  }
  .conn-user-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(59,92,203,0.18) 40%, rgba(131,109,240,0.15) 70%, transparent 100%);
    pointer-events: none;
  }
  .conn-user-card:hover {
    border-color: rgba(59,92,203,0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(59,92,203,0.12);
  }

  .conn-avatar-wrap {
    cursor: pointer;
    flex-shrink: 0;
    border-radius: 12px;
    transition: transform 0.18s;
  }
  .conn-avatar-wrap:hover {
    transform: scale(1.05);
  }

  .conn-user-info {
    flex: 1;
    min-width: 0;
  }
  .conn-user-name {
    font-family: 'Sora', sans-serif;
    font-size: 14.5px;
    font-weight: 700;
    color: var(--secondary);
    margin: 0 0 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }
  .conn-user-bio {
    font-size: 12.5px;
    color: var(--text-muted);
    margin: 0 0 14px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .conn-user-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* ── Action buttons on cards ── */
  .conn-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1.5px solid transparent;
    font-size: 12.5px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(.4,0,.2,1);
    white-space: nowrap;
  }
  .conn-btn-outline {
    background: var(--color-6);
    border-color: rgba(59,92,203,0.2);
    color: var(--primary-color);
  }
  .conn-btn-outline:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(59,92,203,0.25);
  }
  .conn-btn-success {
    background: rgba(22,163,74,0.08);
    border-color: rgba(22,163,74,0.25);
    color: var(--success);
  }
  .conn-btn-success:hover:not(:disabled) {
    background: var(--success);
    border-color: var(--success);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(22,163,74,0.25);
  }
  .conn-btn-success:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .conn-btn-message {
    background: rgba(59,92,203,0.07);
    border-color: rgba(59,92,203,0.18);
    color: var(--primary-color);
  }
  .conn-btn-message:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(59,92,203,0.25);
  }

  /* Spin */
  .conn-spin {
    animation: conn-rotate 0.75s linear infinite;
    display: inline-block;
  }
  @keyframes conn-rotate { to { transform: rotate(360deg); } }

  /* ── Empty state ── */
  .conn-empty {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 56px 24px;
    background: rgba(255,255,255,0.7);
    border-radius: 20px;
    border: 1.5px dashed rgba(59,92,203,0.2);
    text-align: center;
  }
  .conn-empty-icon {
    width: 52px; height: 52px;
    border-radius: 14px;
    background: var(--color-6);
    display: flex; align-items: center; justify-content: center;
    color: var(--primary-color);
    margin-bottom: 4px;
  }
  .conn-empty-title {
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--secondary);
    margin: 0;
  }
  .conn-empty-text {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
    max-width: 260px;
  }

  /* ── Skeleton loaders ── */
  .conn-skeleton-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 14px;
    margin-bottom: 28px;
  }
  .conn-skeleton-stat {
    height: 110px;
    border-radius: 16px;
    background: linear-gradient(90deg, rgba(59,92,203,0.06) 0%, rgba(59,92,203,0.1) 50%, rgba(59,92,203,0.06) 100%);
    background-size: 200% 100%;
    animation: conn-shimmer 1.5s ease-in-out infinite;
  }
  .conn-skeleton-tabs {
    height: 56px;
    border-radius: 14px;
    margin-bottom: 24px;
    background: linear-gradient(90deg, rgba(59,92,203,0.06) 0%, rgba(59,92,203,0.1) 50%, rgba(59,92,203,0.06) 100%);
    background-size: 200% 100%;
    animation: conn-shimmer 1.5s ease-in-out infinite;
  }
  .conn-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }
  .conn-skeleton-card {
    height: 120px;
    border-radius: 16px;
    background: linear-gradient(90deg, rgba(59,92,203,0.06) 0%, rgba(59,92,203,0.1) 50%, rgba(59,92,203,0.06) 100%);
    background-size: 200% 100%;
    animation: conn-shimmer 1.5s ease-in-out infinite;
  }
  @keyframes conn-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .conn-main { padding: 20px 14px 48px; }
    .conn-title { font-size: 22px; }
    .conn-tabs { border-radius: 12px; }
    .conn-tab-btn { min-width: 70px; font-size: 12px; padding: 8px 10px; }
    .conn-stats { grid-template-columns: repeat(2, 1fr); }
  }
`;

const Connections = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("Followers");
  const [data, setData] = useState({
    followers: [],
    following: [],
    connections: [],
    pendingConnections: [],
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [alertData, setAlertData] = useState(null);

  const { user, token, sponsors } = useAuth();

  const showAlert = (message, type = "info") => {
    setAlertData({ message, type });
  };

  const CONN_SCROLL_KEY = "connections_scroll_position";
  const CONN_DATA_KEY = "connections_cached_data";

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const userId = user?._id;
      if (!token || !userId) {
        showAlert("Please log in again.", "warning");
        return;
      }
      const res = await axiosBase.get(`api/user/connections?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res?.data?.data || {};
      const formatted = {
        followers: d.followers || [],
        following: d.following || [],
        connections: d.connections || [],
        pendingConnections: d.pendingConnections || [],
      };
      setData(formatted);
      localStorage.setItem("springscircle_connections_full", JSON.stringify(formatted));
    } catch (error) {
      console.error("❌ Error fetching connections:", error);
      showAlert("Failed to load connections. Showing saved data.", "error");
      const cached = localStorage.getItem("springscircle_connections_full");
      setData(
        cached
          ? JSON.parse(cached)
          : { followers: [], following: [], connections: [], pendingConnections: [] }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedScroll = localStorage.getItem(CONN_SCROLL_KEY);
    if (savedScroll) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll, 10)), 100);
    }
    const cached = localStorage.getItem(CONN_DATA_KEY);
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
      } catch (e) {
        fetchConnections();
      }
    } else {
      fetchConnections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      localStorage.setItem(CONN_SCROLL_KEY, window.scrollY.toString());
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (data.followers.length > 0 || data.following.length > 0) {
      localStorage.setItem(CONN_DATA_KEY, JSON.stringify(data));
    }
  }, [data]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchConnections();
  };

  React.useEffect(() => {
    if (!loading && isRefreshing) {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [loading, isRefreshing]);

  const handleAccept = async (senderId) => {
    if (!user?._id || !token) {
      showAlert("Please log in again.", "warning");
      return;
    }
    try {
      setAcceptingId(senderId);
      const res = await axiosBase.get("api/user/accept", {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId: user._id, id: senderId },
      });
      if (res.data.success) {
        setData((prev) => ({
          ...prev,
          pendingConnections: prev.pendingConnections.filter((u) => u._id !== senderId),
          connections: [
            ...prev.connections,
            prev.pendingConnections.find((u) => u._id === senderId),
          ],
        }));
        showAlert("✅ Connection accepted successfully!", "success");
        fetchConnections();
      } else {
        showAlert(res.data.message || "Failed to accept connection.", "error");
      }
    } catch (error) {
      console.error("❌ Error accepting connection:", error);
      showAlert("Something went wrong. Please try again.", "error");
    } finally {
      setAcceptingId(null);
    }
  };

  const dataArray = [
    { label: "Followers", value: data.followers, icon: Users },
    { label: "Following", value: data.following, icon: UserCheck },
    { label: "Pending", value: data.pendingConnections, icon: UserRoundPen },
    { label: "Connections", value: data.connections, icon: UserPlus },
  ];

  const activeList = dataArray.find((item) => item.label === currentTab)?.value || [];

  return (
    <>
      <style>{styles}</style>

      <div className="conn-root">
        <div className="conn-main">
          <BackButton top="2" right="2" />

          {/* Page header */}
          <div className="conn-header">
            <div className="conn-eyebrow">
              <span>✦</span> Network
            </div>
            <div className="conn-title-row">
              <div>
                <h1 className="conn-title">Connections</h1>
                <p className="conn-subtitle">Manage your followers, friends, and pending requests.</p>
              </div>
              <RefreshButton
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                label="Refresh"
              />
            </div>
          </div>

          {loading ? (
            <>
              <div className="conn-skeleton-stats">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="conn-skeleton-stat" />
                ))}
              </div>
              <div className="conn-skeleton-tabs" />
              <div className="conn-skeleton-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="conn-skeleton-card" />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Stat cards */}
              <div className="conn-stats">
                {dataArray.map((item) => {
                  const isActive = currentTab === item.label;
                  return (
                    <div
                      key={item.label}
                      onClick={() => setCurrentTab(item.label)}
                      className={`conn-stat-card${isActive ? " active" : ""}`}
                    >
                      <div className="conn-stat-icon">
                        <item.icon size={18} />
                      </div>
                      <span className="conn-stat-count">{item.value?.length || 0}</span>
                      <span className="conn-stat-label">{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Tab bar */}
              <div className="conn-tabs">
                {dataArray.map((tab) => (
                  <button
                    key={tab.label}
                    onClick={() => {
                      setCurrentTab(tab.label);
                      fetchConnections();
                    }}
                    className={`conn-tab-btn${currentTab === tab.label ? " active" : ""}`}
                  >
                    <tab.icon size={15} />
                    {tab.label}
                    <span className="conn-tab-count">{tab.value?.length || 0}</span>
                  </button>
                ))}
              </div>

              {/* Section head */}
              <div className="conn-section-head">
                <div className="conn-section-title">
                  {currentTab}
                  <span className="conn-section-badge">{activeList.length}</span>
                </div>
                <span className="conn-notice">
                  Switching tabs fetches fresh data
                </span>
              </div>

              {/* Cards grid */}
              <div className="conn-grid">
                {activeList.length === 0 ? (
                  <div className="conn-empty">
                    <div className="conn-empty-icon">
                      {(() => {
                        const Tab = dataArray.find((d) => d.label === currentTab)?.icon || Users;
                        return <Tab size={24} />;
                      })()}
                    </div>
                    <p className="conn-empty-title">No {currentTab.toLowerCase()} yet</p>
                    <p className="conn-empty-text">
                      {currentTab === "Followers"
                        ? "When people follow you, they'll appear here."
                        : currentTab === "Following"
                        ? "You haven't followed anyone yet."
                        : currentTab === "Pending"
                        ? "No pending connection requests right now."
                        : "You have no connections yet. Start connecting!"}
                    </p>
                  </div>
                ) : (
                  activeList.map((u) => (
                    <div key={u._id} className="conn-user-card">
                      {/* Avatar */}
                      <div
                        className="conn-avatar-wrap"
                        onClick={() => navigate(`/profile/${u?._id}`)}
                      >
                        <ProfileAvatar
                          user={{
                            name: u?.name || "User",
                            profilePicUrl: u?.profilePicUrl,
                            profilePicBackground: u?.profilePicBackground,
                          }}
                          size={46}
                        />
                      </div>

                      {/* Info */}
                      <div className="conn-user-info">
                        <p className="conn-user-name">{u.username}</p>
                        <p className="conn-user-bio">{u.bio || "No bio yet"}</p>

                        <div className="conn-user-actions">
                          {/* View profile */}
                          <button
                            className="conn-btn conn-btn-outline"
                            onClick={() => navigate(`/profile/${u._id}`)}
                          >
                            <User size={13} />
                            Profile
                          </button>

                          {/* Accept request */}
                          {currentTab === "Pending" && u.direction === "incoming" && (
                            <button
                              className="conn-btn conn-btn-success"
                              onClick={() => handleAccept(u._id)}
                              disabled={acceptingId === u._id}
                            >
                              {acceptingId === u._id ? (
                                <>
                                  <span className="conn-spin">
                                    <Loader2 size={13} />
                                  </span>
                                  Accepting…
                                </>
                              ) : (
                                <>
                                  <Check size={13} />
                                  Accept
                                </>
                              )}
                            </button>
                          )}

                          {/* Message */}
                          {currentTab === "Connections" && (
                            <button
                              className="conn-btn conn-btn-message"
                              onClick={() => navigate(`/chatbox/${u._id}`)}
                            >
                              <MessageSquare size={13} />
                              Message
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <RightSidebar sponsors={sponsors} loading={!sponsors} />
        <MediumSidebarToggle sponsors={sponsors} />
      </div>

      {alertData && (
        <CustomAlert
          message={alertData.message}
          type={alertData.type}
          onClose={() => setAlertData(null)}
        />
      )}
    </>
  );
};

export default Connections;
