import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import MicButton from "./MicButton";
import Toast from "../../component/shared/Toast";
import assets from '../../assets/assets'
import BackendAudioCapture from "./inner_component/BackendAudioCapture";
import { useAuth } from "../../context/AuthContext";
import { useTTS } from "../../context/TTSContext";


const VoiceInput = forwardRef(({ onTranscribe, disabled, mode = "lemonfox"}, ref) => {
  const [listening, setListening] = useState(false);
  const [micAvailable, setMicAvailable] = useState(true);
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { user } = useAuth();
  const [currentMode, setCurrentMode] = useState("lemonfox");

  // TTS Context for blocking voice during TTS/processing
  const { shouldBlockVoice } = useTTS();


  const VOICE_STATE = {
  IDLE: "idle",
  READY: "ready",
  LISTENING: "listening",
  TRANSCRIBING: "transcribing",
  PROCESSING: "processing",
  TTS: "tts",
  ERROR: "error",
};



  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const leftoverRef = useRef(""); // unsent words
  const pauseTimer = useRef(null);
  const isPausedRef = useRef(false);
  const listeningRef = useRef(false);
  const backendRef = useRef(null);
  const speechEngineRef = useRef("lemonfox"); // "web" | "vosk" | "lemonfox"
  const errorRef = useRef(null);


  // chunking config
  const MIN_CHUNK_WORDS = 5; 
  const MAX_CHUNK_WORDS = 20; 
  const PAUSE_MS = 200; 
  const bibleBooks = assets.bibleBooks


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
  speechEngineRef.current = mode;
}, [mode]);

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

// 🎯 Optimized backend chunk handler with useCallback
const handleBackendChunk = useCallback((text) => {
  if (!text) return;

  console.log("📝 Backend transcript:", text);

  // 🚫 IMPORTANT: Backend engines should NEVER use leftover
  leftoverRef.current = "";

  // 1️⃣ Update textarea ONLY with current speech
  onTranscribe(null, text, {
    live: true,
    source: speechEngineRef.current,
    replace: true, // 🔑 parent textarea must replace, not append
  });

  const words = text.trim().split(/\s+/);

  // 2️⃣ ALWAYS trigger search pipeline - even for short transcripts
  // This ensures Lemonfox behaves like WebSpeech/Vosk
  const chunk = words.slice(0, MAX_CHUNK_WORDS).join(" ");
  const leftover = words.length > MAX_CHUNK_WORDS ? words.slice(MAX_CHUNK_WORDS).join(" ") : "";

  // If not enough words, still trigger search but with shorter delay logic
  if (words.length < MIN_CHUNK_WORDS) {
    // For short transcripts, still set processing state
    setVoiceState(VOICE_STATE.PROCESSING);
    
    // Trigger search - processChunks will handle the short input
    onTranscribe(chunk, leftover, {
      forceSearch: true,
      source: speechEngineRef.current,
      onComplete: () => {
        console.log("🔹 Short transcript search complete, resetting to READY");
        setVoiceState(VOICE_STATE.READY);
      }
    });
    return;
  }

  // 3️⃣ Set processing state before search
  setVoiceState(VOICE_STATE.PROCESSING);

  // 4️⃣ Trigger search with ONLY this speech
  onTranscribe(chunk, leftover, {
    forceSearch: true,
    source: speechEngineRef.current,
    onComplete: () => {
      // Reset to READY after search completes
      console.log("🔹 Search complete, resetting to READY");
      setVoiceState(VOICE_STATE.READY);
    }
  });
}, [onTranscribe]);




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
  // Only process if WebSpeech is active (use state for consistency with React rendering)
  if (currentMode !== "web") return;
  
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

    // Set processing state before search
    setVoiceState(VOICE_STATE.PROCESSING);

    onTranscribe(chunk, leftover, {
      forceSearch: true,
      onComplete: () => {
        // Reset to READY after search completes
        console.log("🔹 WebSpeech search complete, resetting to READY");
        setVoiceState(VOICE_STATE.READY);
      }
    });
  };

  // Rule 1: immediate search if 15+ words final
  if (words.length >= 15 && finalText) {
    doSearch();
    return;
  }

  // Rule 2: search after 1s pause
  if (finalText.trim()) {
    pauseTimer.current = setTimeout(doSearch, 1000);
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
  }, [onTranscribe]);

  
useEffect(() => {
  listeningRef.current = listening;
}, [listening]);

useEffect(() => {
  errorRef.current = error;
}, [error]);

