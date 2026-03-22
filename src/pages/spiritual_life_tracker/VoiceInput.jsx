import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import MicButton from "./MicButton";
import Toast from "../../component/shared/Toast";
import assets from '../../assets/assets'
import BackendAudioCapture from "./inner_component/BackendAudioCapture";
import { useAuth } from "../../context/AuthContext";
import { useTTS } from "../../context/TTSContext";


const VoiceInput = forwardRef(({ onTranscribe, disabled, mode = "lemonfox", statusMessage = "" }, ref) => {
  // Use refs for immediate state access without re-renders
  const listeningRef = useRef(false);
  const isThinkingRef = useRef(false);
  
  // State for UI updates only - these trigger re-renders
  const [listening, setListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
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
  const backendRef = useRef(null);
  const speechEngineRef = useRef("lemonfox"); // "web" | "vosk" | "lemonfox"
  const errorRef = useRef(null);
  const isStartingRef = useRef(false); // Prevent double-start


  // chunking config
  const MIN_CHUNK_WORDS = 5; 
  const MAX_CHUNK_WORDS = 20; 
  const PAUSE_MS = 200; 
  const bibleBooks = assets.bibleBooks


    const [voiceState, setVoiceState] = useState(VOICE_STATE.IDLE);

// Use external statusMessage from parent if provided, otherwise use internal
const displayStatus = statusMessage || (() => {
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
    case VOICE_STATE.LISTENING:
      return "Listening… (speak now)";
    default:
      return "Ready – speak or type";
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

// Part 4: Lemonfox transcription quality boost - rule-based cleanup
const cleanupTranscript = (text) => {
  if (!text) return "";
  
  let cleaned = text.toLowerCase().trim();
  
  // Remove filler words
  cleaned = cleaned.replace(/\s+(um|uh|like|you know|basically|actually|right|so)\b/gi, " ");
  
  // Remove repeated words (like "and and")
  cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, "$1");
  
  // Convert number words to digits for verse references
  const numberWords = [
    ["one", "1"], ["two", "2"], ["three", "3"], ["four", "4"],
    ["five", "5"], ["six", "6"], ["seven", "7"], ["eight", "8"],
    ["nine", "9"], ["ten", "10"], ["eleven", "11"], ["twelve", "12"],
    ["thirteen", "13"], ["fourteen", "14"], ["fifteen", "15"],
    ["sixteen", "16"], ["seventeen", "17"], ["eighteen", "18"],
    ["nineteen", "19"], ["twenty", "20"]
  ];
  
  // Convert "john three sixteen" -> "john 3:16"
  for (const [word, digit] of numberWords) {
    cleaned = cleaned.replace(new RegExp(`\\s+${word}\\s+(\\d+)?`, 'gi'), ` ${digit} $1`);
  }
  
  // Convert "first john" -> "1 john", "second corinthians" -> "2 corinthians"
  const ordinalMap = [
    ["first", "1"], ["second", "2"], ["third", "3"], ["fourth", "4"],
    ["fifth", "5"], ["sixth", "6"], ["seventh", "7"], ["eighth", "8"],
    ["ninth", "9"], ["tenth", "10"]
  ];
  
  for (const [ordinal, digit] of ordinalMap) {
    cleaned = cleaned.replace(new RegExp(`\\b${ordinal}\\s+(\\w+)`, 'gi'), `${digit} $1`);
  }
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  return cleaned;
};

// 🎯 Optimized backend chunk handler with useCallback
// Deep fix: Ensure Bible references are parsed and navigation is triggered immediately
const handleBackendChunk = useCallback((text) => {
  if (!text?.trim()) {
    console.log("📝 Empty transcript received, resetting state");
    setVoiceState(VOICE_STATE.READY);
    setIsThinking(false);
    isThinkingRef.current = false;
    return;
  }

  console.log("📝 Backend transcript (raw):", text);

  // 🚫 Backend engines are ONE-SHOT (full transcription) → NEVER cap or use leftover
  leftoverRef.current = "";

  // Part 4: Apply cleanup to improve Bible reference detection
  const cleanedText = cleanupTranscript(text);
  console.log("📝 Backend transcript (cleaned):", cleanedText);

  // IMMEDIATELY clear loading state (<50ms requirement)
  setVoiceState(VOICE_STATE.TRANSCRIBING);
  setIsThinking(true);
  isThinkingRef.current = true;

  // 1️⃣ Live textarea update (replace full text)
  onTranscribe(null, cleanedText, {
    live: true,
    source: speechEngineRef.current,
    replace: true,
  });

  // 2️⃣ Parse Bible references immediately
  const fullTranscript = cleanedText.trim();
  
  // Check for Bible references in the transcript
  const bibleReference = detectBibleReference(fullTranscript);
  
  if (bibleReference) {
    console.log("📖 Bible reference detected:", bibleReference);
    // Directly trigger navigation
    onTranscribe(`Reference detected: ${bibleReference.book} ${bibleReference.chapter}:${bibleReference.verse}`, "", {
      forceSearch: true,
      source: speechEngineRef.current,
      isVerseReference: true,
      onComplete: () => {
        console.log("🔹 Bible reference search complete, resetting to READY");
        setVoiceState(VOICE_STATE.READY);
        setIsThinking(false);
        isThinkingRef.current = false;
      },
      onError: (err) => {
        console.error("🔹 Bible reference error:", err);
        setVoiceState(VOICE_STATE.ERROR);
        setIsThinking(false);
        isThinkingRef.current = false;
      }
    });
    return;
  }

  // 3️⃣ No verse reference - proceed with full search
  // Use requestIdleCallback to not block UI
  requestIdleCallback(() => {
    setVoiceState(VOICE_STATE.PROCESSING);

    onTranscribe(fullTranscript, "", {  // ← send FULL text, empty leftover
      forceSearch: true,
      source: speechEngineRef.current,
      onComplete: () => {
        console.log("🔹 Search complete (Lemonfox/Vosk), resetting to READY");
        setVoiceState(VOICE_STATE.READY);
        setIsThinking(false);
        isThinkingRef.current = false;
      },
      onError: (err) => {
        console.error("🔹 Search error:", err);
        setVoiceState(VOICE_STATE.ERROR);
        setIsThinking(false);
        isThinkingRef.current = false;
        setError("Search failed. Please try again.");
      }
    });
  });
}, [onTranscribe]);

// Helper to detect Bible references with NLP-lite
const detectBibleReference = (text) => {
  const normalized = text.toLowerCase().replace(/chapter|verse|explain|what does|mean/gi, "").trim();
  
  // Common Bible book patterns
  for (const book of bibleBooks) {
    const patterns = [
      // Exact name or alias
      new RegExp(`^${book.name.toLowerCase()}\\s*(\\d+)[\\s:.-]*(\\d+)?`, 'i'),
      new RegExp(`${book.name.toLowerCase()}\\s*(\\d+)[\\s:.-]*(\\d+)?`, 'i'),
      // Common abbreviations
      ...book.aliases?.map(alias => 
        new RegExp(`^${alias.toLowerCase()}\\s*(\\d+)[\\s:.-]*(\\d+)?`, 'i')
      ) || []
    ];
    
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        return {
          book: book.name,
          chapter: match[1],
          verse: match[2] || '1'
        };
      }
    }
  }
  
  return null;
};



  useEffect(() => {
  const handleOffline = () => {
    if (listeningRef.current) {
      setError("No internet connection");
      stopListening();
    }
  };

  const handleOnline = () => {
    // Optionally notify user that connection is restored
    console.log("📡 Connection restored");
  };

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("online", handleOnline);
  };
}, []);


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
  }, [onTranscribe, currentMode]);

  
