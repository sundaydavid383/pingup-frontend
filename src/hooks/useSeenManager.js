import { useEffect, useCallback, useRef, useState } from "react";
import axiosBase from "../utils/axiosBase";

/**
 * useSeenManager Hook
 * 
 * Encapsulates all message seen logic for a WhatsApp-like chat experience.
 * 
 * Responsibilities:
 * - Track last seen message based on viewport visibility
 * - Calculate unseen count below viewport
 * - Emit socket events for real-time sync
 * - Handle receiver's seen status
 * - Manage scroll stop detection
 * - Prevent race conditions & duplicate emissions
 * 
 * @param {Object} config
 * @param {Array} config.messages - Current messages array
 * @param {Function} config.setMessages - State setter for messages
 * @param {string} config.chatId - Current chat ID
 * @param {string} config.userId - Current user's ID
 * @param {Object} config.socket - Socket.io instance
 * @param {boolean} config.socket.connected - Socket connection status
 * @param {Object} config.containerRef - Ref to message container
 * @param {boolean} config.scrollStopped - Whether user has stopped scrolling
 * @param {number} config.scrollStopDebounce - Debounce delay in ms (default: 1200)
 * 
 * @returns {Object}
 * @returns {Object} lastSeenMessage - Last message user scrolled to
 * @returns {Object} receiverLastSeen - Last message receiver saw
 * @returns {number} unseenBelowCount - Unseen messages below viewport
 * @returns {Function} scrollToBottom - Scroll container to bottom
 * @returns {boolean} hasUnseenMessages - Whether any unseen messages exist
 * @returns {Function} onContainerScroll - Scroll event handler
 * @returns {Function} updateLastSeesStatus - Manually update seen status
 */