// 🎯 Optimized start/stop functions with useCallback
const startListening = useCallback(async () => {
  // Block if TTS or processing is active
  if (shouldBlockVoice) {
    console.log("🔹 Voice input blocked - TTS or processing active");
    return;
  }
  
  if (disabled || listening) return;

  setError(null); // clear old error
  leftoverRef.current = "";
  isPausedRef.current = false;

  // WebSpeech
  if (speechEngineRef.current === "web") {
    const ok = await checkAvailability();
    if (!ok) {
      setVoiceState(VOICE_STATE.ERROR);
      return;
    }

    if (navigator.vibrate) navigator.vibrate(45); // light tap feedback

    try {
      recognitionRef.current.start();
      setVoiceState(VOICE_STATE.READY);
    } catch (e) {
      console.error(e);
      setError("Error starting WebSpeech");
      setVoiceState(VOICE_STATE.ERROR);
    }
  }

  // Backend capture (vosk/hybrid/lemonfox)
  else if (backendRef.current) {
    leftoverRef.current = "";
    backendRef.current.start();
    setVoiceState(VOICE_STATE.READY);
  }

  setListening(true);
}, [shouldBlockVoice, disabled, listening]);

const stopListening = useCallback(() => {
  if (!listening) return;

  // WebSpeech
  if (speechEngineRef.current === "web" && recognitionRef.current) {
    leftoverRef.current = "";
    isPausedRef.current = true;
    recognitionRef.current.stop();
  }

  // Backend capture
  else if (backendRef.current) {
    leftoverRef.current = "";
    backendRef.current.stop();
  }

  setIsTranscribing(false);
  setVoiceState(VOICE_STATE.IDLE);
  listeningRef.current = false;
  setListening(false);
}, [listening]);





// Toggle mic (memoized for performance)
const toggleListening = useCallback(() => {
  if (listening) {
    stopListening();
  } else {
    startListening();
  }
}, [listening, stopListening, startListening]);

  const randomHeight = (idx) => {
    const base = 6 + (idx % 3) * 3;
    return `${base + Math.floor(Math.random() * 10)}px`;
  };

  useImperativeHandle(ref, () => ({
  start: startListening,
  stop: stopListening,
  toggle: toggleListening,
  isListening: () => listening,
  setMode: (m) => { speechEngineRef.current = m; }
}));

// 🎯 Optimized mode switching with useCallback to prevent unnecessary re-renders
const switchMode = useCallback((newMode) => {
  // Early return if already in this mode
  if (speechEngineRef.current === newMode) {
    console.log(`Already in ${newMode} mode`);
    return;
  }
  
  console.log(`🔄 Switching mode from ${speechEngineRef.current} to ${newMode}`);
  
  // Stop current engine completely (synchronous for performance)
  if (listeningRef.current) {
    if (speechEngineRef.current === "web" && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Error stopping WebSpeech:", e);
      }
    } else if (backendRef.current) {
      backendRef.current.stop();
    }
  }

  // Clear all state in one batch for better performance
  leftoverRef.current = "";
  isPausedRef.current = false;
  
  // Clear any pending timers
  if (pauseTimer.current) {
    clearTimeout(pauseTimer.current);
    pauseTimer.current = null;
  }

  // Update ref first (synchronous)
  speechEngineRef.current = newMode;
  
  // Batch state updates to minimize re-renders
  setListening(false);
  setIsTranscribing(false);
  setVoiceState(VOICE_STATE.IDLE);
  setError(null);
  setCurrentMode(newMode); // ✅ triggers re-render

  console.log(`✅ Mode switched to ${newMode}`);
}, []); // Empty deps since we use refs for all dynamic values


return (
  <>
    {/* Mic Wrapper (Centered) */}
    <MicButton
      listening={listening}
      toggleListening={toggleListening}
      disabled={false}
      statusMessage={statusMessage}
    />

<div className="mode-buttons">
  <button
    onClick={() => switchMode("web")}
    disabled={currentMode === "web"}
    className={currentMode === "web" ? "active" : ""}
  >
    {currentMode === "web" ? "Web" : "W"}
  </button>

  <button
    onClick={() => switchMode("vosk")}
    disabled={currentMode === "vosk"}
    className={currentMode === "vosk" ? "active" : ""}
  >
    {currentMode === "vosk" ? "Vosk" : "V"}
  </button>

  <button
    onClick={() => switchMode("lemonfox")}
    disabled={currentMode === "lemonfox"}
    className={currentMode === "lemonfox" ? "active" : ""}
  >
    {currentMode === "lemonfox" ? "Lemonfox" : "L"}
  </button>
</div>







    {/* Backend capture */}
    {currentMode !== "web" && (
      <BackendAudioCapture
        ref={backendRef}
        userId={user._id}
        mode={currentMode}
        onResult={(data)=>{
         if(!data?.transcript) return;
         handleBackendChunk(data.transcript)
        }}
        toggleListening={toggleListening}
      />
    )}

    {/* Error Toast */}
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
