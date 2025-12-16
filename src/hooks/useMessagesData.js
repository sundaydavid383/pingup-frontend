import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axiosBase from "../utils/axiosBase";

export default function useMessagesData() {
  const [conversations, setConversations] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const socket = io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true });

  // Fetch all recent conversations
  const fetchConversations = async () => {
    try {
      const { data } = await axiosBase.get("/api/messages/recent");
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  useEffect(() => {
    fetchConversations();

    // --- Socket events ---
    const handleNewMessage = ({ from_user_id, message }) => {
      // Increase unread count
      setUnreadMap((prev) => ({
        ...prev,
        [from_user_id]: (prev[from_user_id] || 0) + 1,
      }));

      // Update or reorder conversations
      setConversations((prev) => {
        const existing = prev.find((c) => c.sender._id === from_user_id);
        if (existing) {
          return [
            {
              ...existing,
              last_message: message,
            },
            ...prev.filter((c) => c.sender._id !== from_user_id),
          ];
        }
        return prev;
      });
    };

    const handleMessageRead = ({ user_id }) => {
      setUnreadMap((prev) => {
        const copy = { ...prev };
        delete copy[user_id];
        return copy;
      });
    };

    socket.on("newMessageAlert", handleNewMessage);
    socket.on("messageRead", handleMessageRead);

    return () => {
      socket.off("newMessageAlert", handleNewMessage);
      socket.off("messageRead", handleMessageRead);
      socket.disconnect();
    };
  }, []);

  return { conversations, unreadMap, fetchConversations };
}
