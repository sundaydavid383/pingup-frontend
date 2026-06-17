import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useMessageContext } from "./MessageContext";
import { useNotificationContext } from "./NotificationContext";


export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user } = useAuth();

  // Import both helpers from the context
  const { addUnread, updateLastMessage, incrementUnread, markAsRead  } = useMessageContext();
  const { addNotification, notifications } = useNotificationContext();

  // Track processed notification IDs to prevent duplication
  const processedNotifications = useRef(new Set());
  // Track processed message IDs to prevent duplication
  const processed = useRef(new Set());
   
  useEffect(() => {
    // 🧩 Initialize global socket
    const s = io(import.meta.env.VITE_SERVER, {
      auth: { token: localStorage.getItem("token") || "" },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    setSocket(s);

    s.on("connect", () => {
      console.log("🟢 Global socket connected:", s.id);
      setConnected(true);

      s.emit("requestOnlineUsers");
      
      // Send activity heartbeat every 30 seconds to keep lastActiveAt fresh
      const activityInterval = setInterval(() => {
        if (s.connected) {
          s.emit("userActivity");
        }
      }, 30000);
      
      // Cleanup on disconnect
      s.on("disconnect", () => {
        clearInterval(activityInterval);
      });
    });

    s.on("disconnect", (reason) => {
      console.log("🔴 Global socket disconnected:", reason);
      setConnected(false);
    });

    s.on("userLocationUpdated", ({ userId, coords }) => {
  console.log("User moved:", userId, coords);
  // Update map markers accordingly
});
  s.io.on("reconnect_attempt", () => {
    console.log("🔄 Reconnecting...");
    const token = localStorage.getItem("token");
    s.auth = { token };  // ✅ update the correct socket instance
  });


s.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection error:", err.message);
    });

 s.on("userOnline", ({ userId }) => {
  setOnlineUsers(prev => {
    const next = new Set(prev);
    next.add(userId);
    return next;
  });
});

s.on("userOffline", ({ userId }) => {
  setOnlineUsers(prev => {
    const next = new Set(prev);
    next.delete(userId);
    return next;
  });
});


       

  s.on("onlineUsers", (users) => {
  setOnlineUsers(new Set(users)); // replace old snapshot entirely
});

    return () => {
      console.log("🧹 Cleaning up global socket connection...");
      s.disconnect();
    };
  }, []);


// 🌟 Global notification listener
useEffect(() => {
  if (!socket || !user) return;

  const handleNotification = (notif) => {
    console.log("🔔 New Notification:", notif);

    // Prevent duplicates - check if notification already exists
    const notifId = notif._id || notif.id || notif.notificationId;
    if (notifId && processedNotifications.current.has(notifId)) {
      console.log("🔔 Duplicate notification ignored:", notifId);
      return;
    }

    // Add to processed set
    if (notifId) {
      processedNotifications.current.add(notifId);
    }

    // Check if notification was previously deleted (stored in localStorage)
    const deletedNotifications = JSON.parse(localStorage.getItem('deletedNotifications') || '[]');
    if (deletedNotifications.includes(notifId)) {
      console.log("🔔 Previously deleted notification ignored:", notifId);
      return;
    }

    // Add to global state
    addNotification(notif);

    // Dispatch global event for components to react (like notification indicator)
    window.dispatchEvent(
      new CustomEvent("newNotificationReceived", {
        detail: {
          notification: notif,
          notificationId: notifId,
          timestamp: new Date().toISOString(),
        },
      })
    );
  };

  socket.on("newNotification", handleNotification);

  return () => {
    socket.off("newNotification", handleNotification);
  };
}, [socket, user, addNotification]);



  // Track user location and send to server
// Track user location and send to server only if user moves
useEffect(() => {
  if (!socket || !user || !navigator.geolocation) return;

  let lastCoords = null; // store last sent coords
  const THRESHOLD = 0.0001; // roughly ~11m (latitude/longitude degrees)

  const hasMoved = (prev, curr) => {
    if (!prev) return true;
    const latDiff = Math.abs(prev[0] - curr[0]);
    const lonDiff = Math.abs(prev[1] - curr[1]);
    return latDiff > THRESHOLD || lonDiff > THRESHOLD;
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const coords = [latitude, longitude];

      if (hasMoved(lastCoords, coords)) {
        socket.emit("updateLocation", { coords: [longitude, latitude] });
        lastCoords = coords;
        console.log("📍 Location updated:", coords);
      }
    },
    (err) => console.error("❌ Geolocation error:", err),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, [socket, user]);



  // 🌍 Global message listener
  useEffect(() => {
    if (!socket || !user) return;

    const handleReceiveMessage = (msg) => {
      if (!msg?._id) return;
      if (processed.current.has(msg._id)) return;
      processed.current.add(msg._id);

      // Ignore messages sent by the current user
      if (msg.from_user_id === user._id) return;

      // ✅ 2. Update last message summary (for chat list, preview, etc.)
      updateLastMessage(msg.from_user_id, msg);
      //addUnread(msg.from_user_id, msg);
      // ✅ 3. Dispatch global browser event for UI-specific components
      window.dispatchEvent(
        new CustomEvent("newMessageAlert", {
          detail: {
            from_user_id: msg.from_user_id,
            chatId: msg.chatId,
            message: msg,
          },
        })
      );

      // ✅ 4. Keep processed memory clean
      if (processed.current.size > 200) {
        processed.current = new Set([...processed.current].slice(-100));
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket, user, addUnread, updateLastMessage]);

  // Listen for messages marked as read by recipients
// Listen for messages marked as read by recipients
useEffect(() => {
  if (!socket || !user) return;

  const handleMessageRead = ({ messageId, chatId, from_user_id }) => {
    console.log("✅ Message read:", messageId, "from", from_user_id);

    // 1️⃣ Update MessageContext: remove from unread
    markAsRead(from_user_id);

    // 2️⃣ Dispatch global event for UI-specific components
    window.dispatchEvent(
      new CustomEvent("messageRead", {
        detail: { messageId, chatId, from_user_id },
      })
    );
  };

  socket.on("messageRead", handleMessageRead);

  return () => socket.off("messageRead", handleMessageRead);
}, [socket, user, markAsRead]);

  // 🟢 Listen for message-delivered status updates
  useEffect(() => {
    if (!socket || !user) return;

    const handleMessageDelivered = ({ messageId, chatId, status, deliveredAt }) => {
      console.log("📦 Message delivered:", messageId, "in chat:", chatId);
      
      // Dispatch event for ChatBox to update checkmarks
      window.dispatchEvent(
        new CustomEvent("message-delivered", {
          detail: { messageId, chatId, status, deliveredAt },
        })
      );
    };

    socket.on("message-delivered", handleMessageDelivered);

    return () => socket.off("message-delivered", handleMessageDelivered);
  }, [socket, user]);



  // 🟢 Join personal room for notifications
useEffect(() => {
  if (!socket || !user) return;

  socket.emit("joinUserRoom", user._id.toString());
}, [socket, user]);

  // 👇 Optionally add helper events (typing, read receipts)
  // Example:
  // useEffect(() => {
  //   if (!socket) return;
  //   socket.on("userTyping", data => console.log("✏️ typing:", data));
  //   return () => socket.off("userTyping");
  // }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);