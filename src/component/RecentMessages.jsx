import React, { useState, useEffect } from "react";
import { Image as ImageIcon, Mic, FileText } from "lucide-react";
import moment from "moment";
import axios from "../utils/axiosBase";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/useSocket";
import { useMessageContext } from "../context/MessageContext";
import { usePipModal } from "../context/PipModalContext";
import ProfileAvatar from "./shared/ProfileAvatar";
import RecentMessagesSkeleton from "./skeleton/RecentMessagesSkeleton";

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

  const { unreadMessages, clearUnread } = useMessageContext();
  const { user } = useAuth();
  const { socket } = useSocket();

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
  const fetchChatHistory = async (userId) => {
    console.group("📡 [RecentMessages] fetchChatHistory()");
    console.log("→ Entering fetchChatHistory()", { userId, currentUserId: user._id });
    try {
      console.log("⏳ Setting chatLoading = true");
      setChatLoading(true);

      const url = `/api/chat/room?user1=${user._id}&user2=${userId}`;
      console.log("🌐 Fetching:", url);
      const res = await axios.get(url);
      console.log("✅ API Response received:", { status: res.status, data: res.data });

      if (res.data?.room) {
        console.log("📋 Setting chatId to:", res.data.room._id);
        setChatId(res.data.room._id);
      } else {
        console.warn("⚠️ No room found in response!");
      }

      const messages = res.data?.messages || [];
      console.log("📋 Setting activeChatHistory with", messages.length, "messages");
      setActiveChatHistory(messages);
    } catch (err) {
      console.error("❌ Error fetching history:", err);
      console.error("  Error message:", err.message);
      console.error("  Error response:", err.response?.data);
    } finally {
      console.log("⏳ Setting chatLoading = false");
      setChatLoading(false);
      console.log("✅ fetchChatHistory() complete");
      console.groupEnd();
    }
  };

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

  const handleUserClick = (usr) => {
    console.group("🖱️ [RecentMessages] handleUserClick()");
    console.log("→ Entering handleUserClick()", { userId: usr._id, username: usr.username });
    console.log("📋 User object:", usr);

    console.log("📞 Step 1/3: Calling openPipModal(", usr._id, ")");
    openPipModal(usr._id);

    console.log("📞 Step 2/3: Calling fetchChatHistory(", usr._id, ")");
    fetchChatHistory(usr._id);

    console.log("📞 Step 3/3: Calling clearUnread(", usr._id, ")");
    clearUnread(usr._id);

    console.log("✅ handleUserClick() complete — all 3 calls dispatched");
    console.groupEnd();
  };

  return (
    <>
      {connections.length > 0 && (
        <div className="w-full bg-white rounded-xl shadow-md p-0 m-0">
          <h3 className="font-semibold text-sm px-2 pt-2 mb-2">Recent Messages</h3>
          <div className="flex flex-col max-h-[60vh] overflow-y-auto ">
            {loading ? <RecentMessagesSkeleton /> : connections.map((usr, index) => {
              const last = lastMessages[usr._id];
              const unread = unreadMessages[usr._id]?.length || 0;
              
              // Check if this is the first unread message in the list
              const isFirstUnread = unread > 0 && index === connections.findIndex(u => (unreadMessages[u._id]?.length || 0) > 0);
              
              return (
                <div
                  key={usr._id}
                  onClick={(e) => {
                    console.group("🖱️ [RecentMessages] Click Event Fired");
                    console.log("→ Click event triggered on recent message item");
                    console.log("📋 Clicked element:", e.currentTarget);
                    console.log("  id:", e.currentTarget.id || "(none)");
                    console.log("  classes:", e.currentTarget.className);
                    console.log("  data attributes:", Object.fromEntries(
                      [...e.currentTarget.attributes]
                        .filter(a => a.name.startsWith("data-"))
                        .map(a => [a.name, a.value])
                    ));
                    console.log("📋 Target user:", { _id: usr._id, username: usr.username });
                    handleUserClick(usr);
                    console.groupEnd();
                  }}
                  className={`flex gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-200 ${
                    isFirstUnread 
                      ? "bg-red-50 border-l-4 border-red-500 hover:bg-red-100" 
                      : "hover:bg-[var(--hover-subtle-bg)] hover:shadow-sm"
                  }`}
                >
                  {/* Profile Avatar */}
                  <ProfileAvatar user={usr} size={44} />

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Top row: username and timestamp */}
                    <div className="flex justify-between items-center">
                      <span
                        className={`flex items-center gap-1 truncate text-xs min-w-0 ${
                          isFirstUnread ? "font-semibold text-red-600" : ""
                        }`}
                        style={!isFirstUnread ? { color: "var(--text-secondary)" } : {}}
                      >
                        @{usr.username}
                      </span>
                      {last && (
                        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                          {moment(last.createdAt).format("h:mm A")}
                        </span>
                      )}
                    </div>

                    {/* Bottom row: last message + unread */}
                    <div className="flex justify-between -mt-3 items-center mt-1">
                      <span
                        className="flex items-center gap-1 truncate text-xs flex items-start"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {!last && "Click to chat"}

                        {last?.type === "text" && (
                          <div className="flex flex-col gap-0.5 w-full">
                            <span className="truncate w-full">{getDisplayText(last.text, last._id)}</span>
                            {shouldShowReadMore(last.text) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMessageExpansion(last._id);
                                }}
                                className="flex items-center gap-1 text-[10px] font-semibold opacity-70 hover:opacity-100 transition-opacity"
                                style={{ color: "var(--primary)" }}
                              >
                                {expandedMessages.has(last._id) ? "Less" : "More"}
                              </button>
                            )}
                          </div>
                        )}

                        {last?.type === "image" && (
                          <>
                            <ImageIcon size={12} />
                            <span>Photo</span>
                          </>
                        )}

                        {last?.type === "audio" && (
                          <>
                            <Mic size={12} />
                            <span>Voice message</span>
                          </>
                        )}

                        {last?.type === "file" && (
                          <>
                            <FileText size={12} />
                            <span>Document</span>
                          </>
                        )}
                      </span>

                      {unread > 0 && (
                        <span
                          className={`flex items-center justify-center rounded-full w-5 h-5 text-[10px] font-bold ${
                            isFirstUnread ? "animate-pulse" : ""
                          }`}
                          style={{
                            background: isFirstUnread ? "#ef4444" : "var(--primary)",
                            color: "var(--white)",
                          }}
                        >
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default RecentMessages;
