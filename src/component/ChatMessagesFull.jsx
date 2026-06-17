import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import AudioMessage from "./shared/AudioMessage";
import { Check, CheckCheck, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { FaArrowDown } from "react-icons/fa";
import MediaViewer from "./shared/MediaViewer"; // Make sure this import exists
import axiosBase from "../utils/axiosBase";
import { useSocket } from "../context/SocketContext";
import MessageOptionsDropdown from "./MessageOptionsDropdown";
import useSeenManager from "../hooks/useSeenManager";
import "./../styles/chatmessagesfull.css"

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
  onContainerScroll,
  scrollToBottom,
  scrollToMessage,
  scrollToReplyMessage,
  setReplyTo,
  receiver,
  inputRef,
}) => {
  const { socket, connected, onlineUsers } = useSocket();


const seenManager = useSeenManager({
  messages,
  setMessages,
  chatId,
  userId: user?._id,
  socket,
  containerRef,
  scrollStopped,
  scrollStopDebounce: 1200,
  enabled: true,
});

// Id of the earliest message that was unread at the moment this chat was
// opened — drives the "Unread Messages" separator. Pinned to the snapshot,
// not the live lastSeenMessage, so it doesn't move mid-visit.
const firstUnreadMessageId = useMemo(() => {
  if (!seenManager.hasInitialized) return null;
  const boundary = seenManager.chatOpenLastSeenMessage;
  const candidates = messages.filter((m) =>
    m.from_user_id !== user._id &&
    !String(m._id).startsWith('temp_') &&
    (!boundary || new Date(m.createdAt) > new Date(boundary.createdAt))
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((earliest, current) =>
    new Date(current.createdAt) < new Date(earliest.createdAt) ? current : earliest
  )._id;
}, [messages, seenManager.hasInitialized, seenManager.chatOpenLastSeenMessage, user._id]);

  // State for message options dropdown
  const [dropdownState, setDropdownState] = useState({
    isOpen: false,
    message: null,
    position: { x: 0, y: 0 },
  });

  // State for read-more functionality
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showUnreadSeparator, setShowUnreadSeparator] = useState(true);
  useEffect(() => {
    if (isNearBottom) {
      setTimeout(() => {
        setShowUnreadSeparator(false);
      }, 2000);
    }
  }, [isNearBottom]);
  // WhatsApp-style character threshold (around 100 chars like WhatsApp)
  const CHARACTER_THRESHOLD = 100;

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
    // Find the last space before threshold to avoid cutting words (WhatsApp style)
    const truncated = text.substring(0, CHARACTER_THRESHOLD);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > -1 ? truncated.substring(0, lastSpace) : truncated) + '...';
  };

  const shouldShowReadMore = (text) => {
    return text && text.length > CHARACTER_THRESHOLD;
  };

  // Long press timer for mobile
const longPressTimer = useRef(null);
const isLongPress = useRef(false);
const messageElementRefs = useRef({});
const hasScrolledToLastSeen = useRef({});
const prevChatIdRef = useRef(null);
const swipeStartX = useRef(null);
const swipeStartY = useRef(null);
const swipeMsg = useRef(null);
const SWIPE_THRESHOLD = 60;
const LONG_PRESS_DELAY = 500;

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
    const messageEl = event.currentTarget.closest('[data-id]');
    if (messageEl) {
      handleMessageInteraction(msg, event, messageEl);
    }
  }, [handleMessageInteraction]);

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
  }, [setReplyTo, user?._id, receiver, inputRef]);



  useEffect(() => {
  if (!containerRef?.current) return;

  const container = containerRef.current;

  const checkIfNearBottom = () => {
    const threshold = 120; // px from bottom (adjust if needed)

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    setIsNearBottom(distanceFromBottom <= threshold);
  };

  // Run initially
  checkIfNearBottom();

container.addEventListener("scroll", checkIfNearBottom);

  return () => {
    container.removeEventListener("scroll", checkIfNearBottom);
  };
}, [containerRef, messages.length]);

// Reset visibility whenever a new chat is opened, so a fresh unread boundary
// (if one exists) gets shown again for the new conversation.
useEffect(() => {
  setShowUnreadSeparator(true);
}, [chatId]);

// Auto-hide the separator ~2s after the user has settled at the bottom —
// mirrors WhatsApp: once you've caught up, the marker doesn't linger.
useEffect(() => {
  if (!isNearBottom) return;
  const timer = setTimeout(() => {
    setShowUnreadSeparator(false);
  }, 2000);
  return () => clearTimeout(timer);
}, [isNearBottom]);

  // Scroll to a specific message by ID and highlight it briefly
const scrollToMessageAndHighlight = useCallback((messageId) => {
  console.log("📬 ChatMessagesFull: scrollToMessage called with", messageId);
  const msgEl = document.getElementById(`msg_${messageId}`);
  if (msgEl) {
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Add temporary highlight
    msgEl.classList.add('message-highlight');
    setTimeout(() => {
      msgEl.classList.remove('message-highlight');
    }, 1500);
  } else {
    // Try with data-message-id attribute
    const msgEl2 = document.querySelector(`[data-message-id="${messageId}"]`);
    if (msgEl2) {
      msgEl2.scrollIntoView({ behavior: 'smooth', block: 'center' });
      msgEl2.classList.add('message-highlight');
      setTimeout(() => {
        msgEl2.classList.remove('message-highlight');
      }, 1500);
    } else {
      console.log("📬 ChatMessagesFull: Message element not found for", messageId);
    }
  }
}, []);



useEffect(() => {
    if (!chatId || messages.length === 0) return;
    if (!seenManager.hasInitialized) return;

    // Reset flag when chat changes
    if (prevChatIdRef.current !== chatId) {
        hasScrolledToLastSeen.current = {};
        prevChatIdRef.current = chatId;
    }

    if (hasScrolledToLastSeen.current[chatId]) return;

    // Mark immediately to prevent double-fire from React StrictMode / re-renders
    hasScrolledToLastSeen.current[chatId] = true;

    const lastMsg = messages[messages.length - 1];

    // No lastSeenMessage or already at latest → scroll to bottom
    if (
        !seenManager.lastSeenMessage ||
        !lastMsg ||
        new Date(lastMsg.createdAt) <= new Date(seenManager.lastSeenMessage.createdAt)
    ) {
        requestAnimationFrame(() => {
            if (containerRef?.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
        });
        return;
    }

    // There are unseen messages below lastSeenMessage — scroll to it
    // Use a MutationObserver to wait for the target element to appear in DOM
    const targetId = `msg_${seenManager.lastSeenMessage._id}`;

    const doScroll = () => {
        seenManager.scrollToLastSeen();
    };

    const existing = document.getElementById(targetId);
    if (existing) {
        // Already rendered — scroll immediately
        requestAnimationFrame(doScroll);
        return;
    }

    // Wait for it to appear
    const observer = new MutationObserver(() => {
        if (document.getElementById(targetId)) {
            observer.disconnect();
            requestAnimationFrame(doScroll);
        }
    });

    if (containerRef?.current) {
        observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    // Safety timeout
    const timeout = setTimeout(() => {
        observer.disconnect();
        if (containerRef?.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, 3000);

    return () => {
        observer.disconnect();
        clearTimeout(timeout);
    };
}, [chatId, seenManager.hasInitialized, seenManager.lastSeenMessage, messages.length]);

useEffect(() => {
  if (!containerRef?.current) return;

  const container = containerRef.current;
  container.addEventListener('scroll', seenManager.onContainerScroll);

  return () => {
    container.removeEventListener('scroll', seenManager.onContainerScroll);
  };
}, [containerRef, seenManager.onContainerScroll]);

  // Expose scroll functions to parent
  useEffect(() => {
    if (scrollToMessage) {
      scrollToMessage.current = scrollToMessageAndHighlight;
    }
  }, [scrollToMessage, scrollToMessageAndHighlight]);



  // Close dropdown
  const closeDropdown = useCallback(() => {
    setDropdownState({
      isOpen: false,
      message: null,
      position: { x: 0, y: 0 },
    });
  }, []);


  // Handle copy text
  const handleCopyText = useCallback((text) => {
    if (text) {
      navigator.clipboard.writeText(text);
    }
  }, []);

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
  // All socket listeners and seen logic now handled by useSeenManager hook
  // Location: seenManager.lastSeenMessage, seenManager.receiverLastSeen, etc.
  const handleContextMenu = useCallback((msg, event) => {
    const messageEl = event.currentTarget;
    handleMessageInteraction(msg, event, messageEl);
  }, [handleMessageInteraction]);

  const handleTouchStart = useCallback((msg, event) => {
    const touch = event.touches[0];
    swipeStartX.current = touch.clientX;
    swipeStartY.current = touch.clientY;
    swipeMsg.current = msg;
    isLongPress.current = false;

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(40);
      const messageEl = event.currentTarget;
      const rect = messageEl.getBoundingClientRect();
      setDropdownState({
        isOpen: true,
        message: msg,
        position: { x: rect.left + rect.width / 2, y: rect.top - 10 },
      });
    }, LONG_PRESS_DELAY);
  }, []);

  const handleTouchMove = useCallback((event) => {
    const touch = event.touches[0];
    const dx = touch.clientX - (swipeStartX.current ?? touch.clientX);
    const dy = Math.abs(touch.clientY - (swipeStartY.current ?? touch.clientY));

    if (Math.abs(dx) > 8 || dy > 8) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    if (!isLongPress.current && dx < -SWIPE_THRESHOLD && dy < 30 && swipeMsg.current) {
      if (navigator.vibrate) navigator.vibrate(30);
      handleReplyFromDropdown(swipeMsg.current);
      swipeMsg.current = null;
      swipeStartX.current = null;
    }
  }, [handleReplyFromDropdown]);

  const handleTouchEnd = useCallback((event) => {
    if (isLongPress.current) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    swipeStartX.current = null;
    swipeStartY.current = null;
    swipeMsg.current = null;
  }, []);


  return (
   <div className="relative flex flex-col w-full">
  <div className="space-y-2 max-w-4xl mx-auto w-full px-2 pt-4 pb-[90px]">
     {sortedDates.map((date) => (
          <div key={date} className="flex flex-col">
            {/* Date Separator */}
            <div className="flex justify-center my-3 sticky top-4 z-10 pointer-events-none">
              <span
                className="px-3 py-1 text-[11px] font-medium shadow-sm text-gray-600"
               style={{
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.7)", 
                backdropFilter: "blur(12px) saturate(180%)",
                WebkitBackdropFilter: "blur(12px) saturate(180%)",
                display: "inline-flex",
                alignItems: "center",
                height: "24px",
                border: "1px solid rgba(255, 255, 255, 0.3)", 
              }}
              >
                {date}
              </span>
            </div>

            {/* Messages for this date */}
            {groupedMessages[date].map((msg) => {
              const sentByUser = msg.from_user_id === user._id;
              const isFirstUnreadMsg = firstUnreadMessageId && msg._id === firstUnreadMessageId;

              return (
               <React.Fragment key={msg._id}>
               {isFirstUnreadMsg && showUnreadSeparator && (
                 <div className="flex items-center justify-center my-4 px-2">
                   <div className="flex-1 h-px bg-red-200" />
                   <span className="px-3 text-[11px] font-semibold text-red-500 uppercase tracking-wide whitespace-nowrap">
                     Unread Messages
                   </span>
                   <div className="flex-1 h-px bg-red-200" />
                 </div>
               )}
               <div
  id={`msg_${msg._id}`}
  data-message-id={msg._id?.toString().startsWith('temp_') ? undefined : msg._id}
  data-from-user-id={msg.from_user_id}
  ref={(el) => {
    if (el) seenManager.setMessageRef(msg._id, el);
  }}
  onContextMenu={(e) => handleContextMenu(msg, e)}
  onDoubleClick={(e) => handleDoubleClick(msg, e)}
  onTouchStart={(e) => handleTouchStart(msg, e)}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  className={`flex flex-col group relative mb-4 ${
    sentByUser ? "items-end" : "items-start"
  }`}
>
  {/* Message bubble */}
<div
  data-id={msg._id}
  className={`
   ${msg.message_type === "image" ? 'px-[7px] py-[7px]' : 'px-3 py-3'} relative overflow-hidden  text-sm
    max-w-[75%] sm:max-w-[60%] md:max-w-[400px]
    min-w-[120px]
    rounded-2xl shadow-sm break-words relative transition-all duration-200
    ${
      sentByUser
        ? msg.failed
          ? "bg-red-100 text-red-800 border border-red-300 rounded-br-none"
          : "bg-[var(--primary)] text-white rounded-bl-3xl"
        : "bg-[var(--white)] text-gray-900 rounded-br-3xl"
    }
  `}
>
  {/* ─── Reply Preview ─── */}
  {msg.replyTo && (
    <div
      className={`
        mb-3 px-3 py-2.5 rounded-xl cursor-pointer
        transition-all duration-150 hover:brightness-[1.04] active:brightness-95
        border-l-4
        ${
          sentByUser
            ? "bg-white/10 border-white/60"
            : "bg-gray-200/40 border-[var(--primary)]/35"
        }
      `}
      onClick={() => {
        if (scrollToReplyMessage && msg.replyTo) {
          scrollToReplyMessage(msg.replyTo);
        }
      }}
    >
      <div className="flex items-start gap-2 text-xs leading-tight">
        <div
          className={`w-0.5 h-5 mt-0.5 rounded-full ${
            sentByUser ? "bg-white/60" : "bg-[var(--primary)]/60"
          }`}
        />

        <div className="flex-1 min-w-0 space-y-0.5">
          <div
            className={`font-semibold truncate ${
              sentByUser ? "text-white/90" : "text-[var(--primary)]"
            }`}
          >
            {msg.replyTo.from_user_id === user._id
              ? "You"
              : msg.replyTo.senderName || receiver?.name || "User"}
          </div>

          <p
            className={`truncate ${
              sentByUser ? "text-white/70" : "text-gray-700"
            }`}
          >
            {msg.replyTo.text
              ? msg.replyTo.text
              : msg.replyTo.message_type === "image"
              ? "🖼️ Photo"
              : msg.replyTo.message_type === "audio"
              ? "🎙️ Voice message"
              : msg.replyTo.message_type === "video"
              ? "🎥 Video"
              : "Message"}
          </p>
        </div>
      </div>
    </div>
  )}

  {/* ─── TEXT ─── */}
  {msg.message_type === "text" && (
    <div className="flex flex-col gap-1.5">
      <p className="whitespace-pre-wrap leading-relaxed text-[0.8rem]">
        {getDisplayText(msg.text, msg._id)}
      </p>

      {shouldShowReadMore(msg.text) && (
        <button
          onClick={() => toggleMessageExpansion(msg._id)}
          className={`
            text-xs font-medium mt-1 self-start transition-opacity
            ${
              sentByUser
                ? "text-white/80 hover:text-white"
                : "text-[var(--primary)] hover:opacity-80"
            }
          `}
        >
          {expandedMessages.has(msg._id) ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  )}

  {/* ─── MEDIA (IMAGE + AUDIO SAME SYSTEM) ─── */}
  {(msg.message_type === "image" || msg.message_type === "audio") &&
    msg.media_url && (
      <div className="mt-0">
        {msg.message_type === "image" ? (
          <img
            src={msg.media_url}
            alt="Shared"
              className="
    max-w-[240px]
    max-h-[420px]
    w-auto h-auto
    rounded-lg
    object-cover
    cursor-pointer
  "
            onClick={() => {
  console.log("CLICKED IMAGE");
  console.log("imageMessages:", imageMessages);
  
  const index = imageMessages.findIndex(
    (img) => img.media_url === msg.media_url
  );

  console.log("INDEX:", index);

  if (index !== -1) {
    setCurrentImageIndex(index);
    setShowMediaViewer(true);
  }
}}
          />
        ) : (
          <div className="w-[200px] max-w-[200px]">
            <AudioMessage msg={msg} />
          </div>
        )}
      </div>
    )}
</div>

  {/* ─── STATUS ─── */}
  <div
    className="flex items-center justify-end gap-1 mt-1 text-[10px]"
    style={{ color: "var(--primary)" }}
  >
    <span>{formatTime(msg.createdAt)}</span>

    {sentByUser && (
      <span className="ml-1 flex items-center gap-1 text-xs">
        {msg.status === "sending" && (
          <span className="text-gray-500 animate-pulse">Sending...</span>
        )}

        {msg.failed && (
          <>
            <button onClick={() => resendMessage(msg)}>↻ Retry</button>
            <button>✖ Cancel</button>
          </>
        )}

        {msg.status !== "sending" && !msg.failed && (
          <span className="flex items-center">
            
{msg.status === "seen" ? (
  <Eye size={14} className="text-blue-500" />
) : msg.status === "delivered" ? (
  <CheckCheck size={14} className="text-[var(--input-delivered-check)]" />
) : (
  <Check size={14} className="text-[var(--input-sent-check)]" />
)}
          </span>
        )}
      </span>
    )}
  </div>
</div>
               </React.Fragment>
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

      {/* Scroll to bottom button - Always visible, fixed position */}
      {!isNearBottom  && <button
  onClick={() => {
    console.log("📬 ChatMessagesFull: Scroll to bottom button clicked");
    requestAnimationFrame(() => {
      seenManager.scrollToBottom();
    });
  }}
  className="fixed flex items-center justify-center rounded-full transition-all duration-300 z-50 cursor-pointer border border-white/30 hover:scale-110 active:scale-95 scroll-to-bottom-floating-btn"
  style={{
    bottom: 'calc(85px + max(12px, env(safe-area-inset-bottom)))',
    right: '20px',
    width: '44px',
    height: '44px',

    // 🔥 Glass Effect
    background: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',

    boxShadow: '0 4px 16px rgba(30, 64, 175, 0.35)',
  }}
  title="Scroll to latest message"
>
  <FaArrowDown 
    size={18} 
    className="text-[var(--secondary)] drop-shadow-md" 
  />

      {seenManager.unseenBelowCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold text-white animate-pulse"
            style={{ 
              backgroundColor: '#ef4444',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
            }}
          >
            {seenManager.unseenBelowCount > 99 ? '99+' : seenManager.unseenBelowCount}
          </span>
      )}
      </button>}

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