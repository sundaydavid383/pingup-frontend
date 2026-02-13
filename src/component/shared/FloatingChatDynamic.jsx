import { useEffect, useRef } from "react";
import AudioMessage from "./AudioMessage";

const FloatingChatDynamic = ({ visibleMessages = [], typing, assets }) => {
  const containerRef = useRef(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [visibleMessages, typing]);

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16 mb-10 px-4">
      <div className="relative w-full h-[450px] flex justify-center items-end overflow-hidden">

        {/* Chat Column */}
        <div
          ref={containerRef}
          className="flex flex-col gap-2 w-full max-h-[420px] overflow-hidden relative z-10"
        >
          {visibleMessages.map((msg) => {
            if (!msg) return null; // <-- guard against undefined
            const fromSide = msg.from || "left"; // <-- default

            return (
              <div
                key={msg.id ?? Math.random()} // <-- fallback key just in case
                className={`max-w-[80%] px-2 py-1 text-sm rounded-2xl break-words shadow-md transition-all duration-500 ${
                  fromSide === "left"
                    ? "self-start bg-white/60 text-black backdrop-blur-sm rounded-tl-none"
                    : "self-end bg-[var(--primary)]/80 text-white backdrop-blur-sm rounded-tr-none"
                } animate-fade-in`}
              >
                {msg.type === "text" && <p>{msg.text}</p>}
                {msg.type === "image" && (
                  <img
                    src={msg.media_url}
                    alt="chat-media"
                    className="rounded-lg w-full max-h-32 object-cover "
                  />
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

          {/* Typing Bubble */}
          {typing && (
            <div className="self-start max-w-[60%] px-3 py-1.5 text-sm rounded-2xl bg-white/60 text-black backdrop-blur-sm flex gap-1 items-center animate-fade-in">
              <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-150"></div>
              <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-300"></div>
            </div>
          )}
        </div>

        {/* Human Image */}
        <div className="relative z-20 ml-4 absolute top-[20%]">
          {/* Glow behind image */}
          <div className="absolute w-56 h-56 bg-[var(--primary)] opacity-20 blur-3xl rounded-full animate-[float_6s_ease-in-out_infinite]"></div>

          <img
            src={assets.heroHuman}
            alt="Happy user"
            className="w-56 sm:w-64 md:w-72 drop-shadow-2xl "
          />
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease forwards;
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default FloatingChatDynamic;
