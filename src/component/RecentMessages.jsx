import React, { useState, useEffect, useCallback } from "react";
import { Image as ImageIcon, Mic, FileText } from "lucide-react";
import moment from "moment";
import axios from "../utils/axiosBase";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/useSocket";
import { usePipModal } from "../context/PipModalContext";
import ProfileAvatar from "./shared/ProfileAvatar";
import RecentMessagesSkeleton from "./skeleton/RecentMessagesSkeleton";
import { useMessageSeen } from "../../MessageSeenContext";
import "../styles/recentmessages.css";

const RecentMessages = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastMessages, setLastMessages] = useState({});

  // Use PipModal context - state is managed by context now
  const {
    openPipModal,
    setActiveChatHistory,
    setChatId,
    setChatLoading,
  } = usePipModal();

const { conversations, unreadCountsMap, clearUnreadForChat } = useMessageSeen();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Helper function to get conversation ID from userId
  const getConversationId = (userId) => {
    const convo = conversations.find(
      c => c.otherUser?._id?.toString() === userId?.toString()
    );
    return convo?._id;
  };


  // Read-more state for recent messages
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const CHARACTER_THRESHOLD = 100;

  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const getDisplayText = (text, messageId) => {
    if (!text || text.length <= CHARACTER_THRESHOLD) return text;
    if (expandedMessages.has(messageId)) return text;
    const truncated = text.substring(0, CHARACTER_THRESHOLD);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > -1 ? truncated.substring(0, lastSpace) : truncated) + '...';
  };

  const shouldShowReadMore = (text) => {
    return text && text.length > CHARACTER_THRESHOLD;
  };

  // Fetch chat history when clicking on a user
  const fetchChatHistory = useCallback(async (userId) => {
    if (!user?._id) {
      return;
    }

    setChatLoading(true);

    try {
      const url = `/api/chat/room?user1=${user._id}&user2=${userId}`;
      const res = await axios.get(url);

      if (res.data?.room) {
        setChatId(res.data.room._id);
      }

      const messages = res.data?.messages || [];
      setActiveChatHistory(messages);
    } catch (err) {
      console.error("[RecentMessages] fetchChatHistory error", err);
    } finally {
      setChatLoading(false);
    }
  }, [user?._id, setChatLoading, setChatId, setActiveChatHistory]);

  // Initial Load
  useEffect(() => {
    const fetchData = async () => {
      console.group("📦 [RecentMessages] Initial data fetch");
      console.log("→ Starting initial load...");
      setLoading(true);
      try {
        console.log("🌐 Fetching connections and last messages in parallel...");
        const [connRes, msgRes] = await Promise.all([
          axios.get("api/user/connections"),
          axios.get("api/messages/last")
        ]);
        console.log("✅ Connections response:", { count: connRes.data.data?.connections?.length || connRes.data.data?.followers?.length });
        console.log("✅ Last messages response:", { success: msgRes.data.success, count: Object.keys(msgRes.data.data || {}).length });
        setConnections(connRes.data.data?.connections || connRes.data.data?.followers || []);
        if (msgRes.data.success) setLastMessages(msgRes.data.data);
      } catch (err) {
        console.error("❌ Initial load error:", err);
      }
      finally {
        setLoading(false);
        console.log("✅ Initial load complete");
        console.groupEnd();
      }
    };
    fetchData();
  }, []);

  // Central Socket Listener (Updates both List and PiP)
  useEffect(() => {
    if (!socket) {
      console.warn("⚠️ [RecentMessages] Socket is null — skipping listener setup");
      return;
    }
    console.log("🔌 [RecentMessages] Setting up newMessageNotification listener");

    const handleIncoming = (data) => {
      console.group("📨 [RecentMessages] newMessageNotification received");
      console.log("→ Incoming data:", data);
      const { from_user_id, to_user_id, message } = data;
      const otherId = from_user_id === user._id ? to_user_id : from_user_id;
      console.log("  from:", from_user_id, "to:", to_user_id, "otherId:", otherId);

      // Update the recent list preview
      setLastMessages(prev => ({
        ...prev,
        [otherId]: { ...message, senderId: from_user_id }
      }));
      console.log("  ✓ Updated lastMessages for", otherId);
      console.groupEnd();
    };

    socket.on("newMessageNotification", handleIncoming);
    return () => {
      console.log("🔌 [RecentMessages] Cleaning up newMessageNotification listener");
      socket.off("newMessageNotification", handleIncoming);
    };
  }, [socket, user._id]);

