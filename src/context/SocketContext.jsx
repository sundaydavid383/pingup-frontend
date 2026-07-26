import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useMessageContext } from "./MessageContext";
import { useNotificationContext } from "./NotificationContext";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user, token } = useAuth();

  const { addUnread, updateLastMessage, incrementUnread, markAsRead } = useMessageContext();
  const { addNotification, notifications } = useNotificationContext();

  const processedNotifications = useRef(new Set());
  const processed = useRef(new Set());

  // ─── STEP 1: Initialize socket ─────────────────────────────────────────────
  // ✅ FIX: this used to run once on mount with an empty dep array, connecting
  // switch), so the very first connection attempt always carries valid auth.
  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = io(import.meta.env.VITE_SERVER, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    setSocket(s);

    // ✅ FIXED: connect handler has NO nested listeners
    s.on("connect", () => {
      console.log("🟢 Global socket connected:", s.id);
      setConnected(true);
      s.emit("requestOnlineUsers"); // ask server for current snapshot
    });

    // ✅ FIXED: disconnect is top-level, not nested inside connect
    s.on("disconnect", (reason) => {
      console.log("🔴 Global socket disconnected:", reason);
      setConnected(false);
    });

    // ✅ Update token on reconnect attempt
s.io.on("reconnect_attempt", () => {
      console.log("🔄 Reconnecting...");
      s.auth = { token: localStorage.getItem("token") || token || "" };
    });

    // ✅ Re-request online users after successful reconnect
    // so the Set is never stale after a network blip
    s.io.on("reconnect", () => {
      console.log("✅ Reconnected — refreshing online users");
      s.emit("requestOnlineUsers");
      window.dispatchEvent(new CustomEvent("socketReconnected"));
    });

    s.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection error:", err.message);
    });
    s.on("authError", (data) => {
      console.warn("🔐 Socket auth rejected:", data?.message);
    });
     s.io.on("reconnect_failed", () => {
      console.warn("🔁 Reconnection attempts exhausted — forcing manual reconnect");
      setTimeout(() => {
        if (!s.connected) s.connect();
      }, 3000);
    });

    // ─── Online presence events ──────────────────────────────────────────────
    s.on("userOnline", ({ userId }) => {
      console.log(`🔍 [PRESENCE-CLIENT] Received userOnline for ${userId} at ${new Date().toISOString()}, my socket=${s.id}, connected=${s.connected}`);
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });

    s.on("userOffline", ({ userId, lastActiveAt }) => {
      console.log(`🔍 [PRESENCE-CLIENT] Received userOffline for ${userId} at ${new Date().toISOString()}, lastActiveAt=${lastActiveAt}`);
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Full snapshot — replaces local state entirely
    s.on("onlineUsers", (users) => {
      console.log(`🔍 [PRESENCE-CLIENT] Received onlineUsers snapshot at ${new Date().toISOString()}:`, users);
      setOnlineUsers(new Set(users));
    });

    s.on("userLocationUpdated", ({ userId, coords }) => {
      console.log("User moved:", userId, coords);
    });

    return () => {
      console.log("🧹 Cleaning up global socket connection...");
      s.disconnect();
    };
  }, [token]); // ← empty deps: socket created once on mount