useEffect(() => {
  listeningRef.current = listening;
}, [listening]);

useEffect(() => {
  errorRef.current = error;
}, [error]);

// 🎯 Optimized start/stop functions - UI updates first, heavy work deferred
const startListening = useCallback(async () => {
  // Block if TTS or processing is active
  if (shouldBlockVoice) {
    console.log("🔹 Voice input blocked - TTS or processing active");
    return;
  }
  
  if (disabled || listeningRef.current || isStartingRef.current) return;
  
  // Immediately update UI state (instant feedback)
  isStartingRef.current = true;
  setListening(true);
  listeningRef.current = true;
  setError(null);
  leftoverRef.current = "";
  isPausedRef.current = false;

  // WebSpeech
  if (speechEngineRef.current === "web") {
    // Defer the heavy work
    requestIdleCallback(async () => {
      const ok = await checkAvailability();
      if (!ok) {
        setVoiceState(VOICE_STATE.ERROR);
        setListening(false);
        listeningRef.current = false;
        isStartingRef.current = false;
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
        setListening(false);
        listeningRef.current = false;
      }
      isStartingRef.current = false;
    });
  }

  // Backend capture (vosk/hybrid/lemonfox)
  else if (backendRef.current) {
    requestIdleCallback(() => {
      leftoverRef.current = "";
      backendRef.current.start();
      setVoiceState(VOICE_STATE.READY);
      isStartingRef.current = false;
    });
  }
}, [shouldBlockVoice, disabled]);

