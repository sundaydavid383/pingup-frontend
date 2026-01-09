// ChapterTTS.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause, FaStop } from "react-icons/fa";
import { Loader } from "lucide-react";


export default function ChapterTTS({ text }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const utteranceRef = useRef(null);
  const [alert, setAlert] = useState(null); // { message: "", type: "info" }
  

  const handlePlayChapter = () => {
if (!window.speechSynthesis) {
  setAlert({ message: "Text-to-speech not supported in this browser", type: "error" });
  return;
}


      // Always cancel existing speech before starting new
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

    // Pause if already speaking
    if (isSpeaking) {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
      return;
    }

    // Resume if paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
      return;
    }

    // Fresh start
    if (!text) return;

    setIsLoadingTTS(true); // start loading

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsLoadingTTS(false);
      setIsSpeaking(true);
    };

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsLoadingTTS(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.cancel(); // stop other TTS
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

useEffect(() => {
  const stopTTS = () => window.speechSynthesis.cancel();
  stopTTS();
  window.addEventListener("beforeunload", stopTTS);
  return () => {
    window.removeEventListener("beforeunload", stopTTS);
    stopTTS();
  };
}, []);


  return (
    <div className="flex items-center gap-2 mt-2">
      {alert && (
  <CustomAlert
    message={alert.message}
    type={alert.type}
    onClose={() => setAlert(null)}
  />
)}
      <button
        className="chapter-play-btn flex items-center justify-center bg-blue-600 text-white p-2 rounded"
        onClick={handlePlayChapter}
        disabled={isLoadingTTS}
      >
        {isLoadingTTS ? (
          <Loader className="animate-spin w-5 h-5" />
        ) : isSpeaking ? (
          <FaPause className="w-5 h-5" />
        ) : (
          <FaPlay className="w-5 h-5" />
        )}
      </button>

      {isSpeaking && !isLoadingTTS && (
        <button
          className="chapter-restart-btn flex items-center justify-center bg-red-600 text-white p-2 rounded"
          onClick={stopSpeaking}
        >
          <FaStop className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
