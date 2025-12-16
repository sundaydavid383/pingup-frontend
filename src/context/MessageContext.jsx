import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
const MessageContext = createContext(null);

const LOCAL_UNREAD_KEY = "unreadMessages_v1";
const LOCAL_LAST_KEY = "lastMessages_v1";

export const MessageProvider = ({ children }) => {
  // --- unreadMessages: { [senderId]: [ message, ... ] }
  const [unreadMessages, setUnreadMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(LOCAL_UNREAD_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error("MessageContext: failed to parse unreadMessages", err);
      return {};
    }
  });

  // --- lastMessages: { [otherUserId]: { text, createdAt, type, senderId } }
  const [lastMessages, setLastMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(LOCAL_LAST_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error("MessageContext: failed to parse lastMessages", err);
      return {};
    }
  });




  // Persist unread -> localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_UNREAD_KEY, JSON.stringify(unreadMessages));
    } catch (err) {
      console.warn("MessageContext: could not persist unreadMessages", err);
    }
  }, [unreadMessages]);

  // Persist lastMessages -> localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_LAST_KEY, JSON.stringify(lastMessages));
    } catch (err) {
      console.warn("MessageContext: could not persist lastMessages", err);
    }
  }, [lastMessages]);

  // Helper to normalize timestamps
  const toIso = (val) => {
    if (!val) return new Date().toISOString();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  // Add unread message for a sender (dedupe by _id or timestamp)
  const addUnread = useCallback((senderId, message) => {
    if (!senderId || !message) return;

    // Create a minimal message object we store in unread list
    const msgId = message._id || message.id || `${senderId}_${message.createdAt || Date.now()}`;
    const createdAt = toIso(message.createdAt || message.created_at || message.timestamp);
    const storedMsg = {
      _id: msgId,
      text: message.text ?? message.body ?? "",
      createdAt,
      type: message.message_type ?? message.type ?? "text",
      raw: message, // keep original for later inspection if needed
    };

    setUnreadMessages((prev) => {
      const existing = prev[senderId] || [];
      const already = existing.some((m) => m._id === storedMsg._id);
      if (already) return prev;
      return {
        ...prev,
        [senderId]: [...existing, storedMsg],
      };
    });
  }, []);

  // Clear unread messages for a sender
  const clearUnread = useCallback((senderId) => {
    if (!senderId) return;
    setUnreadMessages((prev) => {
      if (!prev[senderId]) return prev;
      const copy = { ...prev };
      delete copy[senderId];
      return copy;
    });
  }, []);

  // Reset all unread messages (logout)
  const resetUnread = useCallback(() => {
    setUnreadMessages({});
    try {
      localStorage.removeItem(LOCAL_UNREAD_KEY);
    } catch (err) {
      /* ignore */
    }
  }, []);


    // Add unread message counter
const incrementUnread = useCallback((senderId, message = null) => {
  if (!senderId) return;

  if (message) {
    addUnread(senderId, message);
  } else {
    const placeholder = {
      _id: `placeholder_${Date.now()}`,
      text: "",
      createdAt: new Date().toISOString(),
      type: "text",
    };
    addUnread(senderId, placeholder);
  }
}, [addUnread]);


  // Get total unread count
  const getTotalUnread = useCallback(() => {
    return Object.values(unreadMessages).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
  }, [unreadMessages]);

  // Get single user's unread count
  const getUnreadCount = useCallback((userId) => {
    if (!userId) return 0;
    return (unreadMessages[userId] || []).length;
  }, [unreadMessages]);

  // Update last message summary for a chat (only if message is newer)
  const updateLastMessage = useCallback((otherUserId, message) => {
    if (!otherUserId || !message) return;

    const createdAt = toIso(message.createdAt || message.created_at || message.timestamp);
    const type = message.message_type ?? message.type ?? "text";
    const text = type === "image" ? "[Image]" : type === "audio" ? "[Audio]" : (message.text ?? message.body ?? "");

    setLastMessages((prev) => {
      const prevEntry = prev[otherUserId];
      const prevTime = prevEntry ? new Date(prevEntry.createdAt).getTime() : 0;
      const newTime = new Date(createdAt).getTime();

      if (newTime >= prevTime) {
        return {
          ...prev,
          [otherUserId]: {
            text,
            createdAt,
            type,
            senderId: message.from_user_id ?? message.from ?? message.senderId ?? null,
          },
        };
      }
      return prev;
    });
  }, []);

  // Bulk set lastMessages from server (e.g., initial fetch)
  const setLastMessagesFromServer = useCallback((map) => {
    if (!map || typeof map !== "object") return;
    // Expecting map: { userId: { text, createdAt, type, senderId } }
    setLastMessages((prev) => ({ ...prev, ...map }));
  }, []);

  // Clear last message for a chat (if needed)
  const clearLastMessage = useCallback((otherUserId) => {
    if (!otherUserId) return;
    setLastMessages((prev) => {
      if (!prev[otherUserId]) return prev;
      const copy = { ...prev };
      delete copy[otherUserId];
      return copy;
    });
  }, []);

  // Reset last messages (logout)
  const resetLastMessages = useCallback(() => {
    setLastMessages({});
    try {
      localStorage.removeItem(LOCAL_LAST_KEY);
    } catch (err) {
      /* ignore */
    }
  }, []);

  // Convenience: mark as read (clears unread + optionally update lastMessages if needed)
  const markAsRead = useCallback((otherUserId) => {
    if (!otherUserId) return;
    clearUnread(otherUserId);
  }, [clearUnread]);

  const hasUnread = useCallback(
  (userId) => {
    if (userId) return (unreadMessages[userId] || []).length > 0;
    return Object.keys(unreadMessages).some((uid) => unreadMessages[uid]?.length > 0);
  },
  [unreadMessages]
);

  return (
<MessageContext.Provider
  value={{
    unreadMessages,
    lastMessages,
    addUnread,
    clearUnread,
    incrementUnread, // ✅ add it here
    resetUnread,
    getTotalUnread,
    getUnreadCount,
    hasUnread,
    updateLastMessage,
    setLastMessagesFromServer,
    clearLastMessage,
    resetLastMessages,
    markAsRead,
  }}
>
  {children}
</MessageContext.Provider>


  );
};

export const useMessageContext = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) {
    throw new Error("useMessageContext must be used within a MessageProvider");
  }
  return ctx;
};
