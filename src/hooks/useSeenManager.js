import { useEffect, useCallback, useRef, useState } from "react";
import axiosBase from "../utils/axiosBase";

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
    const [lastSeenMessage, setLastSeenMessage] = useState(null);
    const [receiverLastSeen, setReceiverLastSeen] = useState(null);
    const [unseenBelowCount, setUnseenBelowCount] = useState(0);

    const lastEmittedMessageIdRef = useRef(null);
const [hasInitialized, setHasInitialized] = useState(false);
  const messageRefs = useRef({});
  const isInitializingRef = useRef(false);
  const scrollDirectionRef = useRef("down");
  const isScrollingUpRef = useRef(false);
  const lastScrollTop = useRef(0);
  const lastSeenMessageRef = useRef(lastSeenMessage);
  const messagesRef = useRef(messages);
    const instrumentationRef = useRef({
        scrollStopRuns: 0,
        observerRuns: 0,
        backendFetches: 0,
        updateLastSeenCalls: 0,
    });

    const lastObserverEmit = useRef(0); // timestamp of last observer batch emit
    const scrollStopTimer = useRef(null); // ✅ FIX: add missing ref

    const debugEnabled = process.env.NODE_ENV === "development";
    const logSeenEvent = useCallback((step, details = {}) => {
        if (!debugEnabled) return;
        // console.log("[SeenManager]", step, {
        //     chatId,
        //     userId,
        //     lastSeenMessage: lastSeenMessage?._id,
        //     unseenBelowCount,
        //     hasInitialized,
        //     ...details,
        // });
    }, [chatId, userId, lastSeenMessage, unseenBelowCount, hasInitialized, debugEnabled]);
// useSeenManager.jsx — add near top of hook

useEffect(() => { messagesRef.current = messages; }, [messages]);
useEffect(() => {
    lastSeenMessageRef.current = lastSeenMessage;
}, [lastSeenMessage]);

    const isMessageNewer = useCallback((msgA, msgB) => {
        if (!msgA || !msgB) return false;
        return new Date(msgA.createdAt) > new Date(msgB.createdAt);
    }, []);

    
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
                const msg = messagesRef.current.find((m) => m._id === msgId);
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
// useSeenManager.jsx — replace calculateUnseenBelowCount
const calculateUnseenBelowCount = useCallback((overrideLastSeen) => {
    const baseline = overrideLastSeen !== undefined ? overrideLastSeen : lastSeenMessage;
    
    if (messages.length === 0) {
        setUnseenBelowCount(0);
        return 0;
    }

    const count = messages.filter(
        (msg) =>
            msg.from_user_id !== userId &&
            !String(msg._id).startsWith('temp_') &&
            // If no baseline, ALL other-user messages are unseen
            (!baseline || new Date(msg.createdAt) > new Date(baseline.createdAt))
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
                        // console.log("✅ REST persistence success");
                        // console.log("Response:", response?.data);
                    } catch (err) {
                        // console.warn("⚠️ REST persistence failed:");
                        // console.warn(err);
                        // console.warn("Continuing to socket emit anyway...");
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

                instrumentationRef.current.updateLastSeenCalls += 1;
                logSeenEvent("updateLastSeenOnBackend.start", {
                    callNumber: instrumentationRef.current.updateLastSeenCalls,
                    messageId,
                });

                // console.log("📡 Emitting socket event: updateLastSeen");
                // console.log("Socket payload:", socketPayload);

                socket.emit("updateLastSeen", socketPayload);

                console.log("✅ Socket emit completed");
            } catch (error) {
                // console.error("🔥 Error inside updateLastSeenOnBackend:");
                // console.error(error);
                lastEmittedMessageIdRef.current = null;
                console.warn("Reset lastEmittedMessageIdRef due to error");
            }
        },
        [socket, chatId, userId, logSeenEvent]
    );

    /**
     * Fetch last seen state from backend on chat open
     */
    const fetchLastSeenFromBackend = useCallback(async () => {
        if (!chatId) return;
        if (isInitializingRef.current) return;

        instrumentationRef.current.backendFetches += 1;
        logSeenEvent("fetchLastSeenFromBackend.start", {
            backendFetches: instrumentationRef.current.backendFetches,
        });

        isInitializingRef.current = true;

        try {
            const response = await axiosBase.get(`/api/chat/${chatId}/last-seen`);

            //console.log(`after calling /api/chat/${chatId}/last-seen this is the response`, response);

            if (response.data?.message) {
                setLastSeenMessage(response.data.message);
                logSeenEvent("fetchLastSeenFromBackend.receivedMessage", {
                    messageId: response.data.message._id,
                });
            }

            if (response.data?.receiverLastSeen) {
                setReceiverLastSeen(response.data.receiverLastSeen);
            }

            setHasInitialized(true);
        } catch (error) {
            console.warn("Failed to fetch last seen:", error);
            setHasInitialized(true);
        } finally {
            isInitializingRef.current = false;
        }
    }, [chatId, logSeenEvent]);

    /**
     * Handle scroll stop — updates seen status when user pauses while scrolling down
     */
    const handleScrollStop = useCallback(() => {
        instrumentationRef.current.scrollStopRuns += 1;
        logSeenEvent("handleScrollStop.start", {
            scrollStopRuns: instrumentationRef.current.scrollStopRuns,
            scrollDirection: scrollDirectionRef.current,
        });

        if (!containerRef.current) return;
        if (messages.length === 0) return;
        if (scrollDirectionRef.current === "up") return;
        if (isScrollingUpRef.current) return;
        const lastVisible = getLastVisibleMessage();
        if (!lastVisible) return;

        logSeenEvent("handleScrollStop.lastVisible", {
            lastVisibleId: lastVisible._id,
            fromUserId: lastVisible.from_user_id,
        });

        // ✅ FIX: guard temp IDs in scroll handler too
        if (typeof lastVisible._id === 'string' && lastVisible._id.startsWith('temp_')) return;

        // ✅ NEW: Prevent duplicate if observer just emitted (within 2s)
        const now = Date.now();
        if (now - lastObserverEmit.current < 2000) {
            logSeenEvent("handleScrollStop.skipped", { reason: "observer_recently_emitted" });
            return;
        }

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
            const otherMessages = messagesRef.current.filter(m =>
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

 


// In onContainerScroll, update it:
const onContainerScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const direction = scrollTop > lastScrollTop.current ? "down" : "up";

    scrollDirectionRef.current = direction;
    isScrollingUpRef.current = direction === "up"; // ✅ track scroll up
    lastScrollTop.current = scrollTop;

    logSeenEvent("onContainerScroll", {
        direction,
        scrollTop,
    });

    if (direction === "up") {
        if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);
        return;
    }

    if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);

    scrollStopTimer.current = setTimeout(() => {
        if (scrollDirectionRef.current === "down") {
            handleScrollStop();
        }
    }, scrollStopDebounce);
}, [handleScrollStop, containerRef, logSeenEvent, scrollStopDebounce]);

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
            const otherMessages = messagesRef.current.filter(m =>
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


const scrollToLastSeen = useCallback(() => {
    return new Promise((resolve) => {
        if (!containerRef.current || !lastSeenMessage) return resolve(false);

        const tryScroll = () => {
            const msgEl = document.getElementById(`msg_${lastSeenMessage._id}`);
            if (!msgEl) return resolve(false);

            // scrollIntoView is reliable regardless of offsetParent chain
            msgEl.scrollIntoView({ block: 'center' });
            resolve(true);
        };

        // Wait for images in the container to finish loading first
        const allImgs = containerRef.current.querySelectorAll('img');
        const pendingImages = Array.from(allImgs).filter(img => !img.complete);

        if (pendingImages.length === 0) {
            // Small rAF delay to ensure layout is committed
            requestAnimationFrame(() => requestAnimationFrame(tryScroll));
            return;
        }

        let settled = false;
        const settle = () => {
            if (settled) return;
            settled = true;
            pendingImages.forEach(img => {
                img.removeEventListener('load', settle);
                img.removeEventListener('error', settle);
            });
            requestAnimationFrame(() => requestAnimationFrame(tryScroll));
        };

        pendingImages.forEach(img => {
            img.addEventListener('load', settle);
            img.addEventListener('error', settle);
        });

        // Hard timeout — don't wait forever for slow images
        setTimeout(() => settle(), 2000);
    });
}, [lastSeenMessage, containerRef]);

    // ==========================================
    // EFFECTS - Initialization
    // ==========================================

    /**
     * Reset state and fetch from backend on chatId change
     */
    useEffect(() => {
        if (!chatId) return;

        setHasInitialized(false);
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
        if (!hasInitialized) return;
        calculateUnseenBelowCount();
    }, [messages, lastSeenMessage, calculateUnseenBelowCount, hasInitialized]);

   useEffect(() => {
        if (!enabled) return; // ✅ gate — 600ms delay from ChatMessagesFull
        if (!hasInitialized) return;
        if (!socket?.connected || !userId || !chatId) return;
        if (!containerRef?.current || messagesRef.current.length === 0) return;

        const seenCache = new Set();
        let batchTimeout = null;
        const pendingBatch = new Set();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
 
                if (isScrollingUpRef.current) return;

                const el = entry.target;
                const messageId = el.dataset.messageId;
                const fromUserId = el.dataset.fromUserId;

                if (!messageId) return;
                if (messageId.startsWith('temp_')) return;
                if (fromUserId === userId) return;
                if (seenCache.has(messageId)) return;

                // ✅ NEW: Check if already marked seen by scroll-stop
                const msg = messagesRef.current.find(m => m._id?.toString() === messageId);
                if (msg && new Date(msg.createdAt) <= new Date(lastSeenMessageRef.current?.createdAt || 0)) return

                seenCache.add(messageId);
                pendingBatch.add(messageId);
            });

            if (pendingBatch.size > 0 && !batchTimeout) {
                batchTimeout = setTimeout(() => {
                    if (pendingBatch.size > 0) {
                        instrumentationRef.current.observerRuns += 1;
                        logSeenEvent("observer.batchEmit", {
                            observerRuns: instrumentationRef.current.observerRuns,
                            messageIds: [...pendingBatch],
                        });
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
                     
                    // Optimistic update already emitted above; do not emit twice

                     lastObserverEmit.current = Date.now(); // ✅ track emit time

                        // Advance lastSeenMessage to the latest just-seen message
                        const justSeenMsgs = messagesRef.current.filter(m =>
                            pendingBatch.has(m._id?.toString())
                        );
                        if (justSeenMsgs.length > 0) {
                            const latest = justSeenMsgs.reduce((a, b) =>
                                new Date(a.createdAt) > new Date(b.createdAt) ? a : b
                            );
                            setLastSeenMessage(prev => {
                                const updated = (!prev || new Date(latest.createdAt) > new Date(prev.createdAt))
                                    ? latest
                                    : prev;
                                // ✅ Pass the updated value directly so count uses correct baseline
                                calculateUnseenBelowCount(updated);
                                return updated;
                            });
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
    }, [enabled, socket, userId, chatId, containerRef, setMessages, updateLastSeenOnBackend, messages.length]);

// EFFECT - Initial visibility check (no-scroll case)
// ==========================================
// Handles the case where the chat is short enough that everything
// is already visible and the user never scrolls — IntersectionObserver
// change-events and scroll-stop events never fire, so the last message
// from the other user never gets marked seen.
useEffect(() => {
    if (!enabled) return;
    if (!hasInitialized) return;
    if (!socket?.connected || !userId || !chatId) return;
    if (!containerRef?.current || messages.length === 0) return;

    // Run after layout settles
    const timeoutId = setTimeout(() => {
        const lastVisible = getLastVisibleMessage();
        if (!lastVisible) return;
        if (typeof lastVisible._id === 'string' && lastVisible._id.startsWith('temp_')) return;
        if (lastVisible.from_user_id === userId) return;

        // Already marked? skip
        if (
            lastSeenMessageRef.current &&
            new Date(lastVisible.createdAt) <= new Date(lastSeenMessageRef.current.createdAt)
        ) {
            return;
        }

        setLastSeenMessage(lastVisible);
        updateLastSeenOnBackend(lastVisible._id);
        calculateUnseenBelowCount(lastVisible);

        // Optimistically tick our own perspective too (mirrors observer batch logic)
        if (setMessages) {
            setMessages(prev => prev.map(msg =>
                msg._id?.toString() === lastVisible._id?.toString()
                    ? { ...msg, status: 'seen', seenAt: new Date() }
                    : msg
            ));
        }
    }, 500); // small delay so layout/images settle before measuring visibility

    return () => clearTimeout(timeoutId);
}, [
    enabled,
    hasInitialized,
    socket,
    userId,
    chatId,
    containerRef,
    messages,
    getLastVisibleMessage,
    updateLastSeenOnBackend,
    calculateUnseenBelowCount,
    setMessages,
]);
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
            if (lastSeenMessage?._id === messageId && messagesRef.current.length > 0) {
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

        // Indicates the hook has fetched initial backend state
        hasInitialized,

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