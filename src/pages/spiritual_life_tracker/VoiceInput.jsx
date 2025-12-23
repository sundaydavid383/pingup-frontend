import React, { useState, useEffect, useRef,forwardRef, useImperativeHandle } from "react";
import { Mic, MicOff } from "lucide-react";
import MicButton from "./MicButton";
import assets from '../../assets/assets'


const VoiceInput = forwardRef(({ onTranscribe, disabled }, ref) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const leftoverRef = useRef(""); // unsent words
  const pauseTimer = useRef(null);
  const isPausedRef = useRef(false);

  // chunking config
  const MIN_CHUNK_WORDS = 10; 
  const MAX_CHUNK_WORDS = 20; 
  const PAUSE_MS = 200; 
  const bibleBooks = assets.bibleBooks

  // Bible books array with common abbreviations


  const processTranscript = (transcript) => {
    const normalizeTranscript = (text) => {
      return text.toLowerCase().replace(/chapter|verse/g, "").replace(/[^\w\s:]/g, "").trim();
    };

    const combined = normalizeTranscript(leftoverRef.current + " " + transcript);

    const detectBibleReference = (text) => {
      for (let book of bibleBooks) {
        const pattern = [book.name, ...book.aliases].join("|");
        const regex = new RegExp(`\\b(${pattern})\\s*(\\d+)\\s*[:\\.\\-\\s]?\\s*(\\d+)`, "i");
        const match = text.match(regex);
        if (match) {
          return { book: book.name, chapter: match[2], verse: match[3] };
        }
      }
      return null;
    };

    const reference = detectBibleReference(combined);
    if (reference) {
      onTranscribe(`Reference detected: ${reference.book} ${reference.chapter}:${reference.verse}`, "");
      leftoverRef.current = "";
      return;
    }

    const words = combined.split(/\s+/).filter(Boolean);

    if (words.length >= MIN_CHUNK_WORDS) {
      const take = Math.min(MAX_CHUNK_WORDS, words.length);
      const chunk = words.slice(0, take).join(" ");
      const leftover = words.slice(take).join(" ");
      leftoverRef.current = leftover;
      onTranscribe(chunk, leftover);
    } else {
      leftoverRef.current = combined;
      onTranscribe(null, leftoverRef.current);
    }
  };

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("SpeechRecognition API not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

recognition.onresult = (event) => {
  let interimText = "";
  let finalText = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    if (result.isFinal) finalText += result[0].transcript + " ";
    else interimText += result[0].transcript + " ";
  }

  const combined = (leftoverRef.current + " " + interimText + " " + finalText)
    .trim()
    .replace(/\s+/g, " ");

  if (!combined) return;

  // 🔵 Live textarea update
  onTranscribe(null, combined, { live: true });

  if (pauseTimer.current) clearTimeout(pauseTimer.current);

  const words = combined.split(" ");

  const doSearch = () => {
    if (!combined) return;
    // Keep leftover words beyond MAX_CHUNK_WORDS in leftoverRef
    const take = Math.min(MAX_CHUNK_WORDS, words.length);
    const chunk = words.slice(0, take).join(" ");
    const leftover = words.slice(take).join(" ");
    leftoverRef.current = leftover;

    onTranscribe(chunk, leftover, { forceSearch: true });
  };

  // Rule 1: immediate search if 15+ words final
  if (words.length >= 15 && finalText) {
    doSearch();
    return;
  }

  // Rule 2: search after 1s pause
  pauseTimer.current = setTimeout(doSearch, 1000);
};





    recognition.onerror = (event) => console.error("SpeechRecognition error:", event.error);

recognition.onend = () => {
  if (listening && !isPausedRef.current) {
    recognition.start();
  }
};


    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch (e) {}
      recognitionRef.current = null;
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, [onTranscribe, listening]);

// Start microphone listening
const startListening = () => {
  if (disabled || listening || !recognitionRef.current) return;
  leftoverRef.current = "";
  isPausedRef.current = false;
  recognitionRef.current.start();
  setListening(true);
};

const stopListening = () => {
  if (!listening || !recognitionRef.current) return;
  leftoverRef.current = "";
  isPausedRef.current = true;  // prevent auto-restart
  recognitionRef.current.stop();
  setListening(false);
};


// Toggle mic
const toggleListening = () => (listening ? stopListening() : startListening());

  const randomHeight = (idx) => {
    const base = 6 + (idx % 3) * 3;
    return `${base + Math.floor(Math.random() * 10)}px`;
  };

  useImperativeHandle(ref, () => ({
  start: startListening,
  stop: stopListening,
  toggle: toggleListening,
  isListening: () => listening,
}));

return (
  <>
    {/* Mic Wrapper (Centered) */}
    <MicButton
      listening={listening}
      toggleListening={toggleListening}
      disabled={false}
    />
  </>
);

});
export default VoiceInput;

