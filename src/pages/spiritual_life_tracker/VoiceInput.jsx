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


  // Expanded VOICE_STATE for detailed status visibility
  const VOICE_STATE = {
    IDLE: "idle",
    READY: "ready",
    LISTENING: "listening",
    RECORDING_FINISHED: "recording_finished",
    SENDING_TO_LEMONFOX: "sending_to_lemonfox",
    PAUSE_DETECTED: "pause_detected",
    TRANSCRIBING: "transcribing",
    SPEECH_RECEIVED: "speech_received",
    SEARCHING: "searching",
    SPEECH_TIMEOUT: "speech_timeout",
    LEMMONFOX_ERROR: "lemonfox_error",
    PROCESSING_COMPLETE: "processing_complete",
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

// Use external statusMessage from parent ONLY when idle/ready, otherwise use internal detailed states
// This ensures the user sees every step of the voice process
const getInternalStatus = () => {
  switch (voiceState) {
    case VOICE_STATE.READY:
      return "Speak now, I am listening";
    case VOICE_STATE.LISTENING:
      return "Listening… (speak now)";
    case VOICE_STATE.RECORDING_FINISHED:
      return "Recording finished — sending audio to Lemonfox...";
    case VOICE_STATE.SENDING_TO_LEMONFOX:
      return "Sending speech to Lemonfox API... (please wait)";
    case VOICE_STATE.PAUSE_DETECTED:
      return "2-second pause detected — processing what you said...";
    case VOICE_STATE.TRANSCRIBING:
      return "Transcribing speech... (Lemonfox is working)";
    case VOICE_STATE.SPEECH_RECEIVED:
      return "Speech received successfully — now searching scriptures...";
    case VOICE_STATE.SEARCHING:
      return "Searching the Bible for your request...";
    case VOICE_STATE.SPEECH_TIMEOUT:
      return "No speech received from Lemonfox (timeout) — please try speaking again";
    case VOICE_STATE.LEMONFOX_ERROR:
      return "Lemonfox API error — please check your internet or try again";
    case VOICE_STATE.PROCESSING_COMPLETE:
      return "Done — you can speak again";
    case VOICE_STATE.PROCESSING:
      return "Searching scripture...";
    case VOICE_STATE.TTS:
      return "Speaking...";
    case VOICE_STATE.ERROR:
      return error || "Voice error";
    case VOICE_STATE.IDLE:
      return "Ready – speak or type";
    default:
      return "Ready – speak or type";
  }
};

// Only use external statusMessage when truly idle, otherwise always show internal detailed status
const displayStatus = (voiceState === VOICE_STATE.IDLE || voiceState === VOICE_STATE.READY) && statusMessage 
  ? statusMessage 
  : getInternalStatus();

// Determine if mic should be disabled (during sending/transcribing)
const isMicDisabled = [
  VOICE_STATE.SENDING_TO_LEMONFOX,
  VOICE_STATE.TRANSCRIBING,
  VOICE_STATE.SEARCHING,
  VOICE_STATE.SPEECH_RECEIVED,
].includes(voiceState);
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
// Deep fix: Ensure Bible references are parsed and navigation is triggered immediately

// Helper: Clean up transcribed text (Part 4 - Lemonfox boost)
const cleanupTranscript = (text) => {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove filler words
  const fillers = /\b(um|uh|er|ah|like|you know|I mean|basically|actually|literally)\b/gi;
  cleaned = cleaned.replace(fillers, '');
  
  // Remove repeated words (e.g., "and and" -> "and")
  cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');
  
  // Convert written numbers to digits for verse references
  const numberWords = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
    'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18',
    'nineteen': '19', 'twenty': '20', 'thirty': '30', 'forty': '40',
    'fifty': '50', 'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90'
  };
  
  // Convert "john three sixteen" -> "john 3:16" pattern
  cleaned = cleaned.replace(/\b(\w+)\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/gi, 
    (match, book, chap, vers) => {
      const ch = numberWords[chap.toLowerCase()] || chap;
      const vs = numberWords[vers.toLowerCase()] || vers;
      return `${book} ${ch}:${vs}`;
    });
  
  // Convert "first john" -> "1 john", "second corinthians" -> "2 corinthians"
  cleaned = cleaned.replace(/\b(first|second|third|fourth|fifth)\s+(john|corinthians|thessalonians|timothy|peter|john|johns)\b/gi,
    (match, ord, book) => {
      const numMap = { 'first': '1', 'second': '2', 'third': '3', 'fourth': '4', 'fifth': '5' };
      return `${numMap[ord.toLowerCase()]} ${book}`;
    });
  
  // Convert standalone chapter numbers
  Object.keys(numberWords).forEach(word => {
    const regex = new RegExp(`\\b${word}\\b(?=\\s*[:\\.]\\s*\\d+)`, 'gi');
    cleaned = cleaned.replace(regex, numberWords[word]);
  });
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
};

