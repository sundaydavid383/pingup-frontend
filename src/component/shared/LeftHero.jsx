import React, { useEffect, useRef, useState } from "react";
import assets from "../../assets/assets";
import UserStats from "../UserStats";
import AudioMessage from "../../component/shared/AudioMessage";
import FloatingChatDynamic from "./FloatingChatDynamic";
const LeftHero = () => {
const chatRef = useRef(null)
const messages = [
  { id: 1, type: "text", text: "Did you complete today’s reflection? 📖", from: "left" },

  { id: 2, type: "text", text: "Yes! Checked off all tasks ✅ How about you?", from: "right" },

  { id: 3, type: "image", media_url: assets.sampleImage, from: "left" },

  { id: 4, type: "audio", media_url: assets.sampleAudio, from: "right" },

  { id: 5, type: "text", text: "Absolutely! We got this 👏", from: "right" },
];


  const [visibleMessages, setVisibleMessages] = useState([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let i = 0;

    const showNextMessage = () => {
      if (i >= messages.length) return;

      setTyping(true);

      const typingTimeout = setTimeout(() => {
        setTyping(false);
        setVisibleMessages((prev) => [...prev, messages[i]]);
        i++;
        setTimeout(showNextMessage, 800); // Delay before next message
      }, 3000);

      return () => clearTimeout(typingTimeout);
    };

    showNextMessage();
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center bg-[var(--inverse-dark-indigo-gradient)] text-white relative overflow-hidden p-6 sm:p-10 md:p-12 lg:p-20 min-h-[50vh] md:min-h-screen order-1">
      {/* Background gradient overlay */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-[var(--radial-highlight)] to-transparent pointer-events-none"></div> */}

   

{/* Hero Visual + Chat */}
<FloatingChatDynamic
  visibleMessages={visibleMessages}
  typing={typing}
  assets={assets}
/>





      {/* Keyframes */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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

export default LeftHero;
