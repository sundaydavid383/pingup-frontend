import React, { useState, useEffect, useRef } from "react";
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
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true); // skeleton only on first load
  const [lastMessages, setLastMessages] = useState({});
  const [unreadMap, setUnreadMap] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const { user, sponsors } = useAuth();
  const { unreadMessages, addUnread, clearUnread } = useMessageContext();
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

/*** 2️⃣ Fetch and sync connections/messages in background ***/
useEffect(() => {
  let intervalId;
  let initialSync = true; // ✅ only true for first load

  const fetchAndSync = async () => {
    try {
      if (initialSync) {
        setSyncing(true);
        setSyncProgress(0);
      }

      // Fetch connections
      const res = await axios.get("api/user/connections", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      const serverConnections = res.data.data?.connections?.length
        ? res.data.data.connections
        : res.data.data?.followers || [];

      setConnections((prev) => {
        const hasChanged =
          JSON.stringify(prev.map(c => c._id)) !== JSON.stringify(serverConnections.map(c => c._id));
        if (initialSync || hasChanged) {
          localStorage.setItem("springsconnect_connections", JSON.stringify(serverConnections));
          return serverConnections;
        }
        return prev; // no change, don't trigger re-render
      });

      if (initialSync) setSyncProgress(40);

      // Fetch last messages
      const messagesRes = await axios.get("api/messages/last", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (messagesRes.data.success && messagesRes.data.data) {
        const fetchedMessages = messagesRes.data.data;

        setLastMessages((prev) => {
          const merged = { ...prev, ...fetchedMessages };
          const hasChanged = JSON.stringify(prev) !== JSON.stringify(merged);
          if (initialSync || hasChanged) {
            localStorage.setItem("lastMessages", JSON.stringify(merged));
            return merged;
          }
          return prev; // no change
        });
      }

      if (initialSync) setSyncProgress(100);

      if (initialSync) {
        setTimeout(() => setSyncing(false), 300); // brief animation
        initialSync = false; // ✅ disable syncing animation for intervals
      }
    } catch (err) {
      console.error("Error syncing connections/messages:", err);
      if (initialSync) setSyncing(false);
    }
  };

  fetchAndSync(); // immediate
  intervalId = setInterval(fetchAndSync, 10000); // every 10s, silent

  return () => clearInterval(intervalId);
}, []);


  /*** 3️⃣ Persist unread counts ***/
  useEffect(() => {
    if (Object.keys(unreadMap).length > 0) {
      localStorage.setItem("unreadMap", JSON.stringify(unreadMap));
    } else {
      localStorage.removeItem("unreadMap");
    }
  }, [unreadMap]);

  /*** 4️⃣ Sync unread messages from context ***/
  useEffect(() => {
    const initial = {};
    Object.keys(unreadMessages || {}).forEach((uid) => {
      initial[uid] = unreadMessages[uid]?.length || 0;
    });
    setUnreadMap(initial);
  }, [unreadMessages]);

  /*** 5️⃣ Handle self-sent messages ***/
  useEffect(() => {
    const handleSelfMessage = (e) => {
      const detail = e?.detail;
      if (!detail) return;

      const { to_user_id, message } = detail;
      if (!to_user_id || !message) return;

      const text = message.text || "[media]";
      const createdAt = message.createdAt || new Date().toISOString();

      setLastMessages((prev) => {
        const updated = {
          ...prev,
          [to_user_id]: { text, createdAt, type: message.message_type, senderId: user._id },
        };
        localStorage.setItem("lastMessages", JSON.stringify(updated));
        return updated;
      });
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
  const sortedConnections = [...connections].sort((a, b) => {
    const aTime = new Date(lastMessages[a._id]?.createdAt || 0).getTime();
    const bTime = new Date(lastMessages[b._id]?.createdAt || 0).getTime();
    return bTime - aTime;
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
    navigate(`/chatbox/${userId}`);
  };

  const borderColor = `rgba(${255 - Math.floor((syncProgress / 100) * 255)}, ${Math.floor(
    (syncProgress / 100) * 255
  )}, 50, 1)`;

  return (
    <div className="min-h-screen relative flex mr-5 bg-slate-50 overflow-x-hidden">
      <div className="flex-1 p-6 box-border">
        <BackButton />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1 title">Messages</h1>
          <p className="text-slate-600">People you’ve connected with</p>
        </div>

{syncing && (
  <div
    className="fixed top-14 z-555 left-1/2 transform -translate-x-1/2 w-11/12 max-w-xl h-4 rounded-full overflow-hidden border"
    style={{
      borderColor: "var(--input-border)",
      backgroundColor: "var(--hover-subtle-bg)",
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
    }}
  >
    <div
      className="h-full rounded-full transition-all duration-500 ease-out "
      style={{
        width: `${syncProgress}%`,
        background: "linear-gradient(to right, var(--primary), var(--btn-hover))"
      }}
    />
    <div
      className="absolute inset-0 flex items-center justify-center text-sm font-medium select-none pointer-events-none"
      style={{ color: "var(--gold)" }}
    >
      {syncProgress}% syncing...
    </div>
  </div>
)}


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

              return (
                <div
                  key={usr._id}
                  className="flex flex-wrap gap-5 px-3 py-2 bg-white shadow rounded-md items-center overflow-hidden"
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
                          unreadCount > 0 ? "text-[var(--error)]" : "text-slate-600"
                        }`}
                      >
                        <span className={unreadCount > 0 ? "text-[var(--error)]" : "text-slate-500"}>
                          {last.senderId === user._id ? "You:" : "Last:"}
                        </span>
                        {last.type === "image" ? (
                          <>
                            <ImageIcon
                              className={`w-4 h-4 ${
                                unreadCount > 0 ? "text-red-500" : "text-slate-500"
                              }`}
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

                  <div className="flex flex-col gap-2 mt-2 sm:mt-0">
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
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-slate-500">No accepted connections yet.</p>
          )}
        </div>
      </div>

      <RightSidebar sponsors={sponsors} loading={!sponsors} />
      <MediumSidebarToggle sponsors={sponsors} />
    </div>
  );
};

export default Messages;