useEffect(() => {
    if (!socket || !user) return;

    const doJoin = () => {
      socket.emit("joinUserRoom", user._id.toString());
      // Re-request snapshot in case we missed the broadcast while auth was loading
      socket.emit("requestOnlineUsers");
    };

    // If socket already connected when user becomes available, join immediately
    if (socket.connected) {
      doJoin();
    }

    // Also fire on every (re)connect — covers the race where
    // socket connected BEFORE the user object was ready in React state
    socket.on("connect", doJoin);

    const activityInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("userActivity");
      }
    }, 30000);

    return () => {
      socket.off("connect", doJoin);
      clearInterval(activityInterval);
    };
  }, [socket, user]);
  // ✅ NEW: send the application-level heartbeat the server sweep is
  // listening for.
  useEffect(() => {
    if (!socket) return;
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) socket.emit("heartbeat");
    }, 20000);
    return () => clearInterval(heartbeatInterval);
  }, [socket]);

  // ✅ NEW: the moment the tab/app regains focus, or the OS reports
  useEffect(() => {
    if (!socket) return;

    const resync = () => {
      if (!socket.connected) return;
      socket.emit("heartbeat");
      socket.emit("requestOnlineUsers");
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") resync();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", resync);
    window.addEventListener("online", resync);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", resync);
      window.removeEventListener("online", resync);
    };
  }, [socket]);

  // ─── STEP 3: Global notification listener ────────────────────────────────
  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (notif) => {
      console.log("🔔 New Notification:", notif);

      const notifId = notif._id || notif.id || notif.notificationId;
      if (notifId && processedNotifications.current.has(notifId)) {
        console.log("🔔 Duplicate notification ignored:", notifId);
        return;
      }

      if (notifId) {
        processedNotifications.current.add(notifId);
      }

      const deletedNotifications = JSON.parse(
        localStorage.getItem("deletedNotifications") || "[]"
      );
      if (deletedNotifications.includes(notifId)) {
        console.log("🔔 Previously deleted notification ignored:", notifId);
        return;
      }

      addNotification(notif);

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
    return () => socket.off("newNotification", handleNotification);
  }, [socket, user, addNotification]);


  // ─── STEP 4: Location tracking ───────────────────────────────────────────
  useEffect(() => {
    if (!socket || !user || !navigator.geolocation) return;

    let lastCoords = null;
    const THRESHOLD = 0.0001;

    const hasMoved = (prev, curr) => {
      if (!prev) return true;
      return (
        Math.abs(prev[0] - curr[0]) > THRESHOLD ||
        Math.abs(prev[1] - curr[1]) > THRESHOLD
      );
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


  // ─── STEP 5: Global message listener ─────────────────────────────────────
  useEffect(() => {
    if (!socket || !user) return;

     const handleReceiveMessage = (msg) => {
      if (!msg?._id) return;
      if (msg.from_user_id === user._id) return;
      if (processed.current.has(msg._id)) return;
      processed.current.add(msg._id);
      if (processed.current.size > 200) {
        processed.current = new Set([...processed.current].slice(-100));
      }
      // ✅ FIX-2: Only update MessageContext lastMessages cache.
      // Do NOT dispatch window event — ChatBox listens to socket directly.
      // The window event caused ChatBox to process the same message twice.
      updateLastMessage(msg.from_user_id, msg);
    };

    const handleNewMessageAlert = (data) => {
      const { from_user_id, message } = data;
      if (!message?._id) return;
      if (from_user_id === user._id) return;
      if (processed.current.has(message._id)) return;
      processed.current.add(message._id);
      if (processed.current.size > 200) {
        processed.current = new Set([...processed.current].slice(-100));
      }
      updateLastMessage(from_user_id, message);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("newMessageAlert", handleNewMessageAlert);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("newMessageAlert", handleNewMessageAlert);
    };
  }, [socket, user, addUnread, updateLastMessage]);


  // ─── STEP 6: Message read receipts ───────────────────────────────────────
  useEffect(() => {
    if (!socket || !user) return;

    const handleMessageRead = ({ messageId, chatId, from_user_id }) => {
      console.log("✅ Message read:", messageId, "from", from_user_id);
      markAsRead(from_user_id);
      window.dispatchEvent(
        new CustomEvent("messageRead", {
          detail: { messageId, chatId, from_user_id },
        })
      );
    };

    socket.on("messageRead", handleMessageRead);
    return () => socket.off("messageRead", handleMessageRead);
  }, [socket, user, markAsRead]);


  // ─── STEP 7: Message delivered status ────────────────────────────────────
  useEffect(() => {
    if (!socket || !user) return;

    const handleMessageDelivered = ({ messageId, chatId, status, deliveredAt }) => {
      console.log("📦 Message delivered:", messageId, "in chat:", chatId);
      window.dispatchEvent(
        new CustomEvent("message-delivered", {
          detail: { messageId, chatId, status, deliveredAt },
        })
      );
    };

    socket.on("message-delivered", handleMessageDelivered);
    return () => socket.off("message-delivered", handleMessageDelivered);
  }, [socket, user]);


const value = useMemo(
    () => ({ socket, connected, onlineUsers }),
    [socket, connected, onlineUsers]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);