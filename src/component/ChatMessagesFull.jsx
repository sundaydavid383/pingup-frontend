import React, { useRef, useState } from "react";
import AudioMessage from "./shared/AudioMessage";
import { Check, CheckCheck, Send  } from "lucide-react";
import { FaArrowDown } from "react-icons/fa";
import MediaViewer from "./shared/MediaViewer";
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
 
   const [imageloaded, setImageLoaded] = useState(false);
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
            
            {/* Clean Date Separator with Border Radius */}
            {/* Clean Date Separator with Forced Border Radius */}
<div className="flex justify-center my-4 sticky top-4 z-10 pointer-events-none">
      <span 
        className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase shadow-sm border border-white/40 text-gray-500 transition-all duration-300 pointer-events-auto"
        style={{
          borderRadius: "100px",          // Absolute pill shape
          backgroundColor: "rgba(255, 255, 255, 0.6)", 
          backdropFilter: "blur(8px)",   // Subtle glass effect
          WebkitBackdropFilter: "blur(8px)",
          display: "inline-flex",
          alignItems: "center",
          height: "22px"                  // Fixed reduced height
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
                    className={`p-2 text-sm max-w-[230px] sm:max-w-[300px]  rounded-xl shadow break-words relative transition-all duration-200
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
     onLoad={() => setImageLoaded(true)}
    className={`w-[100%] max-w-xs rounded-lg mb-1
       object-cover cursor-pointer transition-transform
        hover:scale-[1.02] ${imageloaded ? "blur-0 scale-100" : "blur-md scale-105"}`}
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

                  

                  <div
                    className="flex items-center gap-1 mt-1 text-xs"
                    style={{ color: "var(--input-meta-text)" }}
                  >
                    <span>{formatTime(msg.createdAt)}</span>

{sentByUser && (
  <span className="ml-1 flex items-center gap-1 text-xs">
{msg.status === "sending" && (
  <Send size={14} className="text-gray-400 animate-pulse" />
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
        ))}
      </div>

      {showMediaViewer && (
  <MediaViewer
    post={{ attachments: imageMessages.map((img) => ({ url: img.media_url })), content: "" }}
    initialIndex={currentImageIndex}
    onClose={() => setShowMediaViewer(false)}
  />
)}


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