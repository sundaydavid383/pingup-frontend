import React, { useRef } from "react";
import AudioMessage from "./shared/AudioMessage";
import { Check, CheckCheck } from "lucide-react";
import { FaArrowDown } from "react-icons/fa";
import BackButton from "./shared/BackButton";

const ChatMessagesFull = ({

  messages,
  user,
  resendMessage,
  imageMessages,
  setCurrentImageIndex,
  setShowMediaViewer,
  formatTime,
  typingUser,
  typingUserFromId,
  showScrollButton,
  scrollToBottom
}) => {
 

  // Group messages by day
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedMessages).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  return (
    <div
    >
      <BackButton top="34" right="4" />
      <div className="space-y-3 max-w-4xl mx-auto px-4 pt-4">
        {sortedDates.map((date) => (
          <div key={date} className="mb-4">
            {/* Sticky Date Separator */}
<div
  className="flex justify-center my-3"
  style={{
    position: "sticky",
    top: 0,
    zIndex: 50,
  
  }}
>
       <div
  className="flex justify-center my-3"

>
  <span
    className="px-3 py-1 rounded-full text-xs"
    style={{
      backgroundColor: "rgba(224, 222, 222, 0.9", // your primary input color
      color: "var(--input-primary)",                          // text color
      padding: "4px 8px",
    }}
  >
    {date}
  </span>
</div>

            </div>

            {/* Messages for this date */}
            {groupedMessages[date].map((msg, idx) => {
              const sentByUser = msg.from_user_id === user._id;
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${sentByUser ? "items-end" : "items-start"}`}
                >
                  <div
                    data-id={msg._id}
                    className={`p-2 text-sm max-w-[70%] rounded-xl shadow break-words relative transition-all duration-200
                      ${sentByUser
                        ? msg.failed
                          ? "bg-red-100 text-red-700 border mb-2 border-red-400 rounded-br-none"
                          : "bg-white text-gray-900 rounded-br-none chat-custom-gradient"
                        : "bg-[var(--input-accent)] text-white rounded-bl-none "
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

                      {msg.failed && sentByUser && (
    <div className="absolute bottom-1 right-0 flex items-center gap-2 text-xs">
      <button onClick={() => resendMessage(msg)}>↻ Retry</button>
      <button onClick={() => { /* cancel logic */ }}>✖ Cancel</button>
    </div>
  )}
                  </div>

                  

                  <div
                    className="flex items-center gap-1 mt-1 text-xs"
                    style={{ color: "var(--input-meta-text)" }}
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
        <button onClick={() => { /* optional cancel */ }}>✖ Cancel</button>
      </>
    )}
    {msg.status === "sent" && (
      <Check size={14} className="text-[var(--input-sent-check)]" />
    )}
    {msg.status === "delivered" && (
      <CheckCheck size={14} className="text-[var(--input-delivered-check)]" />
    )}
    {msg.status === "seen" && (
      <CheckCheck size={14} className="text-[var(--input-seen-check)]" />
    )}
  </span>
)}


                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {typingUser && (
          <div className={`flex ${typingUserFromId === user._id ? "justify-end" : "justify-start"} px-4 mb-2`}>
            <div className={`typing-indicator ${typingUserFromId === user._id ? "sender" : "receiver"}`}>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-300 backdrop-blur-md bg-[rgba(30,30,30,0.4)] border border-white/10 hover:scale-110 hover:bg-[rgba(50,50,50,0.5)]"
          style={{ zIndex: 9999 }}
        >
          <FaArrowDown className="text-white text-lg" />
        </button>
      )}
    </div>
  );
};

export default ChatMessagesFull;