export const useSeenManager = ({
    messages,
    setMessages,
    chatId,
    userId,
    socket,
    containerRef,
    scrollStopped,
    scrollStopDebounce = 1200,
}) => {
    // ==========================================
    // STATE
    // ==========================================

    const [lastSeenMessage, setLastSeenMessage] = useState(null);
    const [receiverLastSeen, setReceiverLastSeen] = useState(null);
    const [unseenBelowCount, setUnseenBelowCount] = useState(0);

    // ==========================================
    // REFS - Prevent Race Conditions
    // ==========================================

    // Track which message ID was last emitted to socket
    const lastEmittedMessageIdRef = useRef(null);

    // Track if we've initialized from backend
    const hasInitializedRef = useRef(false);

    // Refs for all messages in DOM
    const messageRefs = useRef({});

    // Last seen message ref for scroll-to functionality
    const lastSeenMessageRef = useRef(null);

    // Track if currently initializing to prevent duplicate fetches
    const isInitializingRef = useRef(false);

    // ==========================================
    // UTILITIES
    // ==========================================

    /**
     * Compare two messages by timestamp
     * Returns true if msgA is newer than msgB
     */
    const isMessageNewer = useCallback((msgA, msgB) => {
        if (!msgA || !msgB) return false;
        return new Date(msgA.createdAt) > new Date(msgB.createdAt);
    }, []);

    /**
     * Check if a message should be marked as seen
     * A message is seen if it's at or before the lastSeenMessage threshold
     */
    const isMessageSeen = useCallback(
        (msg) => {
            if (!lastSeenMessage) return false;
            return new Date(msg.createdAt) <= new Date(lastSeenMessage.createdAt);
        },
        [lastSeenMessage]
    );



    /**
     * Get the last message currently visible in viewport
     * Uses IntersectionObserver to determine visibility
     */
    const getLastVisibleMessage = useCallback(() => {
        if (!containerRef.current) return null;

        // Get all visible message elements
        const visibleMessages = [];
        const rect = containerRef.current.getBoundingClientRect();

        Object.entries(messageRefs.current).forEach(([msgId, el]) => {
            if (!el) return;

            const msgRect = el.getBoundingClientRect();
            const msgTop = msgRect.top - rect.top;
            const msgBottom = msgRect.bottom - rect.top;
            const containerHeight = rect.height;

            // Check if message is at least 60% visible
            const visibleHeight = Math.min(msgBottom, containerHeight) - Math.max(msgTop, 0);
            const visibilityPercent = visibleHeight / msgRect.height;

            if (visibilityPercent >= 0.6) {
                const msg = messages.find((m) => m._id === msgId);
                if (msg) visibleMessages.push(msg);
            }
        });

        if (visibleMessages.length === 0) return null;

        // Return the LATEST (most recent) visible message
        return visibleMessages.reduce((latest, current) =>
            new Date(current.createdAt) > new Date(latest.createdAt)
                ? current
                : latest
        );
    }, [messages]);

    /**
     * Calculate how many unseen messages exist below the viewport
     */
    const calculateUnseenBelowCount = useCallback(() => {
        if (!lastSeenMessage || messages.length === 0) {
            setUnseenBelowCount(0);
            return 0;
        }

        // Count messages newer than lastSeenMessage
        const count = messages.filter(
            (msg) => new Date(msg.createdAt) > new Date(lastSeenMessage.createdAt)
        ).length;

        setUnseenBelowCount(count);
        return count;
    }, [lastSeenMessage, messages]);

    /**
     * Update last seen on backend and emit socket event
     * Prevents duplicate emissions using ref tracking
     */
 const updateLastSeenOnBackend = useCallback(
  async (messageId) => {
    console.log("🟢 ===== updateLastSeenOnBackend CALLED =====");
    console.log("Incoming messageId:", messageId);
    console.log("Current chatId:", chatId);
    console.log("Current userId:", userId);
    console.log("Socket connected:", socket?.connected);

    if (!socket?.connected) {
      console.warn("❌ Socket not connected - cannot update last seen");
      return;
    }

    console.log("Last emitted messageId ref:", lastEmittedMessageIdRef.current);

    // DEDUPLICATION CHECK
    if (lastEmittedMessageIdRef.current === messageId) {
      console.warn("⚠️ Duplicate messageId - skipping emit");
      return;
    }

    try {
      console.log("✅ Passed deduplication check");
      lastEmittedMessageIdRef.current = messageId;

      // =========================
      // 1️⃣ Persist via REST API
      // =========================
      if (chatId) {
        console.log("📡 Sending REST request to persist last seen...");
        console.log("POST URL:", `/api/chat/${chatId}/last-seen`);
        console.log("Payload:", { messageId });

        try {
          const response = await axiosBase.post(
            `/api/chat/${chatId}/last-seen`,
            { messageId }
          );

          console.log("✅ REST persistence success");
          console.log("Response:", response?.data);
        } catch (err) {
          console.warn("⚠️ REST persistence failed:");
          console.warn(err);
          console.warn("Continuing to socket emit anyway...");
        }
      } else {
        console.warn("⚠️ chatId missing - REST call skipped");
      }

      // =========================
      // 2️⃣ Emit via Socket
      // =========================
      const socketPayload = {
        chatId,
        messageId,
        userId,
        timestamp: new Date().toISOString(),
      };

      console.log("📡 Emitting socket event: updateLastSeen");
      console.log("Socket payload:", socketPayload);

      socket.emit("updateLastSeen", socketPayload);

      console.log("✅ Socket emit completed");

    } catch (error) {
      console.error("🔥 Error inside updateLastSeenOnBackend:");
      console.error(error);

      lastEmittedMessageIdRef.current = null;
      console.warn("Reset lastEmittedMessageIdRef due to error");
    }

    console.log("🟢 ===== updateLastSeenOnBackend FINISHED =====");
  },
  [socket, chatId, userId]
);

    /**
     * Fetch last seen state from backend on chat open
     * Called once on mount to restore last position
     */
    const fetchLastSeenFromBackend = useCallback(async () => {
        if (!chatId) return;
        if (isInitializingRef.current) return;

        isInitializingRef.current = true;

        try {
            const response = await axiosBase.get(`/api/chat/${chatId}/last-seen`);

            console.log(`after calling /api/chat/${chatId}/last-seen this is the response`,
                response
            )

            if (response.data?.message) {
                setLastSeenMessage(response.data.message);
            }

            if (response.data?.receiverLastSeen) {
                setReceiverLastSeen(response.data.receiverLastSeen);
            }

            hasInitializedRef.current = true;
        } catch (error) {
            console.warn("Failed to fetch last seen:", error);
            hasInitializedRef.current = true; // Still mark as initialized
        } finally {
            isInitializingRef.current = false;
        }
    }, [chatId]);

    /**
     * Handle scroll stop - main entry point for updating seen status
     * Called when user stops scrolling for 1.2 seconds
     */
    const handleScrollStop = useCallback(() => {
        if (!scrollStopped) return;
        if (!containerRef.current) return;
        if (messages.length === 0) return;

        // Get the last visible message
        const lastVisible = getLastVisibleMessage();
        if (!lastVisible) return;

        // Only update if it's a NEW message (not current threshold)
        if (lastSeenMessage?._id === lastVisible._id) {
            return;
        }

        // Update local state
        setLastSeenMessage(lastVisible);

        // Persist to backend & emit socket
        updateLastSeenOnBackend(lastVisible._id);

        // Recalculate unseen count
        calculateUnseenBelowCount();
    }, [
        scrollStopped,
        messages,
        lastSeenMessage,
        getLastVisibleMessage,
        updateLastSeenOnBackend,
        calculateUnseenBelowCount,
    ]);

        // Add these refs at the top inside useSeenManager
const lastScrollTop = useRef(0);
const scrollStopTimer = useRef(null);

// Scroll handler - only updates last seen when scrolling DOWN
const onContainerScroll = useCallback(() => {
  if (!containerRef.current) return;

  const scrollTop = containerRef.current.scrollTop;
  const direction = scrollTop > lastScrollTop.current ? 'down' : 'up';
  lastScrollTop.current = scrollTop;

  // Only mark last seen when scrolling down
  if (direction === 'down') {
    if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);

    scrollStopTimer.current = setTimeout(() => {
      handleScrollStop(); // already exists in your hook
    }, scrollStopDebounce); // 1200ms by default
  }
}, [scrollStopDebounce, handleScrollStop]);

    /**
     * Scroll to bottom and mark as seen
     * Typically called when user clicks the scroll-down button
     */
    const scrollToBottom = useCallback((smooth = true) => {
        if (!containerRef.current) return;

        containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });

        // Give a moment for scroll to complete, then mark as seen
        setTimeout(() => {
            if (messages.length > 0) {
                const latestMsg = messages[messages.length - 1];
                setLastSeenMessage(latestMsg);
                updateLastSeenOnBackend(latestMsg._id);
                setUnseenBelowCount(0);
            }
        }, smooth ? 300 : 100);
    }, [messages, updateLastSeenOnBackend]);

    /**
     * Scroll to the last seen message - used on initial chat load
     * This allows users to continue from where they left off
     */
    const scrollToLastSeen = useCallback(() => {
        if (!containerRef.current || !lastSeenMessage) return;
        
        // Find the message element
        const msgEl = document.getElementById(`msg_${lastSeenMessage._id}`);
        if (msgEl) {
            msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            console.log("scroll to the lastseen message...")
            return true;
        }
        return false;
    }, [lastSeenMessage]);

    // ==========================================
    // EFFECTS - Initialization
    // ==========================================

    /**
     * Fetch last seen state on mount and chatId change
     */
    useEffect(() => {
        if (!chatId) return;

        // Reset on chat change
        hasInitializedRef.current = false;
        lastEmittedMessageIdRef.current = null;
        setLastSeenMessage(null);
        setReceiverLastSeen(null);
        setUnseenBelowCount(0);

        // Fetch from backend
        fetchLastSeenFromBackend();
    }, [chatId, fetchLastSeenFromBackend]);

    /**
     * Handle scroll stop detection
     * This is the MAIN trigger for marking messages as seen
     */
    useEffect(() => {
        handleScrollStop();
    }, [scrollStopped, handleScrollStop]);

    /**
     * Recalculate unseen count when messages change or lastSeenMessage changes
     */
    useEffect(() => {
        calculateUnseenBelowCount();
    }, [messages, lastSeenMessage, calculateUnseenBelowCount]);

    // ==========================================
    // EFFECTS - Socket Listeners
    // ==========================================

    /**
     * Listen for receiver's seen updates
     * When other user sees our messages
     */
    useEffect(() => {
        if (!socket) return;

        socket.on(
            "receiverSeenMessage",
            ({ chatId: seenChatId, messageId, userId: seenByUserId, createdAt }) => {
                // Ignore if different chat
                if (chatId !== seenChatId) return;
                if (seenByUserId === userId) return; // Ignore our own events

                // Update receiver's last seen
                setReceiverLastSeen((prev) => {
                    // Only update if newer
                    if (
                        prev &&
                        new Date(prev.createdAt) >= new Date(createdAt)
                    ) {
                        return prev;
                    }
                    return {
                        messageId,
                        createdAt,
                        userId: seenByUserId,
                    };
                });

                // Update message statuses to show blue checkmarks
                if (setMessages) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            new Date(msg.createdAt) <= new Date(createdAt)
                                ? {
                                    ...msg,
                                    status: "seen",
                                    seenBy: [...new Set([...(msg.seenBy || []), seenByUserId])],
                                    seenAt: createdAt,
                                }
                                : msg
                        )
                    );
                }
            }
        );

        return () => {
            socket.off("receiverSeenMessage");
        };
    }, [chatId, socket, userId, setMessages]);

    /**
     * Listen for when WE see someone's messages
     * (Less commonly used but kept for completeness)
     */
    useEffect(() => {
        if (!socket) return;

        socket.on(
            "userSeenMessage",
            ({ chatId: seenChatId, userId: seenUserId, messageId, createdAt }) => {
                if (chatId !== seenChatId) return;

                if (setMessages) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            new Date(msg.createdAt) <= new Date(createdAt)
                                ? {
                                    ...msg,
                                    seenBy: [
                                        ...new Set([...(msg.seenBy || []), seenUserId]),
                                    ],
                                }
                                : msg
                        )
                    );
                }
            }
        );

        return () => {
            socket.off("userSeenMessage");
        };
    }, [chatId, socket, setMessages]);

    /**
     * Listen for message deletions from other users
     */
    useEffect(() => {
        if (!socket) return;

        socket.on(
            "messageDeleted",
            ({ messageId, chatId: deletedChatId }) => {
                if (chatId !== deletedChatId) return;

                // Remove from UI
                if (setMessages) {
                    setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
                }

                // If deleted was our last seen, find new last seen
                if (lastSeenMessage?._id === messageId && messages.length > 0) {
                    const newLastSeen = messages.find(
                        (m) =>
                            new Date(m.createdAt) < new Date(messageId.createdAt)
                    );
                    setLastSeenMessage(newLastSeen || messages[0]);
                }
            }
        );

        return () => {
            socket.off("messageDeleted");
        };
    }, [chatId, socket, setMessages, lastSeenMessage, messages]);

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        // State
        lastSeenMessage,
        receiverLastSeen,
        unseenBelowCount,
        hasUnseenMessages: unseenBelowCount > 0,

        // Actions
        scrollToBottom,
        scrollToLastSeen,
        updateLastSeenOnBackend,
        onContainerScroll,

        // Refs management
        setMessageRef: (messageId, element) => {
            if (element) {
                messageRefs.current[messageId] = element;
            } else {
                delete messageRefs.current[messageId];
            }
        },

        // Utilities
        isMessageSeen,
        isMessageNewer,

        // Helpers for component
        getUnseenCountLabel: () => {
            if (unseenBelowCount === 0) return null;
            return unseenBelowCount > 99 ? "99+" : String(unseenBelowCount);
        },
    };
};

export default useSeenManager;
