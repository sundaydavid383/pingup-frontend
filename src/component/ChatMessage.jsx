import { useEffect, useRef, useState } from "react";
import AudioMessage from "./shared/AudioMessage";
import { Check, CheckCheck, Send } from "lucide-react";

const READ_MORE_LIMIT = 200;
const READ_MORE_LINES = 3;

// Helper to count lines (split by \n)
const countLines = (text) => {
  if (!text) return 0;
  return text.split('\n').length;
};

// Helper to get first N lines
const getFirstNLines = (text, n) => {
  if (!text) return '';
  const lines = text.split('\n');
  return lines.slice(0, n).join('\n');
};

const ChatMessage = ({
  message,
  userId,
  onVisible,
  resendMessage,
  imageMessages,
  setCurrentImageIndex,
  setShowMediaViewer,
  formatTime
}) => {
  const msgRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Detect when message comes into view
  useEffect(() => {
    if (!msgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible(message._id);
        }
      },
      { root: document.querySelector(".chatbox-wrapper"), threshold: 0.5 }
    );

    observer.observe(msgRef.current);

    return () => observer.disconnect();
  }, [message._id, onVisible]);

  const sentByUser = message.from_user_id === userId;

  // Check if message should show "Read more" - based on character count OR line count
  const lineCount = countLines(message.text || '');
  const shouldShowReadMore = message.message_type === "text" && 
    message.text && 
    (message.text.length > READ_MORE_LIMIT || lineCount > READ_MORE_LINES);

  // Get display text based on expansion state
  const getDisplayText = () => {
    if (!shouldShowReadMore || isExpanded) {
      return message.text;
    }
    // Show first N lines or first N characters, whichever is shorter
    const firstLines = getFirstNLines(message.text, READ_MORE_LINES);
    if (firstLines.length < message.text.length) {
      return firstLines;
    }
    return message.text.slice(0, READ_MORE_LIMIT);
  };

  return (
    <div
      ref={msgRef}
      className={`flex flex-col ${sentByUser ? "items-end" : "items-start"} mb-1`}
    >
      <div
        className={`p-2 text-sm max-w-[70%] rounded-xl shadow break-words relative transition-all duration-200
          ${sentByUser
            ? message.failed
              ? "bg-red-100 text-red-700 border border-red-400 rounded-br-none"
              : "bg-white text-gray-900 rounded-br-none chat-custom-gradient"
            : "bg-[var(--input-accent)] text-white rounded-bl-none "
          }`}
      >
        {/* Render text, image, or audio */}
        {message.message_type === "text" && (
          <>
            <p className="whitespace-pre-wrap">{getDisplayText()}</p>
            {shouldShowReadMore && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-medium underline ml-1 hover:opacity-80 transition-opacity"
                style={{ color: sentByUser ? "var(--input-accent)" : "#fff" }}
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        )}
        {message.message_type === "image" && message.media_url && (
          <img
            src={message.media_url}
            alt="chat media"
            className="w-full max-w-xs rounded-lg mb-1 object-cover cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => {
              const index = imageMessages.findIndex(
                (img) => img.media_url === message.media_url
              );
              setCurrentImageIndex(index);
              setShowMediaViewer(true);
            }}
          />
        )}
        {message.message_type === "audio" && message.media_url && (
          <AudioMessage msg={message} />
        )}

        {/* Retry/Cancel buttons */}
        {message.failed && sentByUser && (
          <div className="absolute bottom-1 right-0 flex items-center gap-2 text-xs">
            <button onClick={() => resendMessage(message)}>↻ Retry</button>
            <button>✖ Cancel</button>
          </div>
        )}
      </div>

      {/* Time & Status */}
      <div
        className="flex items-center gap-1 mt-1 text-xs"
        style={{ color: "var(--input-meta-text)" }}
      >
        <span>{formatTime(message.createdAt)}</span>

        {sentByUser && (
          <span className="ml-1 flex items-center gap-1 text-xs">
            {message.status === "sending" && (
              <Send size={14} className="text-gray-400 animate-pulse" />
            )}
            {message.status === "sent" && (
              <Check size={14} className="text-[var(--input-sent-check)]" />
            )}
            {message.status === "delivered" && (
              <CheckCheck size={14} className="text-[var(--input-delivered-check)]" />
            )}
            {message.status === "seen" && (
              <CheckCheck size={14} className="text-[var(--input-seen-check)]" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
