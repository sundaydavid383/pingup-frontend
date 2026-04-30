import React, { useState, useEffect, useMemo } from "react";
import ChatBox from "../pages/ChatBox.jsx";
import { useNavigate } from "react-router-dom";
import { Eye, MessageSquare, ImageIcon, Mic } from "lucide-react";
import axios from "../utils/axiosBase";
import BackButton from "../component/shared/BackButton";
import ProfileAvatar from "../component/shared/ProfileAvatar";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext"; // Corrected import path
import { useMessageSeen } from "../../MessageSeenContext"; // Corrected import path
import "../styles/message.css"
import RightSidebar from "../component/RightSidebar";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";
import { connect } from "socket.io-client";
import { MdNetworkLocked, MdOutlineNetworkWifi1Bar } from "react-icons/md";

const Messages = () => {

  const [activeChatId, setActiveChatId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Get data from the new MessageSeenContext
  const { conversations, unreadCountsMap, totalUnreadCount, failedToFetch, loading, setLoading, setActiveChatId: setContextActiveChatId, clearUnreadForChat, getConvoByChatId } = useMessageSeen();

// Sync active chat ID with context so unread updates work correctly
useEffect(() => {
  setContextActiveChatId(activeChatId);
}, [activeChatId, setContextActiveChatId]);


  const sortedConversations = useMemo(() => {
    if (!conversations || conversations.length === 0) return [];
    
    /**
     * WhatsApp-like Sorting Logic:
     * 1. Active Chat (currently open) - ALWAYS first
     * 2. Unread Messages (sorted by latest activity within this group)
     * 3. Read Messages (sorted by latest activity)
     */
    
    // Helper function to calculate priority and timestamp for each conversation
    const getConversationData = (convo) => {
      const unreadCount = unreadCountsMap[convo._id] || 0;
      const isActive = activeChatId === convo.otherUser?._id;
      
      // Determine priority level (lower number = higher priority)
      let priorityLevel;
      if (isActive) {
        priorityLevel = 0; // Active chat always first
      } else if (unreadCount > 0) {
        priorityLevel = 1; // Unread chats second
      } else {
        priorityLevel = 2; // Read chats last
      }
      
      // Pre-compute timestamp to avoid creating Date objects during sort
      const timestamp = convo.lastMessage?.createdAt 
        ? new Date(convo.lastMessage.createdAt).getTime() 
        : 0;
      
      return { priorityLevel, timestamp, unreadCount };
    };
    
    // Create array with pre-computed data for efficient sorting
    const conversationsWithData = conversations.map((convo) => ({
      convo,
      ...getConversationData(convo)
    }));
    
    // Sort using pre-computed data
    conversationsWithData.sort((a, b) => {
      // First, compare by priority level
      if (a.priorityLevel !== b.priorityLevel) {
        return a.priorityLevel - b.priorityLevel;
      }
      
      // Within same priority level, sort by latest activity (newest first)
      // This ensures chats jump up when they receive new messages
      return b.timestamp - a.timestamp;
    });
    
    // Return only the conversations (without the metadata)
    return conversationsWithData.map(item => item.convo);
  }, [conversations, unreadCountsMap, activeChatId]);


  const filteredConnections = useMemo(() => sortedConversations.filter((convo) => {
    if(!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const otherUser = convo.otherUser;
    if (!otherUser) return false;
    return (
      otherUser.name?.toLowerCase().includes(term) ||
      otherUser.username?.toLowerCase().includes(term)
    );
  }), [sortedConversations, searchTerm]);

  /*** Open chat ***/
  const handleOpenChat = (userId) => {
    setActiveChatId(userId);
      const convo = conversations.find(c => c.otherUser?._id?.toString() === userId?.toString());
  if (convo?._id) {
    clearUnreadForChat(convo._id);
  }
    if (window.innerWidth < 768) navigate(`/chatbox/${userId}`);
  };

  // 🔎 Highlight matching text like WhatsApp
  const highlightMatch = (text, term) => {
    if (!term || !text) return text;

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex
    const regex = new RegExp(`(${escapedTerm})`, "gi");

    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          style={{
            backgroundColor: "rgba(139, 92, 246, 0.25)", // soft violet
            color: "var(--primary)",
            fontWeight: 600,
            borderRadius: "4px",
            padding: "0 2px"
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
    <div className="h-screen w-full flex bg-[var(--white)] overflow-hidden relative">
      {/* LEFT: Conversation list */}
      <div className="w-full md:w-[40%] lg:w-[35%] p-6 overflow-y-auto border-r h-full"
      style={{
        borderRightColor: "var(--hover-light)",
        borderRightStyle: "solid",
        borderRightWidth: "1px",}}>
        <BackButton top="0px" left={"80px"}  />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1 title">
            Messages
          </h1>
          <p className="text-slate-600">People you’ve connected with</p>
        </div>
        
        <div className="mb-4 flex items-center gap-2 search-input">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.target.blur();
              }}
              className=" bg-[var(--color-1)] flex-1 outline-none border-none focus:ring-0"
            />
            {searchTerm && (
                <button
                onClick={() => setSearchTerm("")}
                className="px-3 py-1 text-sm  rounded-xl bg-[var(--hover-light)]  hover:bg-[var(--hover-dark)] cursor-pointer transition"
                >
                ✕
                </button>
            )}
        </div>



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
          ) : filteredConnections.length > 0 ? (
            filteredConnections.map((convo, index) => {
              const otherUser = convo.otherUser;
              if (!otherUser) return null;

              const last = convo.lastMessage;
              const unreadCount = unreadCountsMap[convo._id] || 0;
              const isActive = activeChatId === otherUser._id;
              
              // Check if this is the first unread message in the list
              const hasUnread = unreadCount > 0;

              return (
                <div
                  key={otherUser._id}
                  onClick={() => handleOpenChat(otherUser._id)}
                  className={`flex gap-5 px-3 py-2 rounded-md items-center  cursor-pointer transition ${
                    hasUnread 
                      ? "bg-red-50 border-l-4 border-red-500 hover:bg-red-100" 
                      : isActive
                        ? "bg-violet-100"
                        : "bg-[var(--white)] hover:bg-[var(--hover-light)]"
                  }`}
                >
                  <ProfileAvatar
                    user={{
                      name: otherUser.name || "User",
                      profilePicUrl: otherUser.profile_picture || otherUser.profilePicUrl,
                      profilePicBackground: otherUser.profilePicBackground,
                    }}
                    size={48}
                  />

                  <div className="flex-1 min-w-0">
                    <p className={`truncate ${hasUnread ? "text-red-600 font-semibold" : "text-[var(--primary)]"}`}>
                       @{highlightMatch(otherUser.username, searchTerm)}
                    </p>
                    
                    {last && (
                      <span
                        className={`text-sm truncate flex items-center gap-1 ${
                          unreadCount > 0 ? "text-red-600 font-bold" : "text-slate-600"
                        }`}
                      >
                        {last.from_user_id === user._id && "You: "}
                        {last.message_type === "image" ? (
                          <>
                            <ImageIcon size={16} className={unreadCount > 0 ? "text-red-600" : "text-[var(--primary)]"} /> Image
                          </>
                        ) : last.message_type === "audio" ? (
                          <>
                            <Mic size={16} className={unreadCount > 0 ? "text-red-600" : "text-[var(--primary)]"} /> Audio
                          </>
                        ) : (
                          <p>{last.text?.substring(0, 17)}...</p>
                        )}
                      </span>
                    )}


                    {unreadCount > 0 && (
                      <span className="inline-block mt-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-slate-500">
              {searchTerm ? "No users found." : failedToFetch ?"Failed to load conversations check your internet connection and try again": !loading?"No accepted connections yet.":"" }
            </p>
          )}
            {!searchTerm && conversations.length === 0 && !failedToFetch ? (
    <button
      onClick={() => navigate("/discover")} // redirect to your discover page
      className="btn "
    >
      Find People
    </button>
  ):failedToFetch ?(
    <span className="no_connection_icon"><MdNetworkLocked/> </span>
  ):null}
        </div>
      </div>

     
   {/* RIGHT: Chat box (desktop only) */}
<div className="hidden md:flex flex-1 bg-[var(--white)] h-full overflow-hidden">
  {activeChatId ? (
    <div className="w-full h-full">
      <ChatBox userId={activeChatId} />
    </div>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
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
