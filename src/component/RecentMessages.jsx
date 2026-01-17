import React, { useState, useEffect, useRef } from "react";
<<<<<<< HEAD
import { Image as ImageIcon, Mic, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
=======
import { Image as ImageIcon, File, Send, X, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
>>>>>>> 03d2807 (Fix: persist theme across page reload in ChatBox)
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
  const [activeChatHistory, setActiveChatHistory] = useState([]); // Store full history for PiP
  
  const [activeChatId, setActiveChatId] = useState(null);
  const [pipOpen, setPipOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [chatId, setChatId] = useState(null);

  const { user } = useAuth();
  const { unreadMessages, addUnread, clearUnread } = useMessageContext();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const processedMessages = useRef(new Set());
  const scrollRef = useRef(null);

  // 1. Auto-scroll PiP
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChatHistory]);

  // 2. Fetch History when PiP Opens
  const fetchChatHistory = async (userId) => {
    try {
      const res = await axios.get(`/api/chat/room?user1=${user._id}&user2=${userId}`);
      if (res.data?.room) setChatId(res.data.room._id);
      setActiveChatHistory(res.data?.messages || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  // 3. Initial Load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [connRes, msgRes] = await Promise.all([
          axios.get("api/user/connections"),
          axios.get("api/messages/last")
        ]);
        setConnections(connRes.data.data?.connections || connRes.data.data?.followers || []);
        if (msgRes.data.success) setLastMessages(msgRes.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // 4. Central Socket Listener (Updates both List and PiP)
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      const { from_user_id, to_user_id, message } = data;
      const otherId = from_user_id === user._id ? to_user_id : from_user_id;
      
      // Update the recent list preview
      setLastMessages(prev => ({
        ...prev,
        [otherId]: { ...message, senderId: from_user_id }
      }));

      // If this is the active PiP, add to history
      if (otherId === activeChatId) {
        setActiveChatHistory(prev => [...prev, message]);
        socket.emit("markAsRead", { userId: otherId });
      } else if (from_user_id !== user._id) {
        addUnread(otherId, message);
      }
    };

    socket.on("newMessageAlert", handleIncoming);
    socket.on("newMessageNotification", handleIncoming);
    return () => {
      socket.off("newMessageAlert");
      socket.off("newMessageNotification");
    };
  }, [socket, activeChatId, user._id]);

  // 5. Send Message
  const handleSend = async () => {
    if (!draft.trim() || !activeChatId) return;

    const tempId = "temp_" + Date.now();
    const tempMsg = {
      _id: tempId,
      chatId,
      from_user_id: user._id,
      to_user_id: activeChatId,
      text: draft,
      message_type: "text",
      createdAt: new Date().toISOString(),
      sending: true,
      status: "sending"
    };

    // Update Local UI Immediately
    setActiveChatHistory(prev => [...prev, tempMsg]);
    setLastMessages(prev => ({
      ...prev,
      [activeChatId]: tempMsg
    }));

    setDraft("");

    try {
      const formData = new FormData();
      formData.append("chatId", chatId || "");
      formData.append("from_user_id", user._id);
      formData.append("to_user_id", activeChatId);
      formData.append("text", draft);
      formData.append("tempId", tempId);

      const res = await axios.post("/api/chat/message", formData, {
        headers: { Accept: "application/json" },
        withCredentials: true,
      });
      const serverMsg = res.data.message;
      setActiveChatHistory(prev => prev.map(m => m._id === tempId ? { ...serverMsg, status: "sent" } : m));
      setLastMessages(prev => ({
        ...prev,
        [activeChatId]: { ...serverMsg, status: "sent" }
      }));

      // Emit to socket
      socket.emit("sendMessage", serverMsg);
    } catch (err) {
      console.error("Error sending message:", err);
      setActiveChatHistory(prev => prev.map(m => m._id === tempId ? { ...m, failed: true, status: "failed" } : m));
    }
  };

  // 6. Online Status Helper
  const getStatusDisplay = (usr) => {
    if (usr.isOnline) return <span className="text-green-500 font-medium">Online</span>;
    return (
      <span className="text-gray-400">
        {usr.lastSeen ? `Last seen ${moment(usr.lastSeen).fromNow()}` : "Offline"}
      </span>
    );
  };

  const activeUser = connections.find(u => u._id === activeChatId);

  return (
<<<<<<< HEAD
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
=======
    <div className="  w-full bg-white rounded-xl shadow-md  p-0 m-0"
    >
      <h3 className="font-semibold text-sm px-2 pt-2 mb-2">Recent Messages</h3>
      
      <div className="flex flex-col max-h-[60vh] overflow-y-auto no-scrollbar">
        {loading ? <RecentMessagesSkeleton /> : connections.map((usr) => {
          const last = lastMessages[usr._id];
          const unread = unreadMessages[usr._id]?.length || 0;
          return (
            <div
              key={usr._id}
              onClick={() => {
                setActiveChatId(usr._id);
                setPipOpen(true);
                fetchChatHistory(usr._id);
                clearUnread(usr._id);
              }}
              className="flex gap-2 px-2 py-2 hover:bg-slate-100 cursor-pointer"
            >
              <ProfileAvatar user={usr} size={36} />
              <div className="flex-1 border-b pb-2 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium truncate">{usr.username}</span>
                  {last && <span className="text-[10px] text-gray-400">{moment(last.createdAt).format("h:mm A")}</span>}
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span className="truncate">{last?.text || "Click to chat"}</span>
                  {unread > 0 && <span className="bg-blue-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{unread}</span>}
>>>>>>> 03d2807 (Fix: persist theme across page reload in ChatBox)
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pipOpen && activeChatId && (
        <div className="fixed bottom-6 right-6 z-[100] w-80 h-[450px]  rounded-2xl shadow-2xl border flex flex-col overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.48)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "18px",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        }}
        >
          <div className="flex items-center gap-2 px-3 py-3 border-b">
            <button onClick={() => setPipOpen(false)}><X size={18} /></button>
            <ProfileAvatar user={activeUser} size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{activeUser?.username}</p>
              <p className="text-[10px] leading-none">{getStatusDisplay(activeUser)}</p>
            </div>
            <button onClick={() => navigate(`/chatbox/${activeChatId}`)}><Maximize2 size={16} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa]">
            {activeChatHistory.map((msg, i) => (
              <div key={msg._id || i} className={`flex flex-col ${msg.from_user_id === user._id ? "items-end" : "items-start"}`}>
                <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] ${
                  msg.from_user_id === user._id ? "bg-black text-white rounded-tr-none" : "bg-white border rounded-tl-none"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white border-t">
            <div 
  className="flex items-center gap-2 bg-gray-100 px-3 py-1.5" 
  style={{ borderRadius: '50px' }}
>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Message..."
                className="flex-1 bg-transparent border-none outline-none text-sm"
              />
              <button onClick={handleSend} disabled={!draft.trim()} className="text-black">
                <Send size={18} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentMessages;