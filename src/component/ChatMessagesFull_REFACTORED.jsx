/**
 * ChatMessagesFull - REFACTORED VERSION
 * 
 * This is a clean refactored version showing how to integrate useSeenManager hook.
 * Shows ONLY the relevant changes - the rest of your component remains the same.
 * 
 * KEY CHANGES:
 * 1. Import useSeenManager hook
 * 2. Remove manual seen logic (moved to hook)
 * 3. Simplify scroll handling
 * 4. Use hook return values for UI
 * 5. Pass message ref setter to hook
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import AudioMessage from "./shared/AudioMessage";
import { Check, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";
import { FaArrowDown } from "react-icons/fa";
import MediaViewer from "./shared/MediaViewer";
import BackButton from "./shared/BackButton";
import axiosBase from "../utils/axiosBase";
import { useSocket } from "../context/SocketContext";
import MessageOptionsDropdown from "./MessageOptionsDropdown";
import useSeenManager from "../hooks/useSeenManager"; // ← NEW IMPORT

const ChatMessagesFull = ({
    messages,
    setMessages,
    chatId,
    scrollDirection,
    scrollStopped,  // Parent passes scroll state
    containerRef,
    user,
    resendMessage,
    imageMessages,
    setCurrentImageIndex,
    currentImageIndex,
    setShowMediaViewer,
    showMediaViewer,
    formatTime,
    typingUser,
    typingUserFromId,
    showScrollButton,
    scrollToBottom: parentScrollToBottom, // May be used by other logic
    scrollToMessage,
    scrollToReplyMessage,
    setReplyTo,
    receiver,
    inputRef,
}) => {
    // ==========================================
    // HOOKS
    // ==========================================

    const { socket, connected, onlineUsers } = useSocket();

    // ✅ Initialize seen manager with all required dependencies
    const seenManager = useSeenManager({
        messages,
        setMessages,
        chatId,
        userId: user._id,
        socket,
        containerRef,
        scrollStopped,
        scrollStopDebounce: 1200, // Customize debounce if needed
    });

    // ==========================================
    // MESSAGE OPTIONS DROPDOWN STATE
    // ==========================================

    const [dropdownState, setDropdownState] = useState({
        isOpen: false,
        message: null,
        position: { x: 0, y: 0 },
    });

    // ==========================================
    // READ MORE FUNCTIONALITY
    // ==========================================

    const [expandedMessages, setExpandedMessages] = useState(new Set());
    const CHARACTER_THRESHOLD = 200;

    const toggleMessageExpansion = useCallback((messageId) => {
        setExpandedMessages((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            } else {
                newSet.add(messageId);
            }
            return newSet;
        });
    }, []);

    const getDisplayText = (text, messageId) => {
        if (!text || text.length <= CHARACTER_THRESHOLD) return text;
        if (expandedMessages.has(messageId)) return text;
        return text.substring(0, CHARACTER_THRESHOLD) + "...";
    };

    const shouldShowReadMore = (text) => {
        return text && text.length > CHARACTER_THRESHOLD;
    };

    // ==========================================
    // MESSAGE INTERACTION HANDLERS
    // ==========================================

    const longPressTimer = useRef(null);
    const isLongPress = useRef(false);
    const messageRefs = useRef({});

    const handleMessageInteraction = useCallback((msg, event, messageEl) => {
        event.preventDefault();

        const rect = messageEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top - 10;

        setDropdownState({
            isOpen: true,
            message: msg,
            position: { x, y },
        });
    }, []);

    const handleDoubleClick = useCallback((msg, event) => {
        const messageEl = event.currentTarget.closest("[data-id]");
        if (messageEl) {
            handleMessageInteraction(msg, event, messageEl);
        }
    }, [handleMessageInteraction]);

    const handleContextMenu = useCallback((msg, event) => {
        const messageEl = event.currentTarget;
        handleMessageInteraction(msg, event, messageEl);
    }, [handleMessageInteraction]);

    const handleTouchStart = useCallback((msg, event) => {
        const messageEl = event.currentTarget;
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            const rect = messageEl.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top - 10;

            setDropdownState({
                isOpen: true,
                message: msg,
                position: { x, y },
            });
        }, 400);
    }, []);

    const handleTouchEnd = useCallback((event) => {
        if (isLongPress.current) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const closeDropdown = useCallback(() => {
        setDropdownState({
            isOpen: false,
            message: null,
            position: { x: 0, y: 0 },
        });
    }, []);

    const handleReplyFromDropdown = useCallback(
        (msg) => {
            if (setReplyTo) {
                const sentByUser = msg.from_user_id === user._id;
                setReplyTo({
                    _id: msg._id,
                    text: msg.text ||
                        (msg.message_type === "image"
                            ? "Image"
                            : msg.message_type === "audio"
                                ? "Audio"
                                : "Message"),
                    from_user_id: msg.from_user_id,
                    name: sentByUser ? "You" : receiver?.name || "User",
                    message_type: msg.message_type,
                });

                setTimeout(() => {
                    if (inputRef?.current) {
                        inputRef.current.focus();
                    }
                }, 100);
            }
        },
        [setReplyTo, user._id, receiver, inputRef]
    );

    const handleCopyText = useCallback((text) => {
        if (text) {
            navigator.clipboard.writeText(text);
        }
    }, []);

    // ==========================================
    // MESSAGE DELETION
    // ==========================================

    const handleDeleteMessage = useCallback(
        async (messageId, deleteForEveryone) => {
            if (deleteForEveryone) {
                if (setMessages) {
                    try {
                        await axiosBase.delete(`/api/chat/message/${messageId}`);

                        if (socket) {
                            socket.emit("messageDeleted", {
                                messageId,
                                chatId,
                            });
                        }

                        setMessages((prev) =>
                            prev.filter((msg) => msg._id !== messageId)
                        );
                    } catch (error) {
                        console.error("Error deleting message for everyone:", error);
                    }
                }
            } else {
                if (setMessages) {
                    try {
                        await axiosBase.delete(`/api/chat/message/${messageId}/for-me`);
                        setMessages((prev) =>
                            prev.filter((msg) => msg._id !== messageId)
                        );
                    } catch (error) {
                        console.error("Error deleting message for me:", error);
                    }
                }
            }
        },
        [setMessages, socket, chatId]
    );

    // ==========================================
    // MESSAGE GROUPING
    // ==========================================

    const groupedMessages = messages.reduce((acc, msg) => {
        const messageDate = new Date(msg.createdAt);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let dateKey;
        if (messageDate.toDateString() === today.toDateString()) {
            dateKey = "Today";
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            dateKey = "Yesterday";
        } else {
            dateKey = messageDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        }

        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(msg);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedMessages).sort((a, b) => {
        const dateA = new Date(groupedMessages[a][0].createdAt);
        const dateB = new Date(groupedMessages[b][0].createdAt);
        return dateA - dateB;
    });

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="relative flex flex-col min-h-full pb-24">
            <div className="space-y-2 max-w-4xl mx-auto w-full px-2 pt-4">
                {sortedDates.map((date) => (
                    <div key={date} className="flex flex-col">
                        {/* Date Separator */}
                        <div className="flex justify-center my-3 sticky top-4 z-10 pointer-events-none">
                            <span
                                className="px-3 py-1 text-[11px] font-medium shadow-sm text-gray-600"
                                style={{
                                    borderRadius: "12px",
                                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                                    backdropFilter: "blur(8px)",
                                    WebkitBackdropFilter: "blur(8px)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    height: "24px",
                                }}
                            >
                                {date}
                            </span>
                        </div>

                        {/* Messages for this date */}
                        {groupedMessages[date].map((msg) => {
                            const sentByUser = msg.from_user_id === user._id;

                            return (
                                <div
                                    key={msg._id}
                                    data-message-id={msg._id}
                                    id={`msg_${msg._id}`}
                                    ref={(el) => {
                                        if (el) {
                                            messageRefs.current[msg._id] = el;
                                            // ✅ IMPORTANT: Tell hook about this ref
                                            seenManager.setMessageRef(msg._id, el);
                                        }
                                    }}
                                    onContextMenu={(e) => handleContextMenu(msg, e)}
                                    onDoubleClick={(e) => handleDoubleClick(msg, e)}
                                    onTouchStart={(e) => handleTouchStart(msg, e)}
                                    onTouchEnd={handleTouchEnd}
                                    className={`flex flex-col group relative mb-4 ${sentByUser ? "items-end" : "items-start"
                                        }`}
                                >
                                    {/* Message bubble */}
                                    <div
                                        data-id={msg._id}
                                        id={`msg_${msg._id}`}
                                        className={`p-2 text-sm max-w-[75%] min-w-[120px] rounded-[18px] shadow-sm break-words relative transition-all duration-200
                      ${sentByUser
                                                ? msg.failed
                                                    ? "bg-red-100 text-red-700 border mb-2 border-red-400 rounded-br-none"
                                                    : "bg-[var(--primary)] text-white rounded-bl-lg"
                                                : "bg-white text-gray-900 rounded-br-lg"
                                            }`}
                                    >
                                        {/* Replied Message Preview */}
                                        {msg.replyTo && (
                                            <div
                                                className={`mb-2 pb-2 px-2 py-1.5 -mx-1 cursor-pointer hover:opacity-85 transition-opacity rounded-md`}
                                                style={{
                                                    backgroundColor: sentByUser
                                                        ? "rgba(255, 255, 255, 0.15)"
                                                        : "rgba(255, 255, 255, 0.12)",
                                                    backdropFilter: "blur(8px)",
                                                    WebkitBackdropFilter: "blur(8px)",
                                                    border: sentByUser
                                                        ? "1px solid rgba(255, 255, 255, 0.2)"
                                                        : "1px solid rgba(255, 255, 255, 0.15)",
                                                }}
                                                onClick={() => {
                                                    if (scrollToReplyMessage && msg.replyTo) {
                                                        scrollToReplyMessage(msg.replyTo);
                                                    }
                                                }}
                                                title="Click to view original message"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div
                                                        className="w-0.5 rounded-full mt-1 flex-shrink-0"
                                                        style={{
                                                            backgroundColor: sentByUser
                                                                ? "rgba(255, 255, 255, 0.6)"
                                                                : "rgba(255, 255, 255, 0.5)",
                                                        }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <span
                                                            className="text-xs font-medium"
                                                            style={{ color: "rgba(255,255,255,0.9)" }}
                                                        >
                                                            {msg.replyTo.from_user_id === user._id
                                                                ? "You"
                                                                : receiver?.name || "User"}
                                                        </span>
                                                        <p
                                                            className={`text-xs truncate ${sentByUser
                                                                    ? "text-white/60"
                                                                    : "text-white/60"
                                                                }`}
                                                        >
                                                            {msg.replyTo.text ||
                                                                (msg.replyTo.message_type === "image"
                                                                    ? "📷 Image"
                                                                    : msg.replyTo.message_type === "audio"
                                                                        ? "🎤 Audio"
                                                                        : "Message")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Text Message */}
                                        {msg.message_type === "text" && (
                                            <div className="flex flex-col gap-1">
                                                <p>{getDisplayText(msg.text, msg._id)}</p>
                                                {shouldShowReadMore(msg.text) && (
                                                    <button
                                                        onClick={() => toggleMessageExpansion(msg._id)}
                                                        className="flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity mt-1"
                                                        style={{
                                                            color: sentByUser
                                                                ? "rgba(255, 255, 255, 0.9)"
                                                                : "var(--primary)",
                                                        }}
                                                    >
                                                        {expandedMessages.has(msg._id) ? (
                                                            <>
                                                                <ChevronUp size={14} />
                                                                Read less
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown size={14} />
                                                                Read more
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Image Message */}
                                        {msg.message_type === "image" && msg.media_url && (
                                            <img
                                                src={msg.media_url}
                                                alt="chat media"
                                                className="w-full max-w-xs rounded-lg mb-1 object-cover cursor-pointer transition-transform hover:scale-[1.02]"
                                                onClick={() => {
                                                    const index = imageMessages.findIndex(
                                                        (img) => img.media_url === msg.media_url
                                                    );
                                                    setCurrentImageIndex(index);
                                                    setShowMediaViewer(true);
                                                }}
                                            />
                                        )}

                                        {/* Audio Message */}
                                        {msg.message_type === "audio" && msg.media_url && (
                                            <AudioMessage msg={msg} />
                                        )}
                                    </div>

                                    {/* ✅ MESSAGE STATUS - REFACTORED */}
                                    <div
                                        className="flex items-center justify-end gap-1 mt-1 text-[10px]"
                                        style={{ color: "var(--primary)" }}
                                    >
                                        <span>{formatTime(msg.createdAt)}</span>
                                        {sentByUser && (
                                            <span className="ml-1 flex items-center gap-1 text-xs">
                                                {msg.status === "sending" && (
                                                    <span className="text-gray-500 animate-pulse">
                                                        Sending...
                                                    </span>
                                                )}
                                                {msg.failed && (
                                                    <>
                                                        <button onClick={() => resendMessage(msg)}>
                                                            ↻ Retry
                                                        </button>
                                                        <button onClick={() => { }}>✖ Cancel</button>
                                                    </>
                                                )}
                                                {msg.status !== "sending" && !msg.failed && (
                                                    <span className="flex items-center">
                                                        {/* For sent messages: check if receiver saw them */}
                                                        {sentByUser ? (
                                                            seenManager.receiverLastSeen &&
                                                                new Date(msg.createdAt) <=
                                                                new Date(
                                                                    seenManager.receiverLastSeen.createdAt ||
                                                                    seenManager.receiverLastSeen
                                                                ) ? (
                                                                <CheckCheck
                                                                    size={14}
                                                                    className="text-blue-500"
                                                                    title={`Seen at ${seenManager.receiverLastSeen?.createdAt
                                                                            ? formatTime(
                                                                                seenManager.receiverLastSeen.createdAt
                                                                            )
                                                                            : ""
                                                                        }`}
                                                                />
                                                            ) : msg.status === "delivered" ||
                                                                seenManager.receiverLastSeen ? (
                                                                <CheckCheck
                                                                    size={14}
                                                                    className="text-[var(--input-delivered-check)]"
                                                                />
                                                            ) : (
                                                                <Check
                                                                    size={14}
                                                                    className="text-[var(--input-sent-check)]"
                                                                />
                                                            )
                                                        ) : (
                                                            /* For received messages: use hook's isMessageSeen */
                                                            seenManager.isMessageSeen(msg) ? (
                                                                <CheckCheck
                                                                    size={14}
                                                                    className="text-blue-500"
                                                                    title={`Seen at ${msg.seenAt ? formatTime(msg.seenAt) : ""
                                                                        }`}
                                                                />
                                                            ) : msg.status === "delivered" ||
                                                                seenManager.receiverLastSeen ? (
                                                                <CheckCheck
                                                                    size={14}
                                                                    className="text-[var(--input-delivered-check)]"
                                                                />
                                                            ) : (
                                                                <Check
                                                                    size={14}
                                                                    className="text-[var(--input-sent-check)]"
                                                                />
                                                            )
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Typing Indicator */}
                {typingUser && (
                    <div
                        className={`flex ${typingUserFromId === user._id ? "justify-end" : "justify-start"
                            } px-4 mb-2`}
                    >
                        <div
                            className={`typing-indicator ${typingUserFromId === user._id ? "sender" : "receiver"
                                }`}
                        >
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Media Viewer */}
            {showMediaViewer && (
                <MediaViewer
                    post={{
                        attachments: imageMessages.map((img) => ({ url: img.media_url })),
                        content: "",
                    }}
                    initialIndex={currentImageIndex}
                    onClose={() => setShowMediaViewer(false)}
                />
            )}

            {/* ✅ SCROLL TO BOTTOM BUTTON - WITH UNSEEN COUNT */}
            {showScrollButton && (
                <button
                    onClick={() => {
                        requestAnimationFrame(() => {
                            seenManager.scrollToBottom();
                        });
                    }}
                    className="fixed bottom-35 right-8 flex items-center justify-center w-12 h-12 rounded-full shadow-xl transition-all duration-300 z-50 cursor-pointer border border-white/40 hover:scale-110 active:scale-95"
                    style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                    }}
                >
                    <div className="relative flex items-center justify-center">
                        <FaArrowDown size={16} className="text-gray-800 drop-shadow-sm" />

                        {/* ✅ Unseen Count Badge */}
                        {seenManager.hasUnseenMessages && (
                            <div
                                className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-xs font-bold text-white"
                                style={{
                                    backgroundColor: "var(--primary)",
                                }}
                            >
                                {seenManager.getUnseenCountLabel()}
                            </div>
                        )}
                    </div>
                </button>
            )}

            {/* Message Options Dropdown */}
            {dropdownState.isOpen && dropdownState.message && (
                <MessageOptionsDropdown
                    message={dropdownState.message}
                    position={dropdownState.position}
                    onClose={closeDropdown}
                    onReply={handleReplyFromDropdown}
                    onCopy={handleCopyText}
                    onDelete={handleDeleteMessage}
                    sentByUser={dropdownState.message?.from_user_id === user._id}
                />
            )}
        </div>
    );
};

export default ChatMessagesFull;
