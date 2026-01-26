import React, { useState, useEffect, useRef } from "react";
import ChatBox from "../pages/ChatBox.jsx";
import { useNavigate } from "react-router-dom";
import { Eye, MessageSquare, ImageIcon, Mic } from "lucide-react";
import axios from "../utils/axiosBase";
import BackButton from "../component/shared/BackButton";
import ProfileAvatar from "../component/shared/ProfileAvatar";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/useSocket";
import { useMessageContext } from "../context/MessageContext";
import RightSidebar from "../component/RightSidebar";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";

const Messages = () => {

  const [activeChatId, setActiveChatId] = useState(null);
  
  // 1. IMMEDIATE LOAD: Initialize state directly from localStorage
  const [connections, setConnections] = useState(() => {
    const cached = localStorage.getItem("springsconnect_connections");
    return cached ? JSON.parse(cached) : [];
  });
  const [syncProgress, setSyncProgress] = useState(0);
const [syncing, setSyncing] = useState(false); // optional, to show/hide the progress bar


  const [lastMessages, setLastMessages] = useState(() => {
    const savedLast = localStorage.getItem("lastMessages");
    return savedLast ? JSON.parse(savedLast) : {};
  });

  // Only show loading skeleton if we have NO cached data at all
  const [loading, setLoading] = useState(connections.length === 0);
  
  const [unreadMap, setUnreadMap] = useState({});
  const { user, sponsors } = useAuth();
  const { unreadMessages, addUnread, clearUnread, getTotalUnread } = useMessageContext();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const processedMessages = useRef(new Set());

  /*** 1️⃣ Load cached data on mount ***/
  useEffect(() => {
    const cachedConnections = localStorage.getItem("springsconnect_connections");
    const cachedMessages = localStorage.getItem("lastMessages");
    const cachedUnread = localStorage.getItem("unreadMap");

    if (cachedConnections) setConnections(JSON.parse(cachedConnections));
    if (cachedMessages) setLastMessages(JSON.parse(cachedMessages));
    if (cachedUnread) setUnreadMap(JSON.parse(cachedUnread));

    setLoading(false); // only stop skeleton after initial render
  }, []);

 const syncData = async () => {
  try {
    setSyncing(true);
    setSyncProgress(20); // started

    // Fetch both connections and last messages
    const [connRes, msgRes] = await Promise.allSettled([
      axios.get("api/user/connections"),
      axios.get("api/messages/last")
    ]);

    setSyncProgress(50); // mid-progress

    // Sync Connections
    if (connRes.status === 'fulfilled') {
      const data = connRes.value.data.data;
      const acceptedConnections = data?.connections?.length ? data.connections : (data?.followers || []);
      
      setConnections(acceptedConnections);
      localStorage.setItem("springsconnect_connections", JSON.stringify(acceptedConnections));
    }

    setSyncProgress(70); // more progress

    // Sync Last Messages
    if (msgRes.status === 'fulfilled' && msgRes.value.data.success) {
      const incomingMsgs = msgRes.value.data.data;
      setLastMessages(prev => {
        const merged = { ...prev };
        let hasChange = false;

        Object.keys(incomingMsgs).forEach(id => {
          const current = prev[id];
          const incoming = incomingMsgs[id];

          if (!current || new Date(incoming.createdAt) > new Date(current.createdAt)) {
            merged[id] = incoming;
            hasChange = true;
          }
        });

        if (hasChange) localStorage.setItem("lastMessages", JSON.stringify(merged));
        return merged;
      });
    }

    setSyncProgress(100); // done
  } catch (err) {
    console.error("Background sync failed", err);
  } finally {
    setSyncing(false);
  }
};


  useEffect(() => {
    syncData();
    // Optional: Refresh background data every 60 seconds
    const interval = setInterval(syncData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Keep existing Socket and Event listener logic below...
  useEffect(() => {
    const handleSelfMessage = (e) => {
      const detail = e?.detail;
      if (!detail) return;

      const { to_user_id, message } = detail;
      if (!to_user_id) return;

      const type = message?.message_type || "text";
      const text = type === "image" ? "[Image]" : type === "audio" ? "[Audio]" : message?.text || "[media]";


      setLastMessages((prev) => ({
        ...prev,
        [to_user_id]: {
          text,
          createdAt: new Date().toISOString(),
          type,
          senderId: user._id,
        },
      }));
    };
    window.addEventListener("selfMessageSent", handleSelfMessage);
    return () => window.removeEventListener("selfMessageSent", handleSelfMessage);
  }, [user._id]);


  /*** 6️⃣ Central processor for incoming messages ***/
  const processIncoming = ({ from_user_id, to_user_id, message }) => {
    if (!message) return;

    const otherUserId = from_user_id === user._id ? to_user_id : from_user_id;
    if (!otherUserId) return;

    const type = message.message_type || "text";
    const text =
      type === "image" ? "[Image]" : type === "audio" ? "[Audio]" : message.text || "[media]";
    const createdAt = message.createdAt || new Date().toISOString();
    const messageKey = message._id || `${otherUserId}_${createdAt}`;

    if (processedMessages.current.has(messageKey)) return;
    processedMessages.current.add(messageKey);

    setLastMessages((prev) => {
      const prevTime = new Date(prev[otherUserId]?.createdAt || 0).getTime();
      const newTime = new Date(createdAt).getTime();
      if (newTime >= prevTime) {
        const updated = { ...prev, [otherUserId]: { text, createdAt, type, senderId: from_user_id } };
        localStorage.setItem("lastMessages", JSON.stringify(updated));
        return updated;
      }
      return prev;
    });

    if (from_user_id !== user._id) {
      addUnread(otherUserId, { text, createdAt });
      setUnreadMap((prev) => ({ ...prev, [otherUserId]: (prev[otherUserId] || 0) + 1 }));
    }

    if (processedMessages.current.size > 200) {
      processedMessages.current = new Set(Array.from(processedMessages.current).slice(-100));
    }
  };

  /*** 7️⃣ Socket events ***/
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => processIncoming(data);
    const handleMessageRead = ({ chatId, from_user_id }) => {
      const target = from_user_id || chatId;
      setUnreadMap((prev) => {
        const updated = { ...prev };
        delete updated[target];
        return updated;
      });
      clearUnread(target);
    };

    socket.off("newMessageAlert");
    socket.off("newMessageNotification");
    socket.off("messageRead");

    socket.on("newMessageAlert", handleNewMessage);
    socket.on("newMessageNotification", handleNewMessage);
    socket.on("messageRead", handleMessageRead);

    const handleFrontendAlert = (e) => {
      const detail = e?.detail;
      if (!detail) return;
      processIncoming({
        from_user_id: detail.from_user_id || detail.from,
        to_user_id: detail.to_user_id || detail.to,
        message: detail.message || detail,
      });
    };

    window.addEventListener("newMessageAlert", handleFrontendAlert);

    return () => {
      socket.off("newMessageAlert", handleNewMessage);
      socket.off("newMessageNotification", handleNewMessage);
      socket.off("messageRead", handleMessageRead);
      window.removeEventListener("newMessageAlert", handleFrontendAlert);
    };
  }, [socket, addUnread, clearUnread, user._id]);

  /*** 8️⃣ Sorting connections by last message ***/
 const getLastMessageTime = (userId) => {
    const msg = lastMessages[userId];
    return msg ? new Date(msg.createdAt).getTime() : 0;
  };
  const sortedConnections = [...connections].sort((a, b) => {
    return getLastMessageTime(b._id) - getLastMessageTime(a._id);
  });

  /*** 9️⃣ Open chat ***/
  const handleOpenChat = (userId) => {
    clearUnread(userId);
    setUnreadMap((prev) => {
      const updated = { ...prev };
      delete updated[userId];
      localStorage.setItem("unreadMap", JSON.stringify(updated));
      return updated;
    });
    socket?.emit("markAsRead", { userId });
    setActiveChatId(userId);
    if (window.innerWidth < 768) navigate(`/chatbox/${userId}`);
  };

  const borderColor = `rgba(${255 - Math.floor((syncProgress / 100) * 255)}, ${Math.floor(
    (syncProgress / 100) * 255
  )}, 50, 1)`;

  return (
<div className="min-h-screen w-full flex bg-slate-50 overflow-hidden relative">
  {/* LEFT: Conversation list */}
  <div className="w-full md:w-[40%] lg:w-[35%] p-6 overflow-y-auto border-r">
    <BackButton />

    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1 title">
        Messages
      </h1>
      <p className="text-slate-600">People you’ve connected with</p>
    </div>

    {/* 🔄 Sync progress bar */}
    {syncing && (
      <div
        className="fixed top-14 z-50 left-1/2 transform -translate-x-1/2 w-11/12 max-w-xl h-4 rounded-full overflow-hidden border"
        style={{
          borderColor: "var(--input-border)",
          backgroundColor: "var(--hover-subtle-bg)",
        }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${syncProgress}%`,
            background:
              "linear-gradient(to right, var(--primary), var(--btn-hover))",
          }}
        />
      </div>
    )}

    <div className="flex flex-col gap-3">
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 p-4 bg-white rounded shadow animate-pulse"
          >
            <div className="w-12 h-12 bg-gray-300 rounded-full" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-300 rounded w-1/2" />
              <div className="h-3 bg-gray-300 rounded w-1/3" />
            </div>
          </div>
        ))
      ) : sortedConnections.length > 0 ? (
        sortedConnections.map((usr) => {
          const last = lastMessages[usr._id];
          const unreadCount = unreadMap[usr._id] || 0;
          const isActive = activeChatId === usr._id;

          return (
            <div
              key={usr._id}
              onClick={() => handleOpenChat(usr._id)}
              className={`flex gap-5 px-3 py-2 rounded-md items-center cursor-pointer transition
                ${
                  isActive
                    ? "bg-violet-100"
                    : "bg-white hover:bg-slate-100"
                }`}
            >
              <ProfileAvatar
                user={{
                  name: usr.name || "User",
                  profilePicUrl: usr.profilePicUrl,
                  profilePicBackground: usr.profilePicBackground,
                }}
                size={48}
              />

              <div className="flex-1 min-w-0">
                <p className="text-[var(--primary)] truncate">
                  @{usr.username}
                </p>
                <p className="font-medium text-slate-700 truncate">
                  {usr.full_name}
                </p>

                {last && (
                  <p
                    className={`text-sm truncate ${
                      unreadCount > 0
                        ? "text-[var(--error)]"
                        : "text-slate-600"
                    }`}
                  >
                    {last.senderId === user._id ? "You: " : ""}
                    {last.type === "image"
                      ? "📷 Image"
                      : last.type === "audio"
                      ? "🎤 Audio"
                      : last.text}
                  </p>
                )}

                {unreadCount > 0 && (
                  <span className="inline-block mt-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-center text-slate-500">
          No accepted connections yet.
        </p>
      )}
    </div>
  </div>

  {/* RIGHT: Chat box (desktop only) */}
  <div className="hidden md:flex flex-1 bg-white">
    {activeChatId ? (
      <ChatBox userId={activeChatId} />
    ) : (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        Select a conversation
      </div>
    )}
  </div>

  {/* RIGHT SIDEBAR */}
  <RightSidebar sponsors={sponsors} loading={!sponsors} />
  <MediumSidebarToggle sponsors={sponsors} />
</div>
  );
};

export default Messages;
