import React, { useEffect, useRef, useState } from "react";
import assets from "../../assets/assets";
import AudioMessage from "../../component/shared/AudioMessage";
import "../../styles/lefthero.css";

const LeftHero = () => {
  const chatRef = useRef(null);
  const containerRef = useRef(null);

  const messages = [
    { id: 1, type: "text", text: "Did you complete today’s reflection? 📖", from: "left" },
    { id: 2, type: "text", text: "Yes! Checked off all tasks ✅ How about you?", from: "right" },
    { id: 3, type: "image", media_url: assets.sampleImage, from: "left" },
    { id: 4, type: "audio", media_url: assets.sampleAudio, from: "right" },
    { id: 5, type: "text", text: "Absolutely! We got this 👏", from: "right" },
  ];

  const [visibleMessages, setVisibleMessages] = useState([]);
  const [typing, setTyping] = useState(false);

  /* ------------------ SHOW MESSAGES ------------------ */
  useEffect(() => {
    let i = 0;

    const showNextMessage = () => {
      if (i >= messages.length) return;

      setTyping(true);

      const typingTimeout = setTimeout(() => {
        setTyping(false);
        setVisibleMessages((prev) => [...prev, messages[i]]);
        i++;
        setTimeout(showNextMessage, 800);
      }, 3000);

      return () => clearTimeout(typingTimeout);
    };

    showNextMessage();
  }, []);

  /* ------------------ AUTO SCROLL ------------------ */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [visibleMessages, typing]);

  return (
    <div className="left-hero-container">
      
      <div className="hero-inner">
        
        {/* Chat Column */}
        <div ref={containerRef} className="chat-column">
          {visibleMessages.map((msg) => {
            if (!msg) return null;
            const fromSide = msg.from || "left";

            return (
              <div
                key={msg.id ?? Math.random()}
                className={`chat-message ${fromSide === "left" ? "left-msg" : "right-msg"}`}
              >
                {msg.type === "text" && <p>{msg.text}</p>}
                {msg.type === "image" && (
                  <img src={msg.media_url} alt="chat-media" className="chat-image" />
                )}
                {msg.type === "audio" && (
                  <AudioMessage
                    msg={msg}
                    barColor={fromSide === "left" ? "#111827" : "#ffffff"}
                  />
                )}
              </div>
            );
          })}

          {typing && (
            <div className="typing-bubble">
              <div className="dot"></div>
              <div className="dot delay-150"></div>
              <div className="dot delay-300"></div>
            </div>
          )}
        </div>

        {/* Hero Image */}
        <div className="hero-image-container">
          <img src={assets.heroHuman} alt="Happy user" className="hero-image" />
        </div>

      </div>

      {/* ------------------ CSS ------------------ */}

    </div>
  );
};

export default LeftHero;
