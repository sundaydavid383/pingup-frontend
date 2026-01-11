import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Mic, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import axios from "../utils/axiosBase";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useMessageContext } from "../context/MessageContext";
import ProfileAvatar from "./shared/ProfileAvatar";
import RecentMessagesSkeleton from "./skeleton/RecentMessagesSkeleton";

const RecentMessages = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadMap, setUnreadMap] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const { user } = useAuth();
  const { unreadMessages, addUnread, clearUnread } = useMessageContext();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const processedMessages = useRef(new Set());

  // Load unread counts from localStorage
  useEffect(() => {
    const savedUnread = localStorage.getItem("unreadMap");
    if (savedUnread) setUnreadMap(JSON.parse(savedUnread));
  }, []);

  useEffect(() => {
    if (Object.keys(unreadMap).length > 0) {
      localStorage.setItem("unreadMap", JSON.stringify(unreadMap));
    } else {
      localStorage.removeItem("unreadMap");
    }
  }, [unreadMap]);

  // Load last messages from localStorage
  useEffect(() => {
    const savedLast = localStorage.getItem("lastMessages");
    if (savedLast) setLastMessages(JSON.parse(savedLast));
  }, []);

  useEffect(() => {
    if (Object.keys(lastMessages).length > 0) {
      localStorage.setItem("lastMessages", JSON.stringify(lastMessages));
    } else {
      localStorage.removeItem("lastMessages");
    }
  }, [lastMessages]);

  // Fetch connections
  const fetchConnections = async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    try {
      const res = await axios.get("api/user/connections", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      const acceptedConnections = res.data.data?.connections?.length
        ? res.data.data.connections
        : res.data.data?.followers || [];
      setConnections(acceptedConnections);
    } catch (err) {
      console.error("Error fetching connections:", err);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch last messages from backend
  const fetchLastMessages = async () => {
    try {
      const res = await axios.get("api/messages/last", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (res.data.success && res.data.data) {
        setLastMessages(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching last messages:", err);
    }
  };

  useEffect(() => {
    fetchConnections();
    fetchLastMessages();
  }, []);

  // Sync global unread messages
  useEffect(() => {
    const initial = {};
    Object.keys(unreadMessages || {}).forEach((uid) => {
      initial[uid] = unreadMessages[uid]?.length || 0;
    });
    setUnreadMap(initial);
  }, [unreadMessages]);

// Handle messages sent by self
useEffect(() => {
  const handleSelfMessage = (e) => {
    const detail = e?.detail;
    if (!detail) return;
    const { to_user_id, message } = detail;
    if (!to_user_id || !message) return;

    const text = message.text || "[media]";
    const createdAt = message.createdAt || new Date().toISOString();

    // Update lastMessages but do NOT touch unreadMap
    setLastMessages((prev) => ({
      ...prev,
      [to_user_id]: { text, createdAt, type: message.message_type, senderId: user._id },
    }));
  };

  window.addEventListener("selfMessageSent", handleSelfMessage);
  return () => window.removeEventListener("selfMessageSent", handleSelfMessage);
}, [user._id]);


  // Central processor for incoming messages
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
        return {
          ...prev,
          [otherUserId]: { text, createdAt, type, senderId: from_user_id },
        };
      }
      return prev;
    });

    if (from_user_id !== user._id) {
      addUnread(otherUserId, { text, createdAt });
      setUnreadMap((prev) => ({
        ...prev,
        [otherUserId]: (prev[otherUserId] || 0) + 1,
      }));
    }

    if (processedMessages.current.size > 200) {
      processedMessages.current = new Set(Array.from(processedMessages.current).slice(-100));
    }
  };

  // Socket setup
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

  const sortedConnections = [...connections].sort((a, b) => {
    const aTime = new Date(lastMessages[a._id]?.createdAt || 0).getTime();
    const bTime = new Date(lastMessages[b._id]?.createdAt || 0).getTime();
    return bTime - aTime;
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
    navigate(`/chatbox/${userId}`);
  };

  return (
    <div className="bg-white max-w-xs mt-4 min-h-25 rounded-md shadow text-slate-800">
      <h3 className="font-semibold text-sm text-slate-800 mb-3 px-2 pt-2">
        Recent Messages
      </h3>

      <div className="flex flex-col max-h-[45vh] overflow-y-scroll">
        {loading ? (
         <RecentMessagesSkeleton />
        ) : sortedConnections.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-3">No recent messages yet.</p>
        ) : (
          sortedConnections.map((usr) => {
            const last = lastMessages[usr._id];
            const unreadCount = unreadMap[usr._id] || 0;

            return (
              <div
                key={usr._id}
                className="flex items-start gap-2 px-2 py-2 hover:bg-slate-100"
                onClick={() => handleOpenChat(usr._id)}
              >
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <ProfileAvatar user={usr} size={36} />
                </div>
                                <div className="flex-1 border-b border-gray-100 pb-2 min-w-0">
                  {/* Name + Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-[13px] truncate max-w-[55%]">
                      {usr.username ? usr.username : "unknown"}
                    </p>
                    <p className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0">
                      {last && moment(last.createdAt).calendar(null, {
                        sameDay: "h:mm A",
                        lastDay: "[Yesterday]",
                        lastWeek: "ddd",
                        sameElse: "MMM D",
                      })}
                    </p>
                  </div>

                  {/* Preview + Unread Bubble */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-[12px] text-gray-500 flex items-center gap-1 overflow-hidden whitespace-nowrap text-ellipsis max-w-[85%]">
                      {last?.type === "image" ? (
                        <>
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                          <span>Image</span>
                        </>
                      ) : last?.type === "audio" ? (
                        <>
                          <Mic className="w-4 h-4 text-gray-400" />
                          <span>Audio</span>
                        </>
                      ) : (
                        <span className="truncate block">{last?.text}</span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <span className="bg-[var(--primary)] text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px] flex-shrink-0 ml-1">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentMessages;