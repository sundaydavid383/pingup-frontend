import React, { useState, useEffect, useMemo } from "react";
import ChatBox from "../pages/ChatBox.jsx";
import { useNavigate } from "react-router-dom";
import { Eye, MessageSquare, ImageIcon, Mic } from "lucide-react";
import axios from "../utils/axiosBase";
import BackButton from "../component/shared/BackButton";
import ProfileAvatar from "../component/shared/ProfileAvatar";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useMessageSeen } from "../../MessageSeenContext";
import "../styles/message.css";
import RightSidebar from "../component/RightSidebar";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";
import { MdNetworkLocked } from "react-icons/md";

const Messages = () => {
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();

  const {
    conversations,
    unreadCountsMap,
    totalUnreadCount,
    failedToFetch,
    loading,
    setLoading,
    setActiveChatId: setContextActiveChatId,
    clearUnreadForChat,
    getConvoByChatId,
  } = useMessageSeen();

  useEffect(() => {
    setContextActiveChatId(activeChatId);
  }, [activeChatId, setContextActiveChatId]);

  const sortedConversations = useMemo(() => {
    if (!conversations || conversations.length === 0) return [];

    const getConversationData = (convo) => {
      const unreadCount = unreadCountsMap[convo._id] || 0;
      const isActive = activeChatId === convo.otherUser?._id;
      let priorityLevel;
      if (isActive) priorityLevel = 0;
      else if (unreadCount > 0) priorityLevel = 1;
      else priorityLevel = 2;
      const timestamp = convo.lastMessage?.createdAt
        ? new Date(convo.lastMessage.createdAt).getTime()
        : 0;
      return { priorityLevel, timestamp, unreadCount };
    };

    const conversationsWithData = conversations.map((convo) => ({
      convo,
      ...getConversationData(convo),
    }));

    conversationsWithData.sort((a, b) => {
      if (a.priorityLevel !== b.priorityLevel)
        return a.priorityLevel - b.priorityLevel;
      return b.timestamp - a.timestamp;
    });

    return conversationsWithData.map((item) => item.convo);
  }, [conversations, unreadCountsMap, activeChatId]);

  const filteredConnections = useMemo(
    () =>
      sortedConversations.filter((convo) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const otherUser = convo.otherUser;
        if (!otherUser) return false;
        return (
          otherUser.name?.toLowerCase().includes(term) ||
          otherUser.username?.toLowerCase().includes(term)
        );
      }),
    [sortedConversations, searchTerm]
  );

const handleOpenChat = (userId) => {
    setActiveChatId(userId);
    // ✅ FIX-6: Clear unread badge immediately on click — don't wait for ChatBox to mount
    const convo = conversations.find(
      (c) => c.otherUser?._id?.toString() === userId?.toString()
    );
    if (convo?._id) {
      clearUnreadForChat(convo._id);
    }
    if (window.innerWidth < 768) navigate(`/chatbox/${userId}`);
  };

  const highlightMatch = (text, term) => {
    if (!term || !text) return text;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          style={{
            backgroundColor: "rgba(139, 92, 246, 0.25)",
            color: "var(--primary)",
            fontWeight: 600,
            borderRadius: "4px",
            padding: "0 2px",
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    /*
     * Root: h-screen, flex-row always, overflow-hidden.
     * Children use explicit widths — sidebar is fixed width on md+,
     * right panel takes the rest with flex:1.
     */
    <div className="messages-root">

      {/* ── LEFT: Conversation list ── */}
      <div className="msg-sidebar-col">
        <div className="msg-sidebar">

          {/* decorative pseudo-elements come from CSS */}
          <div className="msg-sidebar-inner">
            <BackButton top="0px" left="80px" />

            <div className="msg-header">
              <div className="msg-eyebrow"><span>✦</span> Inbox</div>
            </div>

            <div className="msg-search-wrap">
              <svg className="msg-search-icon" width="15" height="15"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search conversations…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                className="msg-search-input"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")}
                  className="msg-search-clear" aria-label="Clear search">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {!loading && filteredConnections.length > 0 && (
              <div className="msg-section-label">
                {searchTerm
                  ? `${filteredConnections.length} result${filteredConnections.length !== 1 ? "s" : ""}`
                  : "Recent"}
              </div>
            )}

            <div className="msg-list">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="msg-skeleton">
                    <div className="msg-skeleton-avatar" />
                    <div className="msg-skeleton-lines">
                      <div className="msg-skeleton-line" style={{ width: "55%" }} />
                      <div className="msg-skeleton-line" style={{ width: "38%" }} />
                    </div>
                  </div>
                ))}

              {!loading &&
                filteredConnections.length > 0 &&
                filteredConnections.map((convo) => {
                  const otherUser = convo.otherUser;
                  if (!otherUser) return null;
                  const last = convo.lastMessage;
                  const unreadCount = unreadCountsMap[convo._id] || 0;
                  const isActive = activeChatId === otherUser._id;
                  const hasUnread = unreadCount > 0;

                  let rowClass = "msg-row ";
                  if (hasUnread) rowClass += "msg-row-unread";
                  else if (isActive) rowClass += "msg-row-active";
                  else rowClass += "msg-row-normal";

                  return (
                    <div key={otherUser._id}
                      onClick={() => handleOpenChat(otherUser._id)}
                      className={rowClass}>
                      <div className="msg-avatar-wrap" style={{ position: "relative" }}>
                        <div className="msg-avatar-ring">
                          <div className="msg-avatar-inner">
                            <ProfileAvatar
                              user={{
                                name: otherUser.name || "User",
                                profilePicUrl: otherUser.profile_picture || otherUser.profilePicUrl,
                                profilePicBackground: otherUser.profilePicBackground,
                              }}
                              size={42}
                            />
                          </div>
                        </div>
                        {onlineUsers.has(otherUser._id?.toString()) && (
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                            style={{ zIndex: 2 }}
                          />
                        )}
                      </div>

                      <div className="msg-text">
                        <p className="msg-username">
                          @{highlightMatch(otherUser.username, searchTerm)}
                        </p>
                        {last && (
                          <p className={`msg-preview ${hasUnread ? "msg-preview-bold" : ""}`}>
                            {last.from_user_id === user._id && (
                              <span style={{ opacity: 0.7, marginRight: 2, flexShrink: 0 }}>You:</span>
                            )}
                            {last.message_type === "image" ? (
                              <><ImageIcon size={13} style={{ flexShrink: 0 }} />Photo</>
                            ) : last.message_type === "audio" ? (
                              <><Mic size={13} style={{ flexShrink: 0 }} />Voice message</>
                            ) : (
                              <span className="msg-preview-text">
                                {last.text?.substring(0, 28) + (last.text?.length > 28 ? "…" : "")}
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <span className="msg-unread-badge">{unreadCount}</span>
                      )}
                    </div>
                  );
                })}

              {!loading && filteredConnections.length === 0 && (
                <div className="msg-empty">
                  {failedToFetch ? (
                    <div className="msg-error-wrap">
                      <span className="msg-error-icon"><MdNetworkLocked /></span>
                      <p className="msg-error-text">No connection. Check your internet and try again.</p>
                    </div>
                  ) : searchTerm ? (
                    <>
                      <div className="msg-empty-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </div>
                      <p className="msg-empty-title">No results</p>
                      <p className="msg-empty-text">No conversations match "{searchTerm}"</p>
                    </>
                  ) : (
                    <>
                      <div className="msg-empty-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <p className="msg-empty-title">No messages yet</p>
                      <p className="msg-empty-text">Connect with people to start conversations.</p>
                      {conversations.length === 0 && (
                        <button onClick={() => navigate("/discover")} className="msg-cta-btn">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                          </svg>
                          Find People
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Chat box ── */}
      <div className="msg-chat-col">
        {activeChatId ? (
          <div style={{ width: "100%", height: "100%", minWidth: 0 }}>
            <ChatBox userId={activeChatId} />
          </div>
        ) : (
          <div className="esp">
            <div className="grid-lines" />
            <div className="orb o1" /><div className="orb o2" />
            <div className="orb o3" /><div className="orb o4" />
            <div className="esi">
              <div className="ring-wrap">
                <div className="pulse-ring" /><div className="pulse-ring" /><div className="pulse-ring" />
                <div className="orbit orbit1" /><div className="orbit orbit2" />
                <div className="odot odot1" /><div className="odot odot2" /><div className="odot odot3" />
                <div className="ring-bg">
                  <svg className="icon-svg" width="34" height="34" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
              </div>
              <p className="es-title">Open a <span className="es-hi">conversation</span></p>
              <p className="es-sub">Select any chat on the left — your messages load instantly, right here.</p>
              <div className="tdots"><span /><span /><span /></div>
              <div className="es-div" />
              <div className="es-pills">
                <div className="pill">💬 Text</div>
                <div className="pill">🖼 Images</div>
                <div className="pill">🎤 Voice</div>
                <div className="pill">📞 Audio call</div>
                <div className="pill">📹 Video call</div>
                <div className="pill">↩️ Replies</div>
                <div className="pill">🔍 Search history</div>
              </div>
              <div className="es-div" />
              <div className="es-stats">
                <div className="es-stat"><span className="es-stat-num">⚡</span><span className="es-stat-lbl">Instant delivery</span></div>
                <div className="es-stat"><span className="es-stat-num">🔔</span><span className="es-stat-lbl">Live updates</span></div>
                <div className="es-stat"><span className="es-stat-num">🔒</span><span className="es-stat-lbl">Private &amp; secure</span></div>
              </div>
              <div className="tip-box">
                <div className="tip-line"><span className="tip-dot" />Unread messages always rise to the top</div>
                <div className="tip-line"><span className="tip-dot" />Use search to find any person instantly</div>
                <div className="tip-line"><span className="tip-dot" />Long press a message to reply or react</div>
              </div>
              <div className="es-badge">
                <span className="es-badge-dot" />
                End-to-end private — only you and the other person can see this
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Messages;