import React from "react";
import AudioMessage from "./shared/AudioMessage";
import { Check, CheckCheck } from "lucide-react";
import { FaArrowDown } from "react-icons/fa";
import MediaViewer from "./shared/MediaViewer"; // Make sure this import exists
import BackButton from "./shared/BackButton";

const ChatMessagesFull = ({
  messages,
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
}) => {
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
                  className={`flex flex-col ${
                    sentByUser ? "items-end" : "items-start"
                  }`}
                >
                  {/* Message bubble */}
                  <div
                    data-id={msg._id}
                    className={`p-2 text-sm max-w-[70%] rounded-xl shadow break-words relative transition-all duration-200
                      ${
                        sentByUser
                          ? msg.failed
                            ? "bg-red-100 text-red-700 border mb-2 border-red-400 rounded-br-none"
                            : "bg-white text-gray-900 rounded-br-none chat-custom-gradient"
                          : "bg-[var(--input-accent)] text-white rounded-bl-none"
                      }`}
                  >
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

                  {/* Message status */}
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
                            <button onClick={() => {}}>✖ Cancel</button>
                          </>
                        )}
                        {msg.status === "sent" && (
                          <Check
                            size={14}
                            className="text-[var(--input-sent-check)]"
                          />
                        )}
                        {msg.status === "delivered" && (
                          <CheckCheck
                            size={14}
                            className="text-[var(--input-delivered-check)]"
                          />
                        )}
                        {msg.status === "seen" && (
                          <CheckCheck
                            size={14}
                            className="text-[var(--input-seen-check)]"
                          />
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
            className={`flex ${
              typingUserFromId === user._id ? "justify-end" : "justify-start"
            } px-4 mb-2`}
          >
            <div
              className={`typing-indicator ${
                typingUserFromId === user._id ? "sender" : "receiver"
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
          onClick={scrollToBottom}
          className="fixed bottom-28 right-8 flex items-center justify-center w-12 h-12 rounded-full shadow-xl transition-all duration-300 z-50 cursor-pointer border border-white/40 hover:scale-110 active:scale-95"
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
    </div>
  );
};

export default ChatMessagesFull;