const handleUserClick = useCallback((usr) => {
  // Find convo inline here too, or receive convoId as a param
  const convo = conversations.find(
    (c) => c.otherUser?._id?.toString() === usr._id?.toString()
  );
  const convoId = convo?._id;

  openPipModal(usr._id);
  fetchChatHistory(usr._id);
  if (convoId) clearUnreadForChat(convoId);
}, [conversations, openPipModal, fetchChatHistory, clearUnreadForChat]);

const sortedConnections = React.useMemo(() => {
  if (!connections || connections.length === 0) return [];

  const arr = connections.map((usr) => {
    // Inline the lookup so it always uses the fresh `conversations` snapshot
    const convo = conversations.find(
      (c) => c.otherUser?._id?.toString() === usr._id?.toString()
    );
    const convoId = convo?._id;
    const unread = convoId ? (unreadCountsMap[convoId] || 0) : 0;
    const last = lastMessages[usr._id];
    const priority = unread > 0 ? 0 : 1;
    const timestamp = last?.createdAt
      ? new Date(last.createdAt).getTime()
      : 0;

    return { usr, priority, timestamp, convoId, unread };
  });

  arr.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.timestamp - a.timestamp;
  });

  return arr; // keep metadata attached for use in render
}, [connections, lastMessages, conversations, unreadCountsMap]);
return (
    <>
      <div className="rm-root">

        {/* Header */}
        <div className="rm-header">
          <span className="rm-title">
            <span className="rm-title-pulse" />
            Recent Messages
          </span>
        </div>
        <hr className="rm-header-rule" />

        {/* List */}
        <div className="rm-list">
          {loading ? (
            <RecentMessagesSkeleton />
          ) : connections.length === 0 ? (
            <div className="rm-empty">
              <span className="rm-empty-icon">💬</span>
              <p className="rm-empty-text">No messages yet</p>
            </div>
          ) : (
            sortedConnections.map(({ usr, convoId, unread }, index) => {
              const last = lastMessages[usr._id];

              const firstUnreadIndex = sortedConnections.findIndex(
                (item) => item.unread > 0
              );
              const isFirstUnread = unread > 0 && index === firstUnreadIndex;

              return (
                <React.Fragment key={usr._id}>
                  {/* Unread divider label — only before the first unread */}
                  {isFirstUnread && (
                    <div className="rm-unread-label">Unread</div>
                  )}

                  <div
                    onClick={() => {
                      openPipModal(usr._id);
                      fetchChatHistory(usr._id);
                      handleUserClick(usr);
                      if (convoId) clearUnreadForChat(convoId);
                    }}
                    className={`rm-row ${isFirstUnread ? "rm-row--unread" : ""}`}
                  >
                    {/* Avatar */}
                    <div className="rm-avatar-wrap">
                      <ProfileAvatar user={usr} size={40} />
                    </div>

                    {/* Content */}
                    <div className="rm-content">

                      {/* Top: username + time */}
                      <div className="rm-top-row">
                        <span className="rm-username">@{usr.username}</span>
                        {last && (
                          <span className="rm-time">
                            {moment(last.createdAt).format("h:mm A")}
                          </span>
                        )}
                      </div>

                      {/* Bottom: preview + badge */}
                      <div className="rm-bottom-row">
                        <span className="rm-preview">
                          {!last && (
                            <span className="rm-preview-text" style={{ fontStyle: "italic", opacity: 0.6 }}>
                              Click to chat
                            </span>
                          )}

                          {last?.type === "text" && (
                            <span className="flex flex-col w-full min-w-0">
                              <span className="rm-preview-text">
                                {getDisplayText(last.text, last._id)}
                              </span>
                              {shouldShowReadMore(last.text) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMessageExpansion(last._id);
                                  }}
                                  className="rm-read-more"
                                >
                                  {expandedMessages.has(last._id) ? "Less ↑" : "More ↓"}
                                </button>
                              )}
                            </span>
                          )}

                          {last?.type === "image" && (
                            <>
                              <ImageIcon size={12} className="rm-preview-icon" />
                              <span className="rm-preview-text">Photo</span>
                            </>
                          )}

                          {last?.type === "audio" && (
                            <>
                              <Mic size={12} className="rm-preview-icon" />
                              <span className="rm-preview-text">Voice message</span>
                            </>
                          )}

                          {last?.type === "file" && (
                            <>
                              <FileText size={12} className="rm-preview-icon" />
                              <span className="rm-preview-text">Document</span>
                            </>
                          )}
                        </span>

                        {unread > 0 && (
                          <span className={`rm-badge ${isFirstUnread ? "rm-badge--unread" : "rm-badge--normal"}`}>
                            {unread}
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default RecentMessages;
