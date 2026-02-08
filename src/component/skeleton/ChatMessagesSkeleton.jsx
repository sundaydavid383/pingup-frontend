// src/component/skeleton/ChatMessagesSkeleton.jsx
import React from "react";
import { Image as ImageIcon, Mic } from "lucide-react";

const ChatMessagesSkeleton = () => {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => {
        const isMe = i % 2 === 0;
        const type = i % 3; // 0 = text, 1 = image, 2 = audio
        return (
          <div
            key={i}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-2xl animate-pulse ${
                isMe ? "bg-gray-300" : "bg-gray-200"
              }`}
              style={{
                width:
                  type === 0
                    ? `${40 + Math.random() * 30}%`
                    : type === 1
                    ? "160px"
                    : "200px",
                height: type === 0 ? "36px" : type === 1 ? "120px" : "40px",
                padding: type === 0 ? "0" : "0", // keep padding 0 for skeleton
                display: "flex",
                alignItems: "center",
                justifyContent:
                  type === 2 ? "space-between" : "center", // audio bar layout
              }}
            >
              {type === 1 && <ImageIcon size={24} className="text-gray-400 mx-auto" />}
              {type === 2 && (
                <div className="flex items-center w-full px-3">
                  <Mic size={20} className="text-gray-400 mr-2" />
                  <div className="h-2 flex-1 bg-gray-400 rounded"></div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatMessagesSkeleton;
