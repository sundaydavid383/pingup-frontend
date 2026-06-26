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

  const { addUnread, updateLastMessage, incrementUnread, markAsRead } = useMessageContext();
  const { addNotification, notifications } = useNotificationContext();

  const processedNotifications = useRef(new Set());
  const processed = useRef(new Set());

  // ─── STEP 1: Initialize socket once ───────────────────────────────────────
  // No user dependency here — socket connects as soon as the app loads
  useEffect(() => {
    const s = io(import.meta.env.VITE_SERVER, {
      auth: { token: localStorage.getItem("token") || "" },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
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
      s.auth = { token: localStorage.getItem("token") || "" };
    });

    // ✅ Re-request online users after successful reconnect
    // so the Set is never stale after a network blip
    s.io.on("reconnect", () => {
      console.log("✅ Reconnected — refreshing online users");
      s.emit("requestOnlineUsers");
    });

    s.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection error:", err.message);
    });

    // ─── Online presence events ──────────────────────────────────────────────
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

    // Full snapshot — replaces local state entirely
    s.on("onlineUsers", (users) => {
      setOnlineUsers(new Set(users));
    });

    s.on("userLocationUpdated", ({ userId, coords }) => {
      console.log("User moved:", userId, coords);
    });

    return () => {
      console.log("🧹 Cleaning up global socket connection...");
      s.disconnect();
    };
  }, []); // ← empty deps: socket created once on mount


  // ─── STEP 2: Announce presence as soon as user + socket are ready ─────────
  // This is the key fix: joinUserRoom + heartbeat happens on APP LOAD,
  // not when a chat is opened. Your server already handles userOnline on
  // raw connection, but joinUserRoom ensures the personal notification
  // room is joined immediately too.
  useEffect(() => {
    if (!socket || !user) return;

    // Join personal room for notifications (needed even if chat never opened)
    socket.emit("joinUserRoom", user._id.toString());

    // Heartbeat to keep lastActiveAt fresh in DB
    const activityInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("userActivity");
      }
    }, 30000);

    return () => {
      clearInterval(activityInterval);
    };
  }, [socket, user]); // ← runs when socket is ready AND user is known


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
      if (processed.current.has(msg._id)) return;
      processed.current.add(msg._id);

      if (msg.from_user_id === user._id) return;

      updateLastMessage(msg.from_user_id, msg);

      window.dispatchEvent(
        new CustomEvent("newMessageAlert", {
          detail: {
            from_user_id: msg.from_user_id,
            chatId: msg.chatId,
            message: msg,
          },
        })
      );

      if (processed.current.size > 200) {
        processed.current = new Set([...processed.current].slice(-100));
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => socket.off("receiveMessage", handleReceiveMessage);
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


  return (
    <SocketContext.Provider value={{ socket, connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);