import React, { useEffect, useRef, useState } from "react";
import assets from "../../assets/assets";
import "../../styles/lefthero.css";

const LeftHero = () => {
  const containerRef = useRef(null);

  const messages = [
    { id: 1, type: "text", text: "Hey, I just finished the new module!", from: "left", time: "09:12" },
    { id: 2, type: "text", text: "Amazing! I’m on the last activity now.", from: "right", time: "09:13" },
    { id: 3, type: "text", text: "We can review it together tonight?", from: "left", time: "09:13" },
    { id: 4, type: "text", text: "Absolutely. I’ll send a summary first.", from: "right", time: "09:14" },
    { id: 5, type: "text", text: "Perfect, thanks!", from: "left", time: "09:15" },
  ];

  const [visibleMessages, setVisibleMessages] = useState([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let i = 0;
    let activeTypingTimeout;
    let nextMessageTimeout;

    const showNextMessage = () => {
      if (i >= messages.length) return;

      setTyping(true);
      activeTypingTimeout = setTimeout(() => {
        setTyping(false);
        setVisibleMessages((prev) => [...prev, messages[i]]);
        i += 1;

        if (i < messages.length) {
          nextMessageTimeout = setTimeout(showNextMessage, 900);
        }
      }, 1600 + Math.min(messages[i].text.length * 35, 1500));
    };

    showNextMessage();

    return () => {
      clearTimeout(activeTypingTimeout);
      clearTimeout(nextMessageTimeout);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [visibleMessages, typing]);

  return (
    <div className="cine-phone-hero">
      <div className="movie-phone-frame" aria-label="Cinematic phone chat interface">
        <div className="phone-notice" />
        <div className="phone-display">
          <div className="phone-chat-header">
            <img src={assets.heroHuman} alt="Woman avatar" className={`phone-avatar ${typing ? "typing" : ""}`} />
            <div className="chat-title">
              <strong>Jessica</strong>
              <span>Online</span>
            </div>
          </div>

          <div className="phone-chat-body" ref={containerRef}>
            {visibleMessages.map((msg) => (
              <article key={msg.id} className={`bubble ${msg.from === "left" ? "bubble-left" : "bubble-right"}`}>
                <p>{msg.text}</p>
                <time>{msg.time}</time>
              </article>
            ))}

            {typing && (
              <div className="bubble typing-bubble">
                <div className="typing-dot" />
                <div className="typing-dot delay1" />
                <div className="typing-dot delay2" />
              </div>
            )}
          </div>

          <div className="phone-chat-input">
            <span>Type a message...</span>
          </div>
        </div>
      </div>

      <div className="hero-woman-panel" aria-hidden="true">
        <img src={assets.heroHuman} alt="Woman using phone" className={`hero-woman-image ${typing ? "woman-typing" : ""}`} />
      </div>
    </div>
  );
};

export default LeftHero;
