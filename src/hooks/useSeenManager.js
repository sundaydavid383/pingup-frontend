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
 * @param {Object} config.containerRef - Ref to message container
 * @param {number} config.scrollStopDebounce - Debounce delay in ms (default: 1200)
 * @param {boolean} config.enabled - Gate the IntersectionObserver (default: true)
 *
 * @returns {Object}
 * @returns {Object} lastSeenMessage - Last message user scrolled to
 * @returns {Object} receiverLastSeen - Last message receiver saw
 * @returns {number} unseenBelowCount - Unseen messages below viewport
 * @returns {Function} scrollToBottom - Scroll container to bottom
 * @returns {boolean} hasUnseenMessages - Whether any unseen messages exist
 * @returns {Function} onContainerScroll - Scroll event handler
 * @returns {Function} updateLastSeenOnBackend - Manually update seen status
 */
export const useSeenManager = ({
    messages,
    setMessages,
    chatId,
    userId,
    socket,
    containerRef,
    scrollStopDebounce = 1200,
    enabled = true, // ✅ FIX: default true, actually respected now
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

    const lastEmittedMessageIdRef = useRef(null);
    const hasInitializedRef = useRef(false);
    const messageRefs = useRef({});
    const lastSeenMessageRef = useRef(null);
    const isInitializingRef = useRef(false);

    // ✅ FIX: declared ONCE here, default "down" so first-load scroll works
    // Your original declared these twice (once here, once before onContainerScroll)
    // which caused the second declaration to shadow the first with null
    const lastScrollTop = useRef(0);
    const scrollStopTimer = useRef(null);
    const scrollDirectionRef = useRef("down"); // ✅ "down" not null — critical

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
     */
    const getLastVisibleMessage = useCallback(() => {
        if (!containerRef.current) return null;

        const visibleMessages = [];
        const rect = containerRef.current.getBoundingClientRect();

        Object.entries(messageRefs.current).forEach(([msgId, el]) => {
            if (!el) return;

            const msgRect = el.getBoundingClientRect();
            const msgTop = msgRect.top - rect.top;
            const msgBottom = msgRect.bottom - rect.top;
            const containerHeight = rect.height;

            const visibleHeight = Math.min(msgBottom, containerHeight) - Math.max(msgTop, 0);
            // ✅ FIX: guard division by zero
            const visibilityPercent = msgRect.height > 0 ? visibleHeight / msgRect.height : 0;

            if (visibilityPercent >= 0.6) {
                const msg = messages.find((m) => m._id === msgId);
                if (msg) visibleMessages.push(msg);
            }
        });

        if (visibleMessages.length === 0) return null;

        return visibleMessages.reduce((latest, current) =>
            new Date(current.createdAt) > new Date(latest.createdAt)
                ? current
                : latest
        );
    }, [messages]);

    /**
     * Calculate how many unseen messages exist below the viewport
     * ✅ FIX: only counts messages from OTHER users, not your own sent messages
     */
    const calculateUnseenBelowCount = useCallback(() => {
        if (!lastSeenMessage || messages.length === 0) {
            setUnseenBelowCount(0);
            return 0;
        }

        const count = messages.filter(
            (msg) =>
                msg.from_user_id !== userId && // ✅ exclude own messages from badge count
                new Date(msg.createdAt) > new Date(lastSeenMessage.createdAt)
        ).length;

        setUnseenBelowCount(count);
        return count;
    }, [lastSeenMessage, messages, userId]);

    /**
     * Update last seen on backend and emit socket event
     * Prevents duplicate emissions using ref tracking
     */
    const updateLastSeenOnBackend = useCallback(
        async (messageId) => {
            // ✅ FIX: guard temp IDs — never mark optimistic messages as seen
            if (!messageId) return;
            if (typeof messageId === 'string' && messageId.startsWith('temp_')) {
                console.warn("⚠️ Skipping temp ID:", messageId);
                return;
            }

            if (!socket?.connected) {
                console.warn("❌ Socket not connected - cannot update last seen");
                return;
            }


            // DEDUPLICATION CHECK
            if (lastEmittedMessageIdRef.current === messageId) {
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
        },
        [socket, chatId, userId]
    );

    /**
     * Fetch last seen state from backend on chat open
     */
    const fetchLastSeenFromBackend = useCallback(async () => {
        if (!chatId) return;
        if (isInitializingRef.current) return;

        isInitializingRef.current = true;

        try {
            const response = await axiosBase.get(`/api/chat/${chatId}/last-seen`);

            console.log(`after calling /api/chat/${chatId}/last-seen this is the response`, response);

            if (response.data?.message) {
                setLastSeenMessage(response.data.message);
            }

            if (response.data?.receiverLastSeen) {
                setReceiverLastSeen(response.data.receiverLastSeen);
            }

            hasInitializedRef.current = true;
        } catch (error) {
            console.warn("Failed to fetch last seen:", error);
            hasInitializedRef.current = true;
        } finally {
            isInitializingRef.current = false;
        }
    }, [chatId]);

    /**
     * Handle scroll stop — updates seen status when user pauses while scrolling down
     */
    const handleScrollStop = useCallback(() => {
        if (!containerRef.current) return;
        if (messages.length === 0) return;

        // ✅ FIX: default is "down" so this doesn't block on first load
        if (scrollDirectionRef.current === "up") return;

        const lastVisible = getLastVisibleMessage();
        if (!lastVisible) return;

        // ✅ FIX: guard temp IDs in scroll handler too
        if (typeof lastVisible._id === 'string' && lastVisible._id.startsWith('temp_')) return;

        // Prevent backward movement
        if (
            lastSeenMessage &&
            new Date(lastVisible.createdAt) <= new Date(lastSeenMessage.createdAt)
        ) {
            return;
        }

        // Avoid duplicate update
        if (lastSeenMessage?._id === lastVisible._id) return;

        // ✅ FIX: only mark other-user messages as seen
        // If the last visible message is our own, find the latest OTHER user message instead
        if (lastVisible.from_user_id === userId) {
            const otherMessages = messages.filter(m =>
                m.from_user_id !== userId &&
                !String(m._id).startsWith('temp_')
            );
            if (otherMessages.length === 0) return;
            const latestOther = otherMessages[otherMessages.length - 1];
            if (!latestOther || lastSeenMessage?._id === latestOther._id) return;
            setLastSeenMessage(latestOther);
            updateLastSeenOnBackend(latestOther._id);
        } else {
            setLastSeenMessage(lastVisible);
            updateLastSeenOnBackend(lastVisible._id);
        }

        calculateUnseenBelowCount();
    }, [
        messages,
        lastSeenMessage,
        userId,
        getLastVisibleMessage,
        updateLastSeenOnBackend,
        calculateUnseenBelowCount,
    ]);

    const onContainerScroll = useCallback(() => {
        if (!containerRef.current) return;

        const scrollTop = containerRef.current.scrollTop;
        const direction = scrollTop > lastScrollTop.current ? "down" : "up";

        scrollDirectionRef.current = direction;
        lastScrollTop.current = scrollTop;

        // If scrolling UP → cancel any pending seen update
        if (direction === "up") {
            if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);
            return;
        }

        // Scrolling DOWN → debounce the seen update
        if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);

        scrollStopTimer.current = setTimeout(() => {
            if (scrollDirectionRef.current === "down") {
                handleScrollStop();
            }
        }, 1500);
    }, [handleScrollStop, containerRef]);

    /**
     * Scroll to bottom and mark as seen
     * ✅ FIX: only marks other-user messages as seen (not your own)
     */
    const scrollToBottom = useCallback((smooth = true) => {
        if (!containerRef.current) return;

        containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto',
        });

        setTimeout(() => {
            if (messages.length === 0) return;
            // ✅ Find the latest message from the OTHER user, not just messages[-1]
            const otherMessages = messages.filter(m =>
                m.from_user_id !== userId &&
                !String(m._id).startsWith('temp_')
            );
            if (otherMessages.length === 0) return;
            const latestOther = otherMessages[otherMessages.length - 1];
            setLastSeenMessage(latestOther);
            updateLastSeenOnBackend(latestOther._id);
            setUnseenBelowCount(0);
        }, smooth ? 300 : 100);
    }, [messages, userId, updateLastSeenOnBackend]);

    /**
     * Scroll to the last seen message — used on initial chat load
     */
