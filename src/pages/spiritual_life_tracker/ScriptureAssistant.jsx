import React, { useState, useRef, useEffect, useCallback, useTransition } from "react";
import VoiceInput from "./VoiceInput";
import bible from "../../data/en_kjv.json";
import { flattenBible } from "../../utils/flattenBible";
import { BookOpen, Play, Keyboard, Search, ArrowRight } from "lucide-react";
import "./biblereader.css";
import assets from "../../assets/assets";
import IntroModal from "./IntroModal";
import VerseCard from "../../component/shared/VerseCard";
import { processCommand } from "../../utils/CommandProcessor";
import { useTTS } from "../../context/TTSContext";

// ---------------- Debounce helper ----------------
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// ---------------- Enhanced Status Messages ----------------
const STATUS_MESSAGES = {
  IDLE: "Ready – speak or type",
  LISTENING: "Listening… (speak now)",
  RECORDING_FINISHED: "Recording finished — sending audio to Lemonfox...",
  SENDING_TO_LEMONFOX: "Sending speech to Lemonfox API... (please wait)",
  PAUSE_DETECTED: "2-second pause detected — processing what you said...",
  TRANSCRIBING: "Transcribing speech... (Lemonfox is working)",
  SPEECH_RECEIVED: "Speech received successfully — now searching scriptures...",
  SEARCHING: "Searching the Bible for your request...",
  SPEECH_TIMEOUT: "No speech received from Lemonfox (timeout) — please try speaking again",
  LEMMONFOX_ERROR: "Lemonfox API error — please check your internet or try again",
  PROCESSING_COMPLETE: "Done — you can speak again",
  PROCESSING_VOICE: "Processing voice…",
  ANALYZING_SCRIPTURE: "Analyzing scripture…",
  NAVIGATING: "Navigating to verse…",
  ERROR_MIC: "Error: Microphone blocked – check permissions",
  ERROR_NETWORK: "Error: No internet – voice may not work",
  TYPING_MODE_ON: "Typing Mode – press Enter to search",
  TYPING_MODE_OFF: "Live mode – searching as you type",
  SEARCH_COMPLETE: "Found matching verses",
  NO_RESULTS: "No verses found for this search",
  TOO_SHORT: "Search canceled – input too short",
};

