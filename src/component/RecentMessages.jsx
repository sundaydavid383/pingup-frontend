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
    setPipOpen,
    setActiveChatId,
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
    try {
      setChatLoading(true);
      const res = await axios.get(
        `/api/chat/room?user1=${user._id}&user2=${userId}`
      );

      if (res.data?.room) setChatId(res.data.room._id);
      setActiveChatHistory(res.data?.messages || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setChatLoading(false);
    }
  };

  // Initial Load
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

  // Central Socket Listener (Updates both List and PiP)
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
    };

    socket.on("newMessageNotification", handleIncoming);
    return () => {
      socket.off("newMessageNotification", handleIncoming);
    };
  }, [socket, user._id]);

  const handleUserClick = (usr) => {
    setActiveChatId(usr._id);
    setPipOpen(true);
    fetchChatHistory(usr._id);
    clearUnread(usr._id);
  };

  return (
    <>
      {connections.length > 0 && (
        <div className="w-full bg-white rounded-xl shadow-md p-0 m-0">
          <h3 className="font-semibold text-sm px-2 pt-2 mb-2">Recent Messages</h3>
          <div className="flex flex-col max-h-[60vh] overflow-y-auto no-scrollbar">
            {loading ? <RecentMessagesSkeleton /> : connections.map((usr) => {
              const last = lastMessages[usr._id];
              const unread = unreadMessages[usr._id]?.length || 0;
              return (
                <div
                  key={usr._id}
                  onClick={() => handleUserClick(usr)}
                  className="flex gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-200 hover:bg-[var(--hover-subtle-bg)] hover:shadow-sm"
                >
                  {/* Profile Avatar */}
                  <ProfileAvatar user={usr} size={44} />

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Top row: username and timestamp */}
                    <div className="flex justify-between items-center">
                      <span
                        className="flex items-center gap-1 truncate text-xs min-w-0"
                        style={{ color: "var(--text-secondary)" }}
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
                          className="flex items-center justify-center rounded-full w-5 h-5 text-[10px] font-bold"
                          style={{
                            background: "var(--primary)",
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