const handleBackendChunk = useCallback((text) => {
  if (!text?.trim()) {
    console.log("📝 Empty transcript received, resetting state");
    setVoiceState(VOICE_STATE.PROCESSING_COMPLETE);
    setIsThinking(false);
    isThinkingRef.current = false;
    // Reset to ready after a brief delay
    setTimeout(() => {
      setVoiceState(VOICE_STATE.READY);
    }, 1500);
    return;
  }

  console.log("📝 Backend transcript (raw):", text);

  // 🚫 Backend engines are ONE-SHOT (full transcription) → NEVER cap or use leftover
  leftoverRef.current = "";


  // IMMEDIATELY update state to show speech received
  setVoiceState(VOICE_STATE.SPEECH_RECEIVED);
  setIsThinking(true);
  isThinkingRef.current = true;
  
  // Show "Speech received" for 1 second, then move to searching
  setTimeout(() => {
    setVoiceState(VOICE_STATE.SEARCHING);
  }, 1000);
  
  // 1️⃣ Apply transcription cleanup (Part 4)
  const cleanedText = cleanupTranscript(text);
  console.log("📝 Cleaned transcript:", cleanedText);


  // 2️⃣ Live textarea update (replace full text)
  onTranscribe(null, cleanedText, {
    live: true,
    source: speechEngineRef.current,
    replace: true,
  });

  // 3️⃣ Parse Bible references immediately

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
        setVoiceState(VOICE_STATE.PROCESSING_COMPLETE);
        setIsThinking(false);
        isThinkingRef.current = false;
        // Reset to ready after brief delay
        setTimeout(() => {
          setVoiceState(VOICE_STATE.READY);
        }, 1500);
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
        setVoiceState(VOICE_STATE.PROCESSING_COMPLETE);
        setIsThinking(false);
        isThinkingRef.current = false;
        // Reset to ready after brief delay
        setTimeout(() => {
          setVoiceState(VOICE_STATE.READY);
        }, 1500);
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
  setVoiceState(VOICE_STATE.LISTENING); // Show listening state immediately

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
  setIsTranscribing(true); // We're now processing the audio
  
  // Set state to show recording finished first
  setVoiceState(VOICE_STATE.RECORDING_FINISHED);
  
  // After brief delay, show we're sending to Lemonfox
  setTimeout(() => {
    setVoiceState(VOICE_STATE.SENDING_TO_LEMONFOX);
  }, 500);

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
      disabled={isMicDisabled || disabled}      // ← disable during sending/transcribing
      statusMessage={displayStatus}
      isSending={voiceState === VOICE_STATE.SENDING_TO_LEMONFOX || voiceState === VOICE_STATE.TRANSCRIBING}
    />


    {/* Input Mode Selector - Enhanced UX */}
    <div className="mode-selector-container">
      <label className="mode-selector-label">Input Mode</label>
      <div className="mode-buttons">
        <button
          onClick={() => switchMode("web")}
          disabled={currentMode === "web"}
          className={currentMode === "web" ? "active" : ""}
          title="Web Speech API - Works in most browsers"
        >
          {currentMode === "web" ? "🌐 Web" : "🌐"}
        </button>

        <button
          onClick={() => switchMode("vosk")}
          disabled={currentMode === "vosk"}
          className={currentMode === "vosk" ? "active" : ""}
          title="Vosk - Offline capable"
        >
          {currentMode === "vosk" ? "🎯 Vosk" : "🎯"}
        </button>

        <button
          onClick={() => switchMode("lemonfox")}
          disabled={currentMode === "lemonfox"}
          className={currentMode === "lemonfox" ? "active" : ""}
          title="Lemonfox - Best accuracy"
        >
          {currentMode === "lemonfox" ? "🦊 Lemonfox" : "🦊"}
        </button>
      </div>
    </div>





    {/* Backend capture */}
    {currentMode !== "web" && (
      <BackendAudioCapture
        ref={backendRef}
        userId={user._id}
        mode={currentMode}
        onStatus={(status) => {
          if (status === 'SILENCE_DETECTED') {
            setVoiceState(VOICE_STATE.PAUSE_DETECTED);
            setTimeout(() => {
              if (voiceState === VOICE_STATE.PAUSE_DETECTED) {
                setVoiceState(VOICE_STATE.SENDING_TO_LEMONFOX);
              }
            }, 2000);
          }
        }}
        onResult={(data)=>{
          // Handle error cases
          if (data?.error) {
            console.error("📝 Lemonfox error:", data.error);
            if (data.error === "offline") {
              setError("No internet connection. Please try again when online.");
              setVoiceState(VOICE_STATE.LEMONFOX_ERROR);
            } else if (data.error === "timeout") {
              setError("Request timed out. Please try again.");
              setVoiceState(VOICE_STATE.SPEECH_TIMEOUT);
            } else {
              setError("Voice recognition failed. Please try again.");
              setVoiceState(VOICE_STATE.LEMONFOX_ERROR);
            }
            setIsThinking(false);
            isThinkingRef.current = false;
            // Reset to ready after delay for error states too
            setTimeout(() => {
              setVoiceState(VOICE_STATE.READY);
            }, 3000);
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