// ----------------- ScriptureAssistant -----------------
export default function ScriptureAssistant({ currentUser }) {
  const inputRef = useRef(null);
  const voiceInputRef = useRef(null);
  
  // Use useTransition for non-blocking state updates
  const [isPending, startTransition] = useTransition();
  
  // ========== TYPING MODE STATE ==========
  const [isManualTypingMode, setIsManualTypingMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState(STATUS_MESSAGES.IDLE);
  const [navFeedback, setNavFeedback] = useState(null);
  
  const [text, setText] = useState("");
  const [processedChunks, setProcessedChunks] = useState([]);
  const processedChunksRef = useRef([]);
  const [matchedVerses, setMatchedVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const lastSpokenVerseRef = useRef(null);
  const ttsUtteranceRef = useRef(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [currentContext, setCurrentContext] = useState({
    currentBook: null,
    currentChapter: null,
    currentVerse: null
  });
  
  // Refs for performance
  const isSearchingRef = useRef(false);
  const lastSearchTimeRef = useRef(0);

  // TTS Context for voice blocking
  const { shouldBlockVoice, isSpeaking, isProcessing, startSpeaking, stopSpeaking, startProcessing, stopProcessing } = useTTS();

  const versesRef = useRef([]);
  const verseByIdRef = useRef(new Map());
  const invertedIndexRef = useRef(new Map());
  const bookChapterMapRef = useRef(new Map());
  const localIndexReady = useRef(false);
  
  // Web Worker reference
  const workerRef = useRef(null);
  const pendingSearchRef = useRef(new Map());
  const searchIdRef = useRef(0);

  const bibleBooks = assets.bibleBooks2;

  // ----------------- Initialize Web Worker -----------------
  useEffect(() => {
    // Create worker
    workerRef.current = new Worker('/searchWorker.js');
    
    workerRef.current.onmessage = (e) => {
      const { type, id, results } = e.data;
      
      if (type === 'searchResults' && results) {
        const pending = pendingSearchRef.current.get(id);
        if (pending) {
          pending.resolve(results);
          pendingSearchRef.current.delete(id);
        }
      } else if (type === 'initComplete') {
        console.log('Search worker initialized');
        setStatusMessage(STATUS_MESSAGES.IDLE);
      }
    };
    
    workerRef.current.onerror = (err) => {
      console.error('Worker error:', err);
      setStatusMessage(STATUS_MESSAGES.ERROR_NETWORK);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // ----------------- Initialize local index -----------------
  useEffect(() => {
    const { verses, invertedIndex, bookChapterMap } = flattenBible(bible);
    versesRef.current = verses;

    verseByIdRef.current = new Map();
    invertedIndexRef.current = new Map();
    bookChapterMapRef.current = new Map();

    for (const v of verses) {
      verseByIdRef.current.set(v.id, v);
      for (const t of v.tokens) {
        if (!invertedIndexRef.current.has(t)) invertedIndexRef.current.set(t, new Set());
        invertedIndexRef.current.get(t).add(v.id);
      }
      bookChapterMapRef.current.set(`${v.book}|${v.chapter}|${v.verse}`, v.id);
    }

    localIndexReady.current = true;

    // Initialize worker with index data
    if (workerRef.current) {
      // Convert Maps to serializable format
      const serializableInvertedIndex = new Map();
      for (const [key, value] of invertedIndexRef.current) {
        serializableInvertedIndex.set(key, value);
      }
      
      workerRef.current.postMessage({
        type: 'init',
        payload: {
          verseById: Array.from(verseByIdRef.current.entries()),
          invertedIndex: serializableInvertedIndex,
          versesLength: verses.length
        }
      });
    }

    const seenIntro = localStorage.getItem("SpringsConnectSeenIntro");
    if (!seenIntro) setShowIntro(true);
  }, []);

  // ----------------- Text-to-Speech -----------------
  const toggleSpeakVerse = (verse) => {
    if (!verse || !window.speechSynthesis) return;

    if (ttsPlaying) {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
      stopSpeaking();
      // Resume voice input after stopping
      voiceInputRef.current?.start?.();
      return;
    }

    // Stop voice input when TTS starts
    if (voiceInputRef.current?.stop) voiceInputRef.current.stop();
    
    // Notify TTS context that we're starting
    startSpeaking();

    const utterance = new SpeechSynthesisUtterance(verse.text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setTtsPlaying(true);
    };
    utterance.onend = () => {
      setTtsPlaying(false);
      stopSpeaking();
      // Resume voice input after TTS finishes
      voiceInputRef.current?.start?.();
    };
    utterance.onerror = () => {
      setTtsPlaying(false);
      stopSpeaking();
      // Resume voice input on error too
      voiceInputRef.current?.start?.();
    };

    ttsUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // ----------------- Navigate verses/chapter -----------------
  const navigateVerse = useCallback((action, payload = {}) => {
    console.log("=== NAVIGATE VERSE ===");
    console.log("Action:", action, "Payload:", payload);
    console.log("Current context before nav:", currentContext);

    let { currentBook, currentChapter, currentVerse } = currentContext;

    switch (action) {
      case "nextVerse":
        currentVerse++;
        break;
      case "prevVerse":
        currentVerse = Math.max(1, currentVerse - 1);
        break;
      case "jumpVerse":
        currentBook = payload.book;
        currentChapter = payload.chapter;
        currentVerse = payload.verse;
        break;
      case "jumpChapter":
        currentBook = payload.book;
        currentChapter = payload.chapter;
        currentVerse = 1;
        break;
      default:
        console.warn("Unknown navigation action:", action);
        return;
    }

    const key = `${currentBook}|${currentChapter}|${currentVerse}`;
    console.log("Constructed verse key:", key);

    const id = bookChapterMapRef.current.get(key);
    const verse = id ? verseByIdRef.current.get(id) : null;

    if (verse) {
      console.log("Found verse:", verse);
      setCurrentContext({ currentBook, currentChapter, currentVerse });
      setMatchedVerses([verse]);
      toggleSpeakVerse(verse);
    } else {
      console.warn("Verse not found for key:", key);
      setCurrentContext(currentContext);
      setMatchedVerses([]);
    }
  }, [currentContext]);

  const handleIntroComplete = () => {
    localStorage.setItem("SpringsConnectSeenIntro", "true");
    setShowIntro(false);
  };

  const autoGrowTextarea = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };
  useEffect(() => autoGrowTextarea(), [text]);
  useEffect(() => autoGrowTextarea(), []);

  // ----------------- Local verse fetch -----------------
  const getLocalVerse = (book, chapter, verse) => {
    const key = `${book}|${chapter}|${verse}`;
    const id = bookChapterMapRef.current.get(key);
    return id !== undefined ? verseByIdRef.current.get(id) : null;
  };

  // ----------------- Run search via Web Worker (non-blocking) -----------------
  const runLocalSearch = useCallback(async (query, isManualSearch = false) => {
    if (!query.trim() || !localIndexReady.current) return;

    // Performance tracking
    const startTime = performance.now();
    console.log("=== RUN LOCAL SEARCH ===");
    console.log("Incoming query:", query);
    console.log("Current context:", currentContext);

    // Prevent overlapping searches - skip if already searching
    if (isSearchingRef.current && !isManualSearch) {
      console.log("Search skipped - another search in progress");
      return;
    }
    isSearchingRef.current = true;

    // 1️⃣ Process command (navigation vs search)
    const cmdResult = processCommand(query, currentContext);
    console.log("COMMAND RESULT:", cmdResult);

    if (cmdResult.type === "navigation") {
      console.log("Navigation command detected. Executing jump...");
      
      // Update status immediately - OPTIMISTIC UI
      setStatusMessage(STATUS_MESSAGES.NAVIGATING);
      const navText = `${cmdResult.book} ${cmdResult.chapter}:${cmdResult.verse || 1}`;
      setNavFeedback(`Jumping to ${navText}`);
      
      // Show navigation feedback briefly
      setTimeout(() => setNavFeedback(null), 1500);

      // Execute the jump (verse or chapter)
      navigateVerse(cmdResult.action, cmdResult);

      // Update context based on jump
      const newContext = {
        currentBook: cmdResult.book || currentContext.currentBook,
        currentChapter: cmdResult.chapter || currentContext.currentChapter,
        currentVerse: cmdResult.verse || currentContext.currentVerse,
      };
      setCurrentContext(newContext);
      
      isSearchingRef.current = false;
      setStatusMessage(STATUS_MESSAGES.IDLE);

      console.log("Navigation done. Skipping search for this chunk.");
      return "commandHandled";
    }

    // 2️⃣ If not a navigation command, treat as search
    // Set loading state immediately (non-blocking)
    setLoading(true);
    // Use external status from VoiceInput if it's more detailed, otherwise use local SEARCHING
    setStatusMessage(prevStatus => 
      prevStatus.includes("Lemonfox") || prevStatus.includes("Transcribing") || prevStatus.includes("Recording")
        ? prevStatus 
        : STATUS_MESSAGES.SEARCHING
    );
    voiceInputRef.current?.stop();

    // Use worker for search (non-blocking)
    return new Promise((resolve) => {
      const searchId = ++searchIdRef.current;
      
      // Store the resolver
      pendingSearchRef.current.set(searchId, {
        resolve: (results) => {
          const duration = performance.now() - startTime;
          console.log(`Search completed in ${duration.toFixed(0)}ms, found ${results.length} results`);
          
          if (results.length) {
            const verse = results[0];
            startTransition(() => {
              setMatchedVerses(results);
              setCurrentContext({
                currentBook: verse.book,
                currentChapter: verse.chapter,
                currentVerse: verse.verse
              });
            });
            
            setStatusMessage(STATUS_MESSAGES.SEARCH_COMPLETE);

            // Speak verse only if it is new
            const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
            if (lastSpokenVerseRef.current !== verseKey) {
              lastSpokenVerseRef.current = verseKey;
              toggleSpeakVerse(verse);
            }
          } else {
            console.log("No matching verses found for this query.");
            startTransition(() => setMatchedVerses([]));
            setStatusMessage(STATUS_MESSAGES.NO_RESULTS);
          }

          isSearchingRef.current = false;
          setLoading(false);
          voiceInputRef.current?.start?.();
          
          // Reset to idle after short delay
          setTimeout(() => {
            setStatusMessage(STATUS_MESSAGES.IDLE);
          }, 1500);
          
          resolve("searchComplete");
        }
      });

      // Send search request to worker
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'search',
          payload: { query },
          id: searchId
        });
      } else {
        // Fallback if worker not available - use requestIdleCallback
        requestIdleCallback(() => {
          const pending = pendingSearchRef.current.get(searchId);
          if (pending) {
            pending.resolve([]);
          }
        });
      }
    });
  }, [currentContext, navigateVerse, startTransition]);

  // ----------------- Sliding window chunks -----------------
  const getChunksSliding = (input, windowSize = 10, stride = 5) => {
    const words = input.trim().split(/\s+/).filter(Boolean);
    if (words.length <= windowSize) return [words.join(" ")];
    const chunks = [];
    for (let start = 0; start < words.length; start += stride) {
      const slice = words.slice(start, start + windowSize);
      chunks.push(slice.join(" "));
      if (start + windowSize >= words.length) break;
    }
    return chunks;
  };

  // ----------------- Process chunks with debouncing (non-blocking) -----------------
  // OPTIMIZED: Always runs in background, never blocks UI
  const processChunks = useCallback(debounce(async (inputText, onComplete, forceNewSearch = false) => {
    // Skip if in manual typing mode (only search on Enter)
    if (isManualTypingMode) {
      if (onComplete) onComplete();
      return;
    }
    
    if (!inputText.trim()) {
      if (onComplete) onComplete();
      return;
    }

    console.log("=== PROCESS CHUNKS ===", { 
      inputText, 
      forceNewSearch, 
      source: "backend" 
    });

    // ───────────────────────────────────────────────────────────────
    // Step 1: First try navigation on the FULL text (most important for commands)
    // ───────────────────────────────────────────────────────────────
    const fullCmdResult = processCommand(inputText, currentContext);
    console.log("FULL TEXT COMMAND RESULT:", fullCmdResult);

    if (fullCmdResult.type === "navigation") {
      console.log("Navigation command found in FULL transcript → executing");
      const result = await runLocalSearch(inputText, true); // will handle navigation
      if (result === "commandHandled") {
        if (onComplete) onComplete();
        return;
      }
    }

    // ───────────────────────────────────────────────────────────────
    // Step 2: If no navigation → proceed with chunking & search
    // ───────────────────────────────────────────────────────────────
    let chunks;
    if (forceNewSearch) {
      const words = inputText.trim().split(/\s+/).filter(Boolean);
      chunks = words.length <= 10 
        ? [inputText.trim()] 
        : getChunksSliding(inputText);
    } else {
      chunks = getChunksSliding(inputText).filter(
        (c) => !processedChunksRef.current.includes(c)
      );
    }

    console.log("Chunks to process:", chunks);

    // Process chunks sequentially but non-blocking
    for (const chunk of chunks) {
      console.log("Processing chunk:", chunk);
      const result = await runLocalSearch(chunk, forceNewSearch);
      console.log("runLocalSearch result for chunk:", result);

      processedChunksRef.current.push(chunk);

      if (result === "commandHandled") {
        console.log("Navigation found in chunk → stopping further processing");
        break;
      }
    }

    setProcessedChunks([...processedChunksRef.current]);
    if (onComplete) onComplete();
  }, 150), [currentContext, runLocalSearch, isManualTypingMode]);

  // ----------------- Manual Search (Enter key) -----------------
  const handleManualSearch = useCallback(() => {
    if (!text.trim()) return;
    
    console.log("=== MANUAL SEARCH (Enter) ===", text);
    setStatusMessage(STATUS_MESSAGES.SEARCHING);
    
    // Clear previous processed chunks for fresh search
    processedChunksRef.current = [];
    setProcessedChunks([]);
    
    // Run immediate search
    runLocalSearch(text, true);
  }, [text, runLocalSearch]);

  // ----------------- Handle change (instant update) -----------------
  // OPTIMIZED: Text updates instantly, search is deferred
  const handleChange = (e) => {
    const value = e.target.value;
    // Instant text update - no delay (≤30ms)
    setText(value);
    autoGrowTextarea();
    
    // Skip auto-search in manual typing mode
    if (isManualTypingMode) {
      return;
    }
    
    // Search runs in background via worker (debounced)
    processChunks(value);
  };
  
  // ----------------- Handle key down (Enter to search) -----------------
  const handleKeyDown = (e) => {
    // Enter key triggers manual search in typing mode
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isManualTypingMode && text.trim()) {
        handleManualSearch();
      }
    }
    // Shift+Enter allows newline
  };
  
  // ----------------- Toggle Typing Mode -----------------
  const toggleTypingMode = () => {
    setIsManualTypingMode(prev => {
      const newMode = !prev;
      setStatusMessage(newMode ? STATUS_MESSAGES.TYPING_MODE_ON : STATUS_MESSAGES.TYPING_MODE_OFF);
      console.log("Typing mode changed:", newMode ? "Manual (press Enter)" : "Live search");
      return newMode;
    });
  };

  // ----------------- Render -----------------
  return (
    <div className="min-w-full max-w-2xl mx-auto p-4" style={{ background: "var(--chat-custom-gradient)", minHeight: "100vh" }}>
      {showIntro && <IntroModal onComplete={handleIntroComplete} />}

      <div className="flex flex-col items-center mb-6 text-center">
        <div className="flex items-center mb-2">
          <BookOpen className="w-7 h-7 text-[var(--primary)] mr-2" />
          <h2 className="text-2xl font-bold text-[var(--primary)] tracking-tight">Scripture Assistant</h2>
        </div>
        <span className="text-[var(--text-secondary)] text-sm max-w-md leading-relaxed">
          Speak and find the wisdom you seek. Ask for specific chapters or share your heart.
        </span>
      </div>

      <VoiceInput
        ref={voiceInputRef}
        statusMessage={statusMessage}
        onTranscribe={(sentChunk, leftover, meta = {}) => {
          /*
            =========================
            1️⃣ LIVE UPDATES
            =========================
          */
          if (meta.live && leftover) {
            setText(leftover);
            return;
          }

          /*
            =========================
            2️⃣ NO FINAL RESULT
            =========================
          */
          if (!sentChunk) return;

          /*
            =========================
            3️⃣ VERSE REFERENCE DETECTED (from LemonFox)
            =========================
          */
          if (meta.isVerseReference) {
            console.log("📖 Processing verse reference from LemonFox:", sentChunk);
            setText(sentChunk);
            // Update status - use detailed message if available
            setStatusMessage(STATUS_MESSAGES.SPEECH_RECEIVED);
            // Force a new search for verse reference
            processChunks(sentChunk, meta.onComplete, true);
            return;
          }

          /*
            =========================
            4️⃣ FINAL RESULT + SEARCH
            =========================
          */
          setText(sentChunk);
          
          // Update status for processing - use detailed message
          setStatusMessage(STATUS_MESSAGES.SPEECH_RECEIVED);

          // 🔥 NEW: Backend (Lemonfox/Vosk) must ALWAYS search (bypass deduplication)
          const isBackend = meta.source && meta.source !== "web";
          const forceNewSearch = isBackend || meta.forceSearch;

          processChunks(sentChunk, meta.onComplete, forceNewSearch);
        }}
      />

      {/* Navigation feedback flash */}
      {navFeedback && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          animation: 'navFeedbackFade 1.5s ease-in-out forwards',
        }}>
          <div className="bg-[var(--primary)] text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
            {navFeedback}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center w-full gap-5 mt-4">
        {/* Typing Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTypingMode}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200
              ${isManualTypingMode 
                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
              }
              hover:scale-105 active:scale-95
            `}
            title={isManualTypingMode ? "Switch to live search" : "Switch to manual typing mode"}
          >
            {isManualTypingMode ? <Keyboard className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
            {isManualTypingMode ? "Manual" : "Live"}
          </button>
          
          {isManualTypingMode && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" /> Press Enter to search
            </span>
          )}
        </div>
        

        <textarea
          ref={inputRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={!isManualTypingMode 
            ? "🎤 Speak now — voice mode is active" 
            : "Type your scripture search..."
          }
          disabled={!currentUser || !isManualTypingMode}
          rows={1}
          className={`
            w-full
            max-w-[650px]
            rounded-xl
            border
            p-4
            text-sm
            transition-all duration-150
            ${!isManualTypingMode 
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed' 
              : isManualTypingMode 
                ? 'border-amber-300 bg-amber-50 focus:ring-2 focus:ring-amber-200 focus:border-amber-400' 
                : 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
            }
            focus:outline-none
            resize-none
            overflow-hidden
            text-slate-900
            placeholder:text-slate-400
            disabled:opacity-60
            disabled:cursor-not-allowed
          `}
        />
        
        {/* Search Button - Only show in typing/manual mode */}
        {isManualTypingMode && (
          <button
            onClick={handleManualSearch}
            disabled={!text.trim() || loading}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm
              transition-all duration-200
              ${text.trim() && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            Search Scriptures
          </button>
        )}

        <div className="space-y-4 w-full flex flex-col items-center">
          {loading ? <div>Loading...</div> : matchedVerses.map((v, idx) => (
            <VerseCard
              key={idx}
              verse={v}
              index={idx}
              isFirst={idx === 0}
              ttsPlaying={ttsPlaying}
              onToggleSpeak={toggleSpeakVerse}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
