import React, { useEffect, useRef, useState, useCallback } from "react";
import AudioMessage from "./shared/AudioMessage";
import { Check, CheckCheck } from "lucide-react";
import { FaArrowDown } from "react-icons/fa";
import MediaViewer from "./shared/MediaViewer"; // Make sure this import exists
import BackButton from "./shared/BackButton";
import axiosBase from "../utils/axiosBase";
import { useSocket } from "../context/SocketContext";
import MessageOptionsDropdown from "./MessageOptionsDropdown";

const ChatMessagesFull = ({
  messages,
  setMessages,
  chatId,
  scrollDirection,
  scrollStopped,
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
  scrollToBottom,
  scrollToMessage,
  scrollToReplyMessage,
  setReplyTo,
  receiver,
  inputRef,
}) => {
  /*
   * ===========================================
   * MESSAGE SEEN/LAST-SEEN SYSTEM
   * ===========================================
   * 
   * DATA STRUCTURE:
   * - Each conversation has a lastSeenMessage for each user
   * - Each message has: isSeen (derived), seenBy (array of user IDs), seenAt (timestamp)
   * 
   * BIDIRECTIONAL SEEN STATUS:
   * - Current user sees which messages the other user has read (via receiverLastSeen)
   * - Other user sees which messages current user has read (via lastSeenMessage)
   * 
   * HOW IT WORKS:
   * 1. When user opens a conversation, fetch lastSeenMessage from backend
   * 2. When user scrolls and stops on a message, update lastSeenMessage
   * 3. When new message arrives from other user, auto-mark as seen
   * 4. Socket events sync seen status in real-time
   * 
   * BACKEND API ENDPOINTS NEEDED:
   * - GET /api/chat/:chatId/last-seen - returns { message, receiverLastSeen }
   * - POST /api/chat/:chatId/last-seen - body: { messageId }
   * - Socket event: updateLastSeen - { chatId, messageId }
   * - Socket event: receiverSeenMessage - { chatId, messageId, userId, createdAt }
   * ===========================================
   */

  // State for message options dropdown
  const [dropdownState, setDropdownState] = useState({
    isOpen: false,
    message: null,
    position: { x: 0, y: 0 },
  });

  // Long press timer for mobile
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);
  const messageElementRefs = useRef({});

  // Handle right-click, long-press, or double-click to show dropdown
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

  // Handle double click
  const handleDoubleClick = useCallback((msg, event) => {
    const messageEl = event.currentTarget.closest('[data-id]');
    if (messageEl) {
      handleMessageInteraction(msg, event, messageEl);
    }
  }, [handleMessageInteraction]);

  // Handle right-click
  const handleContextMenu = useCallback((msg, event) => {
    const messageEl = event.currentTarget;
    handleMessageInteraction(msg, event, messageEl);
  }, [handleMessageInteraction]);

  // Handle long press (mobile) - faster response
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
    }, 400); // 400ms long press - faster on mobile
  }, []);

  const handleTouchEnd = useCallback((event) => {
    // Prevent click from firing after long press
    if (isLongPress.current) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setDropdownState({
      isOpen: false,
      message: null,
      position: { x: 0, y: 0 },
    });
  }, []);

  // Handle reply from dropdown
  const handleReplyFromDropdown = useCallback((msg) => {
    if (setReplyTo) {
      const sentByUser = msg.from_user_id === user._id;
      setReplyTo({
        _id: msg._id,
        text: msg.text || (msg.message_type === 'image' ? 'Image' : msg.message_type === 'audio' ? 'Audio' : 'Message'),
        from_user_id: msg.from_user_id,
        name: sentByUser ? 'You' : (receiver?.name || 'User'),
        message_type: msg.message_type
      });

      // Focus the input with a small delay to ensure state update is processed
      setTimeout(() => {
        if (inputRef?.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [setReplyTo, user._id, receiver, inputRef]);

  // Handle copy text
  const handleCopyText = useCallback((text) => {
    if (text) {
      navigator.clipboard.writeText(text);
    }
  }, []);

    const { socket, connected, onlineUsers } = useSocket();

  // Handle delete message
  const handleDeleteMessage = useCallback(async (messageId, deleteForEveryone) => {
    if (deleteForEveryone) {
      // Delete for everyone - call API
      if (setMessages) {
        try {
          // Call API to delete message for everyone
          await axiosBase.delete(`/api/chat/message/${messageId}`);
          
          // Emit socket event to notify other users
          if (socket) {
            socket.emit("messageDeleted", {
              messageId,
              chatId
            });
          }
          
          // Remove from UI
          setMessages(prev => prev.filter(msg => msg._id !== messageId));
        } catch (error) {
          console.error("Error deleting message for everyone:", error);
        }
      }
    } else {
      // Delete for yourself only - just hide from your view
      if (setMessages) {
        try {
          // Call API to delete just for this user
          await axiosBase.delete(`/api/chat/message/${messageId}/for-me`);
          
          // Remove from UI
          setMessages(prev => prev.filter(msg => msg._id !== messageId));
        } catch (error) {
          console.error("Error deleting message for me:", error);
        }
      }
    }
  }, [setMessages, socket, chatId]);
  // Group messages by day

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

  // Sort dates oldest → newest
  const sortedDates = Object.keys(groupedMessages).sort((a, b) => {
    const dateA = new Date(groupedMessages[a][0].createdAt);
    const dateB = new Date(groupedMessages[b][0].createdAt);
    return dateA - dateB;
  });
  const lastSeenMessageRef = useRef(null);
  const messageRefs = useRef({});

  // Replace with your user ID and chat session ID
  const lastSeenKey = `last_seen_${user._id}_${chatId}`;

  const [lastSeenMessage, setLastSeenMessage] = useState(null);
  const [receiverLastSeen, setReceiverLastSeen] = useState(null);

  // Helper to determine if a message is seen by the current user
  const isMessageSeen = useCallback((msg) => {
    if (!lastSeenMessage) return false;
    // Message is seen if its ID or timestamp is <= lastSeenMessage
    return new Date(msg.createdAt) <= new Date(lastSeenMessage.createdAt || lastSeenMessage);
  }, [lastSeenMessage]);

  // Fetch last seen when conversation opens
  useEffect(() => {
    if (!socket) return;
    if (!chatId) return;

    axiosBase
      .get(`/api/chat/${chatId}/last-seen`)
      .then(res => {
        if (res.data?.message) {
          setLastSeenMessage(res.data.message);
        }
        if (res.data?.receiverLastSeen) {
          setReceiverLastSeen(res.data.receiverLastSeen);
        }
      })
      .catch(err => console.error(err));
  }, [chatId]);

  // Update last seen only when user scrolls and stops on a message
  useEffect(() => {
    if (!messages.length) return;

    // Get the latest message in the conversation
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;

    // Remove auto-mark as seen when messages arrive - messages should only be marked as seen
    // when the user actually scrolls to view them (handled in scroll effect below)
    // This prevents messages from being marked seen just because they appeared in the chat
  }, [messages, user._id]);

  useEffect(() => {
    // Mark seen when user scrolls and STOPS on any message (both up and down)
    if (!scrollStopped) return;
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let visibleMessages = [];

        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const id = entry.target.dataset.id;
          const msg = messages.find((m) => m._id === id);
          if (msg) visibleMessages.push(msg);
        });

        if (visibleMessages.length === 0) return;

        // ✅ Pick the LAST message actually visible in viewport
        const lastVisibleMsg = visibleMessages.reduce((a, b) =>
          new Date(a.createdAt) > new Date(b.createdAt) ? a : b
        );

        // Avoid duplicate updates
        if (lastSeenMessage?._id === lastVisibleMsg._id) return;

        // Update local state
        setLastSeenMessage(lastVisibleMsg);

        // ✅ Persist to backend (uncomment when backend is ready)
        axiosBase.post(`/api/chat/${chatId}/last-seen`, {
          messageId: lastVisibleMsg._id,
        }).catch(console.error);

        // ✅ Real-time sync
        socket.emit("updateLastSeen", {
          chatId,
          messageId: lastVisibleMsg._id,
        });
      },
      {
        root: containerRef.current,
        threshold: 0.6,
      }
    );

    Object.values(messageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [scrollStopped, scrollDirection, messages]);

  // Listen for receiver's seen updates
  useEffect(() => {
    if (!socket) return;

    // When receiver sees our messages
    socket.on(
      "receiverSeenMessage",
      ({ chatId: seenChatId, messageId, userId: seenByUserId, createdAt }) => {
        if (chatId !== seenChatId) return;

        // Update receiver's last seen
        setReceiverLastSeen({
          messageId,
          createdAt,
          userId: seenByUserId
        });

        // Update messages as seen
        setMessages((prev) =>
          prev.map((msg) =>
            new Date(msg.createdAt) <= new Date(createdAt)
              ? {
                ...msg,
                status: "seen",
                seenBy: [...new Set([...(msg.seenBy || []), seenByUserId])],
                seenAt: new Date(createdAt)
              }
              : msg
          )
        );
      }
    );

    return () => {
      socket.off("receiverSeenMessage");
    };
  }, [chatId, socket]);

  // Original userSeenMessage listener (when we see someone's messages)
  useEffect(() => {
    if (!socket) return;
    socket.on(
      "userSeenMessage",
      ({ chatId: seenChatId, userId: seenUserId, messageId, createdAt }) => {
        if (chatId !== seenChatId) return;

        setMessages((prev) =>
          prev.map((msg) =>
            // Compare by createdAt timestamp, not _id
            new Date(msg.createdAt) <= new Date(createdAt)
              ? {
                ...msg,
                seenBy: [...new Set([...(msg.seenBy || []), seenUserId])],
              }
              : msg
          )
        );
      }
    );

    return () => socket.off("userSeenMessage");
  }, [chatId, socket]);

  // Listen for message deletion from other users
  useEffect(() => {
    if (!socket) return;

    socket.on(
      "messageDeleted",
      ({ messageId, chatId: deletedChatId }) => {
        if (chatId !== deletedChatId) return;
        
        // Remove the deleted message from UI
        setMessages((prev) =>
          prev.filter((msg) => msg._id !== messageId)
        );
      }
    );

    return () => {
      socket.off("messageDeleted");
    };
  }, [chatId, socket, setMessages]);


  const hasScrolledToLastSeen = useRef(false);

  useEffect(() => {
    if (hasScrolledToLastSeen.current) return;

    if (lastSeenMessageRef.current) {
      lastSeenMessageRef.current.scrollIntoView({
        behavior: "auto",
        block: "center",
      });
      hasScrolledToLastSeen.current = true;
    }
  }, []);


  return (
    <div className="relative flex flex-col min-h-full pb-24">
      <div className="space-y-6 max-w-4xl mx-auto w-full px-4 pt-4">
        {sortedDates.map((date) => (
          <div key={date} className="flex flex-col">
            {/* Date Separator */}
            <div className="flex justify-center my-4 sticky top-4 z-10 pointer-events-none">
              <span
                className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase shadow-sm border border-white/40 text-gray-500 transition-all duration-300 pointer-events-auto"
                style={{
                  borderRadius: "100px",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  display: "inline-flex",
                  alignItems: "center",
                  height: "22px",
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
                    if (el) messageRefs.current[msg._id] = el;
                    if (msg._id === lastSeenMessage?._id) {
                      lastSeenMessageRef.current = el;
                    }
                  }}
                  onContextMenu={(e) => handleContextMenu(msg, e)}
                  onDoubleClick={(e) => handleDoubleClick(msg, e)}
                  onTouchStart={(e) => handleTouchStart(msg, e)}
                  onTouchEnd={handleTouchEnd}
                  className={`flex flex-col group relative ${sentByUser ? "items-end" : "items-start"
                    }`}
                >
                  {/* Message bubble */}
                  <div
                    data-id={msg._id}
                    id={`msg_${msg._id}`}
                    className={`p-2 text-sm max-w-[400px] rounded-xl shadow break-words relative transition-all duration-200
                      ${sentByUser
                        ? msg.failed
                          ? "bg-red-100 text-red-700 border mb-2 border-red-400 rounded-br-none"
                          : "bg-white text-gray-900 rounded-br-none chat-custom-gradient"
                        : "bg-[var(--input-accent)] text-white rounded-bl-none"
                      }`}
                  >
                    {/* Replied Message Preview - WhatsApp Style - Clickable to scroll to original */}
                    {msg.replyTo && (
                      <div
                        className={`mb-2 pb-2 border-b cursor-pointer hover:opacity-80 transition-opacity rounded ${sentByUser ? 'border-gray-200' : 'border-white/20'}`}
                        onClick={() => {
                          if (scrollToReplyMessage && msg.replyTo) {
                            scrollToReplyMessage(msg.replyTo);
                          }
                        }}
                        title="Click to view original message"
                      >
                        <div className="flex items-start gap-2">
                          {/* Vertical line indicator */}
                          <div
                            className="w-0.5 rounded-full mt-1"
                            style={{ backgroundColor: sentByUser ? 'var(--input-accent)' : 'white' }}
                          />
                          <div className="flex-1 min-w-0">
                            <span
                              className="text-xs font-medium"
                              style={{ color: sentByUser ? 'var(--input-accent)' : 'rgba(255,255,255,0.8)' }}
                            >
                              {msg.replyTo.from_user_id === user._id ? 'You' : (receiver?.name || 'User')}
                            </span>
                            <p className={`text-xs truncate ${sentByUser ? 'text-gray-500' : 'text-white/70'}`}>
                              {msg.replyTo.text || (msg.replyTo.message_type === 'image' ? '📷 Image' : msg.replyTo.message_type === 'audio' ? '🎤 Audio' : 'Message')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.message_type === "text" && <p>{msg.text}</p>}
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
                    {msg.message_type === "audio" && msg.media_url && (
                      <AudioMessage msg={msg} />
                    )}
                  </div>

                  {/* Message status - only show for sent messages, not received */}
                  <div
                    className="flex items-center gap-1 mt-1 text-xs"
                    style={{ color: "var(--input-meta-text)" }}
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
                            {/* For sent messages, check if RECEIVER has seen them (receiverLastSeen) */}
                            {/* For sent messages, NEVER use isMessageSeen as that checks if WE have seen, not the receiver */}
                            {sentByUser ? (
                              receiverLastSeen && new Date(msg.createdAt) <= new Date(receiverLastSeen.createdAt || receiverLastSeen) ? (
                                // Blue double check - seen by receiver
                                <CheckCheck
                                  size={14}
                                  className="text-blue-500"
                                  title={`Seen at ${receiverLastSeen?.createdAt ? formatTime(receiverLastSeen.createdAt) : ''}`}
                                />
                              ) : msg.status === "delivered" || receiverLastSeen ? (
                                // Gray double check - delivered
                                <CheckCheck
                                  size={14}
                                  className="text-[var(--input-delivered-check)]"
                                />
                              ) : (
                                // Single check - sent
                                <Check
                                  size={14}
                                  className="text-[var(--input-sent-check)]"
                                />
                              )
                            ) : (
                              /* For received messages, use isMessageSeen to show if WE have seen them */
                              isMessageSeen(msg) ? (
                                // Blue double check - we have seen this message
                                <CheckCheck
                                  size={14}
                                  className="text-blue-500"
                                  title={`Seen at ${msg.seenAt ? formatTime(msg.seenAt) : ''}`}
                                />
                              ) : msg.status === "delivered" || receiverLastSeen ? (
                                // Gray double check - delivered
                                <CheckCheck
                                  size={14}
                                  className="text-[var(--input-delivered-check)]"
                                />
                              ) : (
                                // Single check - sent
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

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={() => {
            requestAnimationFrame(() => {
              scrollToBottom();
            });
          }}
          className="fixed bottom-35 right-8 flex items-center justify-center w-12 h-12 rounded-full shadow-xl transition-all duration-300 z-50 cursor-pointer border border-white/40 hover:scale-110 active:scale-95 z-[999999]"
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
          }}
        >
          <FaArrowDown size={16} className="text-gray-800 drop-shadow-sm" />
        </button>
      )}

      {/* Message Options Dropdown - WhatsApp Style */}
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
