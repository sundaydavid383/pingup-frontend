
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axiosBase from "./src/utils/axiosBase"; // adjust path as needed
import { useAuth } from "./src/context/AuthContext";
import { useSocket } from "./src/context/SocketContext";

const MessageSeenContext = createContext(null);

export const MessageSeenProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [unreadCountsMap, setUnreadCountsMap] = useState({});   // { [conversationId]: number }
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failedToFetch, setFailedToFetch] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null); // the userId (not chatId) currently open

  // Keep a ref of activeChatId so socket handlers always see latest value
  const activeChatIdRef = useRef(null);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // ─── Fetch all conversations + unread counts ───────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!user?._id) return;
    try {
      setFailedToFetch(false);
      const res = await axiosBase.get("/api/chat/user/conversations");
      if (res.data?.success) {
        const convos = res.data.conversations || [];
        setConversations(convos);

        // Build unread map from the data returned by the server
        const map = {};
        convos.forEach((c) => {
          map[c._id] = c.unreadCount || 0;
        });
        setUnreadCountsMap(map);
        setTotalUnreadCount(Object.values(map).reduce((a, b) => a + b, 0));
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setFailedToFetch(true);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ─── Helper: find conversation by chatId ──────────────────────────────────
  const getConvoByChatId = useCallback((chatId) => {
    return conversations.find((c) => c._id?.toString() === chatId?.toString());
  }, [conversations]);

  // ─── Helper: find conversation by otherUserId ─────────────────────────────
  const getConvoByOtherUser = useCallback((otherUserId) => {
    return conversations.find(
      (c) => c.otherUser?._id?.toString() === otherUserId?.toString()
    );
  }, [conversations]);

  // ─── Increment unread for a conversation (called on new incoming message) ──
  const incrementUnread = useCallback((chatId) => {
    setUnreadCountsMap((prev) => {
      const current = prev[chatId] || 0;
      const updated = { ...prev, [chatId]: current + 1 };
      setTotalUnreadCount(Object.values(updated).reduce((a, b) => a + b, 0));
      return updated;
    });
  }, []);

  // ─── Reset unread for a conversation to 0 (called when chat is opened) ────
  const clearUnreadForChat = useCallback((chatId) => {
    setUnreadCountsMap((prev) => {
      if (!prev[chatId]) return prev; // already 0, no update needed
      const updated = { ...prev, [chatId]: 0 };
      setTotalUnreadCount(Object.values(updated).reduce((a, b) => a + b, 0));
      return updated;
    });
  }, []);

  // ─── Update last message preview for a conversation ───────────────────────
  const updateConversationLastMessage = useCallback((chatId, message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c._id?.toString() === chatId?.toString()
          ? { ...c, lastMessage: message }
          : c
      )
    );
  }, []);

// Dedup guard: a message must only ever increment unread once, whether it
  // arrives via "newMessageAlert" (socket NOT in the chat room) or "receiveMessage"
  // (socket IS in the room — e.g. chat open but not scrolled to the new message).
  const processedIncomingIdsRef = useRef(new Set());

// ─── Socket: listen for new incoming messages ─────────────────────────────
   useEffect(() => {
     if (!socket || !user?._id) return;

     const registerIncoming = (chatId, message) => {
       const msgId = message?._id?.toString();
       if (msgId) {
         if (processedIncomingIdsRef.current.has(msgId)) return;
         processedIncomingIdsRef.current.add(msgId);
         if (processedIncomingIdsRef.current.size > 300) {
           processedIncomingIdsRef.current = new Set(
             [...processedIncomingIdsRef.current].slice(-150)
           );
         }
       }
       updateConversationLastMessage(chatId, message);
       incrementUnread(chatId);
     };

     const handleNewMessageAlert = (data) => {
       const { from_user_id, chatId, message } = data;
       if (from_user_id?.toString() === user._id?.toString()) return;
       registerIncoming(chatId, message);
     };
     socket.on("newMessageAlert", handleNewMessageAlert);

     // ✅ FIX: "newMessageAlert" is withheld by the server when the socket has
     // joined the chat room (chat open). "receiveMessage" is broadcast to the
     // whole room regardless of membership, so it's the only reliable signal
     // for "chat open but message not yet seen."
     const handleReceiveMessage = (msg) => {
       if (!msg?._id) return;
       if (msg.from_user_id?.toString() === user._id?.toString()) return;
       registerIncoming(msg.chatId, msg);
     };
     socket.on("receiveMessage", handleReceiveMessage);

     const handleUnreadCountUpdated = ({ chatId, unreadCount }) => {
       setUnreadCountsMap((prev) => {
         const updated = { ...prev, [chatId]: unreadCount };
         setTotalUnreadCount(Object.values(updated).reduce((a, b) => a + b, 0));
         return updated;
       });
     };

     socket.on("unreadCountUpdated", handleUnreadCountUpdated);

     return () => {
       socket.off("newMessageAlert", handleNewMessageAlert);
       socket.off("receiveMessage", handleReceiveMessage);
       socket.off("unreadCountUpdated", handleUnreadCountUpdated);
   };
   }, [socket, user?._id, incrementUnread, updateConversationLastMessage]);
   
  // ─── When activeChatId changes, clear unread for that conversation ─────────
  useEffect(() => {
    if (!activeChatId) return;
    const convo = getConvoByOtherUser(activeChatId);
    if (convo?._id) {
      clearUnreadForChat(convo._id);
    }
  }, [activeChatId, getConvoByOtherUser, clearUnreadForChat]);

  return (
    <MessageSeenContext.Provider
      value={{
        conversations,
        setConversations,
        unreadCountsMap,
        totalUnreadCount,
        loading,
        setLoading,
        failedToFetch,
        activeChatId,
        setActiveChatId,
        incrementUnread,
        clearUnreadForChat,
        updateConversationLastMessage,
        getConvoByChatId,
        getConvoByOtherUser,
        refetchConversations: fetchConversations,
      }}
    >
      {children}
    </MessageSeenContext.Provider>
  );
};

export const useMessageSeen = () => {
  const ctx = useContext(MessageSeenContext);
  if (!ctx) throw new Error("useMessageSeen must be used inside MessageSeenProvider");
  return ctx;
};