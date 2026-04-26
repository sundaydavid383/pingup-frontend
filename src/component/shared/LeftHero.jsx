import React, { useEffect, useRef, useState } from "react";

const LeftHero = () => {
  const containerRef = useRef(null);

  const messages = [
    { id: 1, type: "text", text: "Hey, I just finished reading John 3:16 today!", from: "left", time: "09:12" },
    { id: 2, type: "text", text: "That's amazing! What stood out to you?", from: "right", time: "09:13" },
    { id: 3, type: "text", text: "The love of God is so profound. We can share it with others.", from: "left", time: "09:13" },
    { id: 4, type: "text", text: "Absolutely. Let's pray together tonight?", from: "right", time: "09:14" },
    { id: 5, type: "text", text: "Yes! I'll share my notes first.", from: "left", time: "09:15" },
    { id: 6, type: "text", text: "Great, looking forward to it!", from: "right", time: "09:16" },
  ];

  const [visibleMessages, setVisibleMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const showNextMessage = () => {
      if (currentIndex >= messages.length) {
        // Reset to loop after delay
        setTimeout(() => {
          setVisibleMessages([]);
          setCurrentIndex(0);
          setTyping(false);
        }, 2000);
        return;
      }

      setTyping(true);
      const timeout = setTimeout(() => {
        setTyping(false);
        setVisibleMessages((prev) => [...prev, messages[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);

        // Schedule next message
        setTimeout(showNextMessage, 1200);
      }, 800 + Math.min(messages[currentIndex].text.length * 25, 800));

      return () => clearTimeout(timeout);
    };

    if (currentIndex < messages.length) {
      showNextMessage();
    }
  }, [currentIndex, messages]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [visibleMessages, typing]);

  return (
    <div className="chat-demo-container">
      <div className="chat-window">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-avatar">
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              J
            </div>
          </div>
          <div className="chat-info">
            <div className="chat-name">Jessica</div>
            <div className="chat-status">Active now</div>
          </div>
          <div className="flex gap-2 ml-auto">
            <button className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h8v14z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="chat-messages" ref={containerRef}>
          {visibleMessages.map((msg, idx) => {
            const showAvatar = msg.from === "left" && (idx === 0 || visibleMessages[idx - 1]?.from !== "left");

            return (
              <div key={msg.id} className={`message ${msg.from}`}>
                {msg.from === "left" && (
                  <div className={showAvatar ? "message-avatar-space" : "message-avatar-spacer"}>
                    {showAvatar && (
                      <div className="message-avatar">
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          J
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="message-bubble">
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{msg.time}</div>
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="message left">
              <div className="message-avatar-space">
                <div className="message-avatar">
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    J
                  </div>
                </div>
              </div>
              <div className="typing-bubble">
                <div className="typing-dot"></div>
                <div className="typing-dot delay1"></div>
                <div className="typing-dot delay2"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeftHero;