const scrollToLastSeen = useCallback(() => {
    if (!containerRef.current || !lastSeenMessage) return;

    const msgEl = document.getElementById(`msg_${lastSeenMessage._id}`);
    if (!msgEl) return false;

    msgEl.scrollIntoView({ behavior: 'auto', block: 'center' });

    const doScroll = () => {
        msgEl.scrollIntoView({ behavior: 'auto', block: 'center' });
    };

    const allImgs = containerRef.current.querySelectorAll('img');
    let pendingImages = 0;

    allImgs.forEach(img => {
        if (!img.complete) {
            pendingImages++;
            const onLoad = () => {
                pendingImages--;
                if (pendingImages === 0) doScroll();
                img.removeEventListener('load', onLoad);
                img.removeEventListener('error', onLoad);
            };
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onLoad);
        }
    });

    setTimeout(doScroll, 400);
 
    console.log("scroll to the lastseen message...");
    return true;
}, [lastSeenMessage, containerRef]);

    // ==========================================
    // EFFECTS - Initialization
    // ==========================================

    /**
     * Reset state and fetch from backend on chatId change
     */
    useEffect(() => {
        if (!chatId) return;

        hasInitializedRef.current = false;
        lastEmittedMessageIdRef.current = null;
        setLastSeenMessage(null);
        setReceiverLastSeen(null);
        setUnseenBelowCount(0);

        fetchLastSeenFromBackend();
    }, [chatId, fetchLastSeenFromBackend]);

    /**
     * Recalculate unseen count when messages or lastSeen changes
     */
    useEffect(() => {
        if (!hasInitializedRef.current) return;
        calculateUnseenBelowCount();
    }, [messages, lastSeenMessage, calculateUnseenBelowCount]);

   useEffect(() => {
        if (!enabled) return; // ✅ gate — 600ms delay from ChatMessagesFull
        if (!hasInitializedRef.current) return;
        if (!socket?.connected || !userId || !chatId) return;
        if (!containerRef?.current || messages.length === 0) return;

        const seenCache = new Set();
        let batchTimeout = null;
        const pendingBatch = new Set();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const el = entry.target;
                const messageId = el.dataset.messageId;
                const fromUserId = el.dataset.fromUserId;

                if (!messageId) return;
                // ✅ Never process temp IDs
                if (messageId.startsWith('temp_')) return;
                // ✅ Only the receiver marks messages as seen — not the sender
                if (fromUserId === userId) return;
                // ✅ Session-level dedup
                if (seenCache.has(messageId)) return;

                seenCache.add(messageId);
                pendingBatch.add(messageId);
            });

            if (pendingBatch.size > 0 && !batchTimeout) {
                batchTimeout = setTimeout(() => {
                    if (pendingBatch.size > 0) {
                        console.log("📤 Emitting messages-seen-batch:", [...pendingBatch]);

                        socket.emit("messages-seen-batch", {
                            messageIds: [...pendingBatch],
                            chatId,
                            seenBy: userId,
                        });

                        // Optimistic local update
                        if (setMessages) {
                            setMessages(prev => prev.map(msg =>
                                pendingBatch.has(msg._id?.toString())
                                    ? { ...msg, status: 'seen', seenAt: new Date() }
                                    : msg
                            ));
                        }

                        // Advance lastSeenMessage to the latest just-seen message
                        const justSeenMsgs = messages.filter(m =>
                            pendingBatch.has(m._id?.toString())
                        );
                        if (justSeenMsgs.length > 0) {
                            const latest = justSeenMsgs.reduce((a, b) =>
                                new Date(a.createdAt) > new Date(b.createdAt) ? a : b
                            );
                            setLastSeenMessage(prev =>
                                !prev || new Date(latest.createdAt) > new Date(prev.createdAt)
                                    ? latest
                                    : prev
                            );
                            updateLastSeenOnBackend(latest._id);
                        }

                        pendingBatch.clear();
                    }
                    batchTimeout = null;
                }, 400);
            }
        }, {
            root: containerRef.current,
            threshold: 0.6,
        });

        // Only observe messages from the OTHER user
        const elements = containerRef.current.querySelectorAll('[data-message-id]');
        elements.forEach((el) => {
            if (el.dataset.fromUserId !== userId) {
                observer.observe(el);
            }
        });

        return () => {
            observer.disconnect();
            if (batchTimeout) clearTimeout(batchTimeout);
        };
    }, [enabled, socket, userId, chatId, messages, containerRef, setMessages, updateLastSeenOnBackend]);

    // ==========================================
    // EFFECTS - Socket Listeners
    // ==========================================

    /**
     * When the OTHER user sees OUR messages → update our ticks to blue
     */
    useEffect(() => {
        if (!socket) return;

        const handler = ({
            chatId: seenChatId,
            messageId,
            userId: seenByUserId,
            createdAt,
            seenAt,
            messageIds,
        }) => {
            if (chatId !== seenChatId) return;
            if (seenByUserId === userId) return;

            setReceiverLastSeen((prev) => {
                const newTime = createdAt || seenAt;
                if (prev && new Date(prev.createdAt) >= new Date(newTime)) return prev;
                return { messageId, createdAt: newTime, userId: seenByUserId };
            });

            if (setMessages) {
                setMessages((prev) =>
                    prev.map((msg) => {
                        const threshold = createdAt || seenAt;
                        // Update by timestamp threshold
                        if (threshold && new Date(msg.createdAt) <= new Date(threshold)) {
                            return {
                                ...msg,
                                status: "seen",
                                seenBy: [...new Set([...(msg.seenBy || []), seenByUserId])],
                                seenAt: threshold,
                            };
                        }
                        // Also catch by explicit messageIds array
                        if (messageIds && messageIds.includes(msg._id?.toString())) {
                            return {
                                ...msg,
                                status: "seen",
                                seenBy: [...new Set([...(msg.seenBy || []), seenByUserId])],
                            };
                        }
                        return msg;
                    })
                );
            }
        };

        socket.on("receiverSeenMessage", handler);
        return () => socket.off("receiverSeenMessage", handler);
    }, [chatId, socket, userId, setMessages]);

    /**
     * ✅ KEPT from your original — when WE see someone's messages
     * Useful for group chat and UI consistency
     */
    useEffect(() => {
        if (!socket) return;

        const handler = ({
            chatId: seenChatId,
            userId: seenUserId,
            messageId,
            createdAt,
        }) => {
            if (chatId !== seenChatId) return;

            if (setMessages) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        new Date(msg.createdAt) <= new Date(createdAt)
                            ? {
                                ...msg,
                                seenBy: [...new Set([...(msg.seenBy || []), seenUserId])],
                            }
                            : msg
                    )
                );
            }
        };

        socket.on("userSeenMessage", handler);
        return () => socket.off("userSeenMessage", handler);
    }, [chatId, socket, setMessages]);

    /**
     * Listen for individual message-seen events (from handleSeen in server.js)
     */
    useEffect(() => {
        if (!socket) return;

        const handler = ({ messageId, chatId: seenChatId, seenBy, seenAt }) => {
            if (chatId !== seenChatId) return;
            if (seenBy === userId) return;

            if (setMessages) {
                setMessages(prev => prev.map(msg =>
                    msg._id?.toString() === messageId?.toString()
                        ? {
                            ...msg,
                            status: 'seen',
                            seenBy: [...new Set([...(msg.seenBy || []), seenBy])],
                            seenAt,
                        }
                        : msg
                ));
            }
        };

        socket.on("message-seen", handler);
        return () => socket.off("message-seen", handler);
    }, [chatId, socket, userId, setMessages]);

    /**
     * Listen for message deletions
     * ✅ KEPT your original logic: when deleted = lastSeenMessage, find the previous one
     */
    useEffect(() => {
        if (!socket) return;

        const handler = ({ messageId, chatId: deletedChatId }) => {
            if (chatId !== deletedChatId) return;

            if (setMessages) {
                setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
            }

            // ✅ from your original: if the deleted message was our lastSeen, roll back
            if (lastSeenMessage?._id === messageId && messages.length > 0) {
                const newLastSeen = messages
                    .filter(m => m._id !== messageId)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .find(m => m.from_user_id !== userId); // find latest other-user msg
                setLastSeenMessage(newLastSeen || null);
            }
        };

        socket.on("messageDeleted", handler);
        return () => socket.off("messageDeleted", handler);
    }, [chatId, socket, setMessages, lastSeenMessage, messages, userId]);

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        lastSeenMessage,
        receiverLastSeen,
        unseenBelowCount,
        hasUnseenMessages: unseenBelowCount > 0,

        scrollToBottom,
        scrollToLastSeen,
        updateLastSeenOnBackend,
        onContainerScroll,

        setMessageRef: (messageId, element) => {
            if (element) {
                messageRefs.current[messageId] = element;
            } else {
                delete messageRefs.current[messageId];
            }
        },

        isMessageSeen,
        isMessageNewer,

        getUnseenCountLabel: () => {
            if (unseenBelowCount === 0) return null;
            return unseenBelowCount > 99 ? "99+" : String(unseenBelowCount);
        },
    };
};

export default useSeenManager;