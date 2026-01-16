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
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadMap, setUnreadMap] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const { user, sponsors } = useAuth();
  const { unreadMessages, addUnread, clearUnread, getTotalUnread } = useMessageContext();
  const { socket } = useSocket();
  const totalUnread = getTotalUnread();
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
        localStorage.setItem(
      "springsconnect_connections",
      JSON.stringify(acceptedConnections)
    );
    } catch (err) {
      console.error("Error fetching connections:", err);
      const cached = localStorage.getItem("springsconnect_connections");
      setConnections(cached ? JSON.parse(cached) : []);
     } finally {
      setLoading(false);
    }
  };

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
  if (!to_user_id) return;

  const createdAt = message?.createdAt || new Date().toISOString();
  const text = message?.text || "[media]";

  setLastMessages((prev) => ({
  ...prev,
  [otherUserId]: {
    text,
    createdAt: new Date().toISOString(), // ✅ activity time
    type,
    senderId: from_user_id,
  },
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

  if (window.innerWidth < 768) {
    navigate(`/chatbox/${userId}`);
  }
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
    ${isActive ? "bg-violet-100" : "bg-white hover:bg-slate-100"}
  `}
>

                  <div onClick={() => navigate(`/profile/${usr._id}`)} className="cursor-pointer">
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
                    <p className="text-[var(--primary)] truncate">{usr.username}</p>
                    <p className="font-medium text-slate-700 truncate">{usr.full_name}</p>

                    {last && (
  <p
    className={`text-sm flex items-center gap-1 truncate ${
      unreadCount > 0 ?  "text-[var(--error)]" : "text-slate-600"
    }`}
  >
    <span className={unreadCount > 0 ? "text-[var(--error)]" : "text-slate-500"}>
      {last.senderId === user._id ? "You:" : "Last:"}
    </span>
    {last.type === "image" ? (
      <>
        <ImageIcon
          className={`w-4 h-4 ${unreadCount > 0 ? "text-red-500" : "text-slate-500"}`}
        />{" "}
        Image
      </>
    ) : last.type === "audio" ? (
      <>
        <Mic
          className={`w-4 h-4 ${unreadCount > 0 ? "text-red-500" : "text-slate-500"}`}
        />{" "}
        Audio
      </>
    ) : (
      <span className="truncate">
        {last.text?.length > 40 ? last.text.slice(0, 40) + "..." : last.text}
      </span>
    )}
  </p>
)}


                    {unreadCount > 0 && (
                      <span className="inline-block mt-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {/* <div className="flex flex-col gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleOpenChat(usr._id)}
                      className="w-8 h-8 flex items-center justify-center rounded bg-[var(--primary)] text-[var(--white)] hover:bg-[var(--primary-dark)] hover:text-[var(--primary)] transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/profile/${usr._id}`)}
                      className="w-8 h-8 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div> */}
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
    <div className="flex flex-1 items-center justify-center text-slate-400">
      Select a conversation
    </div>
  )}
</div>



      
    </div>
  );
};

export default Messages;