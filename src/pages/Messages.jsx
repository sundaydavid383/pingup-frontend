import React, { useState, useEffect, useRef } from "react";
import ChatBox from "../pages/ChatBox.jsx";
import { useNavigate } from "react-router-dom";
import { Eye, MessageSquare, ImageIcon, Mic } from "lucide-react";
import axios from "../utils/axiosBase";
import BackButton from "../component/shared/BackButton";
import ProfileAvatar from "../component/shared/ProfileAvatar";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
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

  const [lastMessages, setLastMessages] = useState(() => {
    const savedLast = localStorage.getItem("lastMessages");
    return savedLast ? JSON.parse(savedLast) : {};
  });

  // Only show loading skeleton if we have NO cached data at all
  const [loading, setLoading] = useState(connections.length === 0);
  
  const [unreadMap, setUnreadMap] = useState({});
  const { user } = useAuth();
  const { unreadMessages, addUnread, clearUnread, getTotalUnread } = useMessageContext();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const processedMessages = useRef(new Set());

  // Load unread counts from localStorage
  useEffect(() => {
    const savedUnread = localStorage.getItem("unreadMap");
    if (savedUnread) setUnreadMap(JSON.parse(savedUnread));
  }, []);

  // 2. BACKGROUND SYNC LOGIC
  const syncData = async () => {
    try {
      // Fetch both connections and last messages in parallel
      const [connRes, msgRes] = await Promise.allSettled([
        axios.get("api/user/connections"),
        axios.get("api/messages/last")
      ]);

      // Sync Connections
      if (connRes.status === 'fulfilled') {
        const data = connRes.value.data.data;
        const acceptedConnections = data?.connections?.length ? data.connections : (data?.followers || []);
        
        setConnections(acceptedConnections);
        localStorage.setItem("springsconnect_connections", JSON.stringify(acceptedConnections));
      }

      // Sync Last Messages (The "WhatsApp" logic: only update if newer)
      if (msgRes.status === 'fulfilled' && msgRes.value.data.success) {
        const incomingMsgs = msgRes.value.data.data;
        
        setLastMessages(prev => {
          const merged = { ...prev };
          let hasChange = false;

          Object.keys(incomingMsgs).forEach(id => {
            const current = prev[id];
            const incoming = incomingMsgs[id];

            // Update if entry is missing OR the incoming message is newer than local cache
            if (!current || new Date(incoming.createdAt) > new Date(current.createdAt)) {
              merged[id] = incoming;
              hasChange = true;
            }
          });

          if (hasChange) {
            localStorage.setItem("lastMessages", JSON.stringify(merged));
            return merged;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Background sync failed", err);
    } finally {
      setLoading(false); // Hide skeleton if it was visible
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

  // (Rest of your processIncoming, Socket useEffect, and render logic remains the same)
  // Ensure sortedConnections uses the current lastMessages state for ordering
  const getLastMessageTime = (userId) => {
    const msg = lastMessages[userId];
    return msg ? new Date(msg.createdAt).getTime() : 0;
  };

  const sortedConnections = [...connections].sort((a, b) => {
    return getLastMessageTime(b._id) - getLastMessageTime(a._id);
  });

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

  return (
    <div className="min-h-screen w-full flex bg-slate-50 overflow-hidden">
        <div className="w-full md:w-[40%] lg:w-[35%] p-6 overflow-y-auto border-r">
            <BackButton />
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-1 title">Messages</h1>
                <p className="text-slate-600">People you’ve connected with</p>
            </div>

            <div className="flex flex-col gap-3">
                {loading ? (
                    // This now only shows on very first visit
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-white rounded shadow animate-pulse">
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
                                className={`flex flex-wrap gap-5 px-3 py-2 rounded-md items-center overflow-hidden cursor-pointer transition
                                ${isActive ? "bg-violet-100" : "bg-white hover:bg-slate-100"}`}
                            >
                                <div onClick={(e) => { e.stopPropagation(); navigate(`/profile/${usr._id}`); }} className="cursor-pointer">
                                    <ProfileAvatar
                                        user={{
                                            name: usr.name || "User",
                                            profilePicUrl: usr.profilePicUrl,
                                            profilePicBackground: usr.profilePicBackground,
                                        }}
                                        size={48}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[var(--primary)] truncate">@{usr.username}</p>
                                    <p className="font-medium text-slate-700 truncate">{usr.full_name}</p>
                                    {last && (
                                        <p className={`text-sm flex items-center gap-1 truncate ${unreadCount > 0 ? "text-[var(--error)]" : "text-slate-600"}`}>
                                            <span className={unreadCount > 0 ? "text-[var(--error)]" : "text-slate-500"}>
                                                {last.senderId === user._id ? "You:" : "Last:"}
                                            </span>
                                            {last.type === "image" ? <><ImageIcon className="w-4 h-4" /> Image</> 
                                            : last.type === "audio" ? <><Mic className="w-4 h-4" /> Audio</> 
                                            : <span className="truncate">{last.text}</span>}
                                        </p>
                                    )}
                                    {unreadCount > 0 && (
                                        <span className="inline-block mt-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-center text-slate-500">No accepted connections yet.</p>
                )}
            </div>
        </div>
        <div className="hidden md:flex flex-1 bg-white">
  {activeChatId ? (
    <ChatBox userId={activeChatId} />
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-slate-400">
      <div className="chat-loader" />
      <span className="text-sm tracking-wide">
        Select a conversation
      </span>
    </div>
  )}
</div>

    </div>
  );
};

export default Messages;