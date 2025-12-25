import React, { useState, useEffect, useRef,forwardRef, useImperativeHandle } from "react";
import { Mic, MicOff } from "lucide-react";
import MicButton from "./MicButton";
import Toast from "../../component/shared/Toast";
import assets from '../../assets/assets'



const VoiceInput = forwardRef(({ onTranscribe, disabled }, ref) => {
  const [listening, setListening] = useState(false);
  const [micAvailable, setMicAvailable] = useState(true);
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const VOICE_STATE = {
  IDLE: "idle",
  READY: "ready",
  LISTENING: "listening",
  TRANSCRIBING: "transcribing",
  PROCESSING: "processing",
  TTS: "tts",
  ERROR: "error",
};
  const [voiceState, setVoiceState] = useState(VOICE_STATE.IDLE);
const statusMessage = (() => {
  switch (voiceState) {
    case VOICE_STATE.READY:
      return "Speak now, I am listening";
    case VOICE_STATE.TRANSCRIBING:
      return "Loading text...";
    case VOICE_STATE.PROCESSING:
      return "Searching scripture...";
    case VOICE_STATE.TTS:
      return "Speaking...";
    case VOICE_STATE.ERROR:
      return error || "Voice error";
    default:
      return "";
  }
})();


  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const leftoverRef = useRef(""); // unsent words
  const pauseTimer = useRef(null);
  const isPausedRef = useRef(false);
  const listeningRef = useRef(false);
const errorRef = useRef(null);


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


const checkAvailability = async () => {
  // 1️⃣ Check mic availability
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    setMicAvailable(true);
  } catch (err) {
    setMicAvailable(false);
    setSpeechAvailable(false);
    return false;
  }

  // 2️⃣ Check WebSpeech API existence
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setSpeechAvailable(false);
    return false;
  }

  // 3️⃣ Test if recognition can start without error
  const testRecognition = new SpeechRecognition();
  testRecognition.continuous = false;
  testRecognition.interimResults = false;

  return new Promise((resolve) => {
    let resolved = false;

    const cleanUp = () => {
      testRecognition.onstart = null;
      testRecognition.onerror = null;
      testRecognition.onend = null;
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    };

    testRecognition.onstart = () => {
      setSpeechAvailable(true);
      testRecognition.stop();
      if (!resolved) {
        resolved = true;
        resolve(true);
      }
    };

    testRecognition.onerror = (e) => {
      console.warn("WebSpeech API not ready:", e);
      setSpeechAvailable(false);
      cleanUp();
    };

    testRecognition.onend = () => {
      cleanUp();
    };

    try {
      testRecognition.start();
    } catch (err) {
      console.warn("WebSpeech start failed:", err);
      setSpeechAvailable(false);
      resolve(false);
    }
  });
};




  useEffect(() => {
  const handleOffline = () => {
    if (listening) {
      setError("No internet connection");
      stopListening();
    }
  };

  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("offline", handleOffline);
  };
}, [listening]);


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
    if (finalText.trim()) {
    setIsTranscribing(false);
    setVoiceState(VOICE_STATE.PROCESSING)
  }

};

recognition.onerror = (event) => {
  console.error("SpeechRecognition error:", event.error);

  // 🚫 Ignore non-fatal silence
  if (event.error === "no-speech") return;

  let message = "Speech recognition failed";

  if (
    event.error === "network" ||
    event.error === "aborted" ||
    event.error === "service-not-allowed"
  ) {
    message = "No or poor internet connection";
  } else if (event.error === "not-allowed") {
    message = "Microphone access denied";
  }

  errorRef.current = message;
  setError(message);

  stopListening(); // ⛔ hard stop
};



 recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch (e) {}
      recognitionRef.current = null;
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, [onTranscribe, listening]);

  
useEffect(() => {
  listeningRef.current = listening;
}, [listening]);

useEffect(() => {
  errorRef.current = error;
}, [error]);

// Start microphone listening
const startListening = async () => {
  if (disabled || listening || !recognitionRef.current) return;

  setError(null); // clear old error
  leftoverRef.current = "";
  isPausedRef.current = false;

    const ok = await checkAvailability();
      if (!ok) {
    setVoiceState(VOICE_STATE.ERROR);
    return;
  }


    if (navigator.vibrate) {
    navigator.vibrate(25); // light tap feedback
  }

  try {
    recognitionRef.current.start();
  setVoiceState(VOICE_STATE.READY);
    setListening(true);
  } catch (e) {
    console.error(e);
       setError("Error starting WebSpeech")
       setVoiceState(VOICE_STATE.ERROR);
  }
};


const stopListening = () => {
  if (!listening || !recognitionRef.current) return;

  leftoverRef.current = "";
  isPausedRef.current = true;
  recognitionRef.current.stop();

  setIsTranscribing(false);
  setVoiceState(VOICE_STATE.IDLE);

  listeningRef.current = false;
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
      statusMessage={statusMessage}
    />
  {error && (
  <Toast
    message={error}
    type="error"
    duration={4000}
    onClose={() => setError(null)}
  />
)}

  </>
);

});
export default VoiceInput;