const stopListening = useCallback(() => {
  if (!listeningRef.current) return;

  // Immediately update UI (instant feedback)
  setListening(false);
  listeningRef.current = false;
  setIsTranscribing(false);
  setVoiceState(VOICE_STATE.IDLE);

  // WebSpeech - defer heavy work
  if (speechEngineRef.current === "web" && recognitionRef.current) {
    requestIdleCallback(() => {
      leftoverRef.current = "";
      isPausedRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    });
  }

  // Backend capture
  else if (backendRef.current) {
    requestIdleCallback(() => {
      leftoverRef.current = "";
      backendRef.current.stop();
    });
  }
}, []);


// Toggle mic (memoized for performance)
const toggleListening = useCallback(() => {
  if (listeningRef.current) {
    stopListening();
  } else {
    startListening();
  }
}, [stopListening, startListening]);

  const randomHeight = (idx) => {
    const base = 6 + (idx % 3) * 3;
    return `${base + Math.floor(Math.random() * 10)}px`;
  };

  useImperativeHandle(ref, () => ({
    start: startListening,
    stop: stopListening,
    toggle: toggleListening,
    isListening: () => listeningRef.current,
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
  listeningRef.current = false;
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
      listening={listening}                    // remains for recording logic
      isThinking={isThinking}                  // ← new prop
      toggleListening={toggleListening}
      disabled={false}
      statusMessage={displayStatus}
    />

    {/* Part 2: Improved mode buttons with better UX */}
    <div className="mode-buttons" title="Switch voice input engine">
      <button
        onClick={() => switchMode("web")}
        disabled={currentMode === "web"}
        className={currentMode === "web" ? "active" : ""}
        title="WebSpeech API"
      >
        {currentMode === "web" ? "🌐 Web" : "🌐"}
      </button>

      <button
        onClick={() => switchMode("vosk")}
        disabled={currentMode === "vosk"}
        className={currentMode === "vosk" ? "active" : ""}
        title="Vosk Engine"
      >
        {currentMode === "vosk" ? "🎯 Vosk" : "🎯"}
      </button>

      <button
        onClick={() => switchMode("lemonfox")}
        disabled={currentMode === "lemonfox"}
        className={currentMode === "lemonfox" ? "active" : ""}
        title="Lemonfox AI (Recommended)"
      >
        {currentMode === "lemonfox" ? "🦊 Lemonfox" : "🦊"}
      </button>
    </div>





    {/* Backend capture */}
    {currentMode !== "web" && (
      <BackendAudioCapture
        ref={backendRef}
        userId={user._id}
        mode={currentMode}
        onResult={(data)=>{
          // Handle error cases
          if (data?.error) {
            console.error("📝 Lemonfox error:", data.error);
            if (data.error === "offline") {
              setError("No internet connection. Please try again when online.");
            } else if (data.error === "timeout") {
              setError("Request timed out. Please try again.");
            } else {
              setError("Voice recognition failed. Please try again.");
            }
            setVoiceState(VOICE_STATE.ERROR);
            setIsThinking(false);
            isThinkingRef.current = false;
            return;
          }
          
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
