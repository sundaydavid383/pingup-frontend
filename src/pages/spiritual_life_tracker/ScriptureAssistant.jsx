// ScriptureAssistant.jsx
import React, { useState, useRef, useEffect } from "react";
import VoiceInput from "./VoiceInput";
import bible from "../../data/en_kjv.json";
import { flattenBible } from "../../utils/flattenBible";
import { BookOpen } from "lucide-react";
import Fuse from "fuse.js";
import { Play, Pause } from "lucide-react";
import "./biblereader.css"
import assets from "../../assets/assets";
import IntroModal from "./IntroModal";



// Debounce helper
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// URL where backend exposes the preprocessed bible bundle (adjust if needed)
// The expected JSON shape (compact):
// {
//   verses: [ { id, book, chapter, verse, text, cleaned, tokens, tokenCount }, ... ],
//   invertedIndex: { token: [id, id, ...], ... },
//   bookChapterMap: { "Genesis|1|1": id, ... }
// }

export default function ScriptureAssistant({ currentUser }) {
  const inputRef = useRef(null);
  const [text, setText] = useState("");
  const [processedChunks, setProcessedChunks] = useState([]);
  const [matchedVerses, setMatchedVerses] = useState([]);
  const [error, setError] = useState(null);
  const [currentContext, setCurrentContext] = useState({
    currentBook: null,
    currentChapter: null,
    currentVerse: null
  });
  const processedChunksRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const bibleBooks = assets.bibleBooks2
  const [showIntro, setShowIntro] = useState(false);

  

// local index refs
const versesRef = useRef([]);
const verseByIdRef = useRef(new Map());
const invertedIndexRef = useRef(new Map());
const bookChapterMapRef = useRef(new Map());
const localIndexReady = useRef(false);
const chunkCache = useRef({});
const fuseRef = useRef(null);
const lastSpokenVerseRef = useRef(null);
const [ttsPlaying, setTtsPlaying] = useState(false);
const ttsUtteranceRef = useRef(null);
const voiceInputRef = useRef(null);


// -------------------------
// Initialize local index + Fuse.js (ONE-TIME)
// -------------------------
useEffect(() => {
  const { verses, invertedIndex, bookChapterMap } = flattenBible(bible);

  versesRef.current = verses;

  verseByIdRef.current = new Map();
  invertedIndexRef.current = new Map();
  bookChapterMapRef.current = new Map();

  for (const v of verses) {
    verseByIdRef.current.set(v.id, v);

    for (const t of v.tokens || tokenize(clean(v.text))) {
      if (!invertedIndexRef.current.has(t)) {
        invertedIndexRef.current.set(t, new Set());
      }
      invertedIndexRef.current.get(t).add(v.id);
    }

    const key = `${v.book}|${v.chapter}|${v.verse}`;
    bookChapterMapRef.current.set(key, v.id);
  }

  // ✅ Initialize Fuse HERE (correct place)
  fuseRef.current = new Fuse(verses, {
    keys: ["text", "book"],
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 3,
  });

  localIndexReady.current = true;
     console.log("running test to see localStorage...")
    const seenIntro = localStorage.getItem("SpringsConnectSeenIntro");
    console.log("this is what SpringsConnectSeenIntro is:", seenIntro)
    if (!seenIntro) {
      setShowIntro(true);
    }
}, []);




const toggleSpeakVerse = (verse) => {
  if (!verse || !window.speechSynthesis) return;

  // Stop current TTS if already playing
  if (ttsPlaying) {
    window.speechSynthesis.cancel();
    setTtsPlaying(false);

    // Resume mic if available
    if (voiceInputRef.current?.start) {
      voiceInputRef.current.start(); // <-- changed from startListening
    }

    return;
  }

  // Stop mic before starting TTS
  if (voiceInputRef.current?.stop) {
    voiceInputRef.current.stop(); // <-- changed from stopListening
  }

  // Start new TTS
  const utterance = new SpeechSynthesisUtterance(verse.text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;

  utterance.onstart = () => setTtsPlaying(true);

  utterance.onend = () => {
    setTtsPlaying(false);

    // Resume mic after TTS finishes
    if (voiceInputRef.current?.start) {
      voiceInputRef.current.start(); // <-- changed from startListening
    }
  };

  ttsUtteranceRef.current = utterance;
  window.speechSynthesis.speak(utterance);
};


//=============SHOW INTRO==============


  const handleIntroComplete = () => {
    localStorage.setItem("SpringsConnectSeenIntro", "true"); // store that user has seen the intro
    setShowIntro(false);
    console.log("set SpringsConnectSeenIntro to", showIntro )
  };







  // sliding window chunking (unchanged)
  const getChunksSliding = (input, windowSize = 10, stride = 5) => {
    const words = input.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    if (words.length <= windowSize) return [words.join(" ")];
    const chunks = [];
    for (let start = 0; start < words.length; start += stride) {
      const slice = words.slice(start, start + windowSize);
      if (slice.length) chunks.push(slice.join(" "));
      if (start + windowSize >= words.length) break;
    }
    return chunks;
  };

  // ---------- text normalization + tokenize helpers ----------
  const clean = (s) =>
    s
      .toLowerCase()
      .replace(/[\u2018\u2019\u201c\u201d]/g, "'") // normalize quotes
      .replace(/[^a-z0-9'\s]/g, " ") // remove punctuation except apostrophes
      .replace(/\s+/g, " ")
      .trim();

  const tokenize = (s) => {
    if (!s) return [];
    return s.split(/\s+/).filter(Boolean);
  };



  // ---------- helper: get verse by book/chapter/verse using local index ----------
  const getLocalVerse = (book, chapter, verse) => {
    const key = `${book}|${chapter}|${verse}`;
    const id = bookChapterMapRef.current.get(key);
    if (id !== undefined && verseByIdRef.current.has(id)) {
      return verseByIdRef.current.get(id);
    }
    // fallback: linear find (should not normally be needed)
    const found = versesRef.current.find(
      (v) => v.book === book && String(v.chapter) === String(chapter) && String(v.verse) === String(verse)
    );
    return found || null;
  };

  // ---------- runLocalSearch now uses localSearch if available, otherwise falls back to server ----------
  function buildBigrams(words) {
  const pairs = [];
  for (let i = 0; i < words.length - 1; i++) {
    pairs.push(words[i] + " " + words[i + 1]);
  }
  return pairs;
}

function letterSubsets(word) {
  if (word.length <= 3) return [word];
  return [
    word.slice(1),          // david -> avid
    word.slice(0, -1),      // david -> davi
    word.slice(1, -1),      // david -> avi
  ];
}

function wordSimilarity(a, b) {
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.85;
  return 0;
}

function normalizeBookName(rawBook) {
  if (!rawBook) return null;

  // Clean input
  const cleaned = rawBook.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  console.group(`🔍 Normalizing Book Name: "${rawBook}"`);
  console.log("Cleaned input:", cleaned);

  for (const book of bibleBooks) {
    const cleanedName = book.name.toLowerCase().replace(/\s+/g, " ");
    // Check official name
    if (cleanedName === cleaned) {
      console.log(`✅ Matched official name: ${book.name} → abbrev: ${book.abbrev}`);
      console.groupEnd();
      return book.abbrev;
    }

    // Check aliases
    for (const alias of book.aliases) {
      const cleanedAlias = alias.toLowerCase().replace(/\s+/g, " ");
      if (cleanedAlias === cleaned) {
        console.log(`✅ Matched alias: ${alias} → abbrev: ${book.abbrev}`);
        console.groupEnd();
        return book.abbrev;
      }
    }
  }

  console.warn("❌ No match found for:", rawBook);
  console.groupEnd();
  return null;
}





// ---------- Step 0: Fetch verse by reference ----------
function fetchVerseByReference(query) {
  console.group("📖 REFERENCE LOOKUP DEBUG");
  console.log("Raw query:", query);

  const referenceRegex =
    /(\b[1-3]?\s?[a-zA-Z]+)\s+(\d+)\s*(?:[:.\-]\s*(\d+))?/;

  const match = query.match(referenceRegex);

  console.log("Regex used:", referenceRegex);
  console.log("Regex match result:", match);

  if (!match) {
    console.warn("❌ No reference pattern matched");
    console.groupEnd();
    return null;
  }

  const rawBook = match[1];
  const chapter = Number(match[2]);
  const verse = match[3] ? Number(match[3]) : 1;

  console.log("Extracted raw book:", rawBook);
  console.log("Extracted chapter:", chapter);
  console.log("Extracted verse:", verse);

  const normalizedBook = normalizeBookName(rawBook);
  console.log("Normalized book name:", normalizedBook);

  const local = getLocalVerse(normalizedBook, chapter, verse);

  console.log("Local verse lookup result:", local);

  if (!local) {
    console.warn("❌ Reference exists but verse not found locally");
    console.groupEnd();
    return null;
  }

  console.log("✅ REFERENCE LOOKUP SUCCESS");
  console.groupEnd();

  return {
    verse: local,
    context: {
      currentBook: local.book,
      currentChapter: local.chapter,
      currentVerse: local.verse,
    },
  };
}



// 🟢 LAYER 1 Fuse.js semantic fuzzy ranking
const fuseLayer = (query) => {
  console.log("🔎 Trying LAYER 1: Fuse.js fuzzy search");

  if (!query.trim() || !fuseRef.current) {
    console.log("⏭️ LAYER 1 empty → move to LAYER 2");
    return null;
  }

  const results = fuseRef.current.search(query.trim());
  const q = query.trim().toLowerCase();

  if (!results.length) {
    console.log("⏭️ LAYER 1 no Fuse results → move to LAYER 2");
    return null;
  }

  const ranked = results
    .map(r => {
      const text = r.item.text.toLowerCase();
      const book = r.item.book.toLowerCase();

      let boost = 0;

      if (text.includes(q)) boost -= 0.15;
      if (book.includes(q)) boost -= 0.1;
      boost += Math.min(text.length / 1000, 0.1);

      return {
        ...r.item,
        _score: r.score + boost,
      };
    })
    .sort((a, b) => a._score - b._score);

  console.log("✅ Using LAYER 1: Fuse.js fuzzy search");
  return ranked.slice(0, 3);
};

// ---------- LAYER 1: Two-word phrase match ----------
function phraseMatchLayer(tokens, tokenSets) {
  console.log("🔎 Trying LAYER 2: Phrase match");

  const phrases = buildBigrams(tokens);
  const phraseMatches = [];

  // Flatten all candidate IDs
  const candidateIds = new Set(tokenSets.flatMap(s => [...s]));

  for (const id of candidateIds) {
    const v = verseByIdRef.current.get(id);
    const text = v.text.toLowerCase();

    let hitCount = 0;
    for (const p of phrases) {
      if (text.includes(p)) hitCount++;
    }

    if (hitCount > 0) {
      phraseMatches.push({ ...v, score: hitCount });
    }
  }

  if (phraseMatches.length === 0) {
    console.log("⏭️ LAYER 1 empty → move to LAYER 2");
    return null;
  }

  console.log("✅ Using LAYER 2: Phrase match");

  // Sort descending by score and take top 3
  phraseMatches.sort((a, b) => b.score - a.score);
  return phraseMatches.slice(0, 3);
}

// ---------- LAYER 2: Strict intersection exact match ----------
function exactMatchLayer(tokens, tokenSets) {
  console.log("🔎 Trying LAYER 3: Exact intersection match");

  if (!tokens.length || !tokenSets.length) {
    console.log("⏭️ LAYER 2 empty → move to next layer");
    return null;
  }

  // Sort sets by size to optimize intersection
  const sortedSets = [...tokenSets].sort((a, b) => a.size - b.size);
  let exactCandidates = new Set(sortedSets[0]);

  for (let i = 1; i < sortedSets.length; i++) {
    exactCandidates = new Set(
      [...exactCandidates].filter(id => sortedSets[i].has(id))
    );
    if (exactCandidates.size === 0) break;
  }

  // Filter candidates to only those that include all tokens in text
  const exactMatches = [...exactCandidates]
    .map(id => verseByIdRef.current.get(id))
    .filter(v => tokens.every(t => v.text.toLowerCase().includes(t)));

  if (!exactMatches.length) {
    console.log("⏭️ LAYER 2 empty → move to next layer");
    return null;
  }

  console.log("✅ Using LAYER 3: Exact match");

  // Sort by text length (shorter first) and return top 3
  exactMatches.sort((a, b) => a.text.length - b.text.length);
  return exactMatches.slice(0, 3);
}



// 🔹 LAYER 4: Token overlap scoring function
const tokenOverlapLayer = (tokens, tokenSets) => {
  console.log("🔎 Trying LAYER 4: Token overlap scoring");

  if (!tokens.length || !tokenSets.length) {
    console.log("⏭️ LAYER 4 empty → move to LAYER 5");
    return null;
  }

  // Start with intersection of token sets
  let candidates = new Set(tokenSets[0]);
  for (let i = 1; i < tokenSets.length; i++) {
    candidates = new Set([...candidates].filter(id => tokenSets[i].has(id)));
  }

  // If no intersection, fallback to union of all token sets
  if (candidates.size === 0) {
    candidates = new Set(tokenSets.flatMap(s => [...s]));
  }

  // Score candidates by token overlap
  const scored = [...candidates].map(id => {
    const v = verseByIdRef.current.get(id);
    const verseTokens = new Set(v.tokens || tokenize(clean(v.text)));
    const matches = tokens.filter(t => verseTokens.has(t)).length;
    return { ...v, score: matches / tokens.length, matches };
  });

  if (!scored.length) {
    console.log("⏭️ LAYER 4 no scored results → move to LAYER 5");
    return null;
  }

  console.log("✅ Using LAYER 4: Token overlap scoring");

  // Sort descending by score and take top 3
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
};


// 🟡 LAYER 5: Letter-subset word matching
const letterSubsetLayer = (tokens, tokenSets) => {
  console.log("🔎 Trying LAYER 5: Letter-subset matching");

  if (!tokens.length || !tokenSets.length) {
    console.log("⛔ LAYER 5 empty → no more layers");
    return null;
  }

  const matches = [];

  for (const id of new Set(tokenSets.flatMap(s => [...s]))) {
    const v = verseByIdRef.current.get(id);
    const verseWords = tokenize(clean(v.text));

    let hits = 0;
    for (const q of tokens) {
      const subs = letterSubsets(q);
      for (const vw of verseWords) {
        if (subs.some(s => vw.includes(s))) {
          hits++;
          break;
        }
      }
    }

    if (hits > 0) matches.push({ ...v, score: hits / tokens.length });
  }

  if (!matches.length) {
    console.log("⛔ LAYER 5 no matches → search exhausted");
    return null;
  }

  console.log("✅ Using LAYER 5: Letter-subset matching");

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 3);
};


// 🔴 LAYER 6: Letter-to-letter fallback
const fuzzyLayer = (tokens) => {
  console.log("🔎 Trying LAYER 6: Letter-to-letter fuzzy fallback");

  if (!tokens.length) {
    console.log("⛔ LAYER 6 empty (no tokens) → search exhausted");
    return null;
  }

  const fuzzy = [];

  for (const id of verseByIdRef.current.keys()) {
    const v = verseByIdRef.current.get(id);
    let score = 0;

    for (const q of tokens) {
      for (const w of tokenize(clean(v.text))) {
        score += wordSimilarity(q, w);
      }
    }

    if (score > 0.5) fuzzy.push({ ...v, score });
  }

  if (!fuzzy.length) {
    console.log("⛔ LAYER 6 no matches → search exhausted");
    return null;
  }

  console.log("✅ Using LAYER 6: Letter-to-letter fuzzy fallback");

  fuzzy.sort((a, b) => b.score - a.score);
  return fuzzy.slice(0, 3);
};

const STOP_WORDS = new Set([
  "the", "who", "was", "an", "is", "to", "and", "in", "he", "she", "of", "a"
]);

const runLocalSearch = async (query) => {
  if (!query.trim() || !localIndexReady.current) return;

  
  await new Promise(r => setTimeout(r, 0)); // yield to browser
  setLoading(true);
  const handleMatch = (matches) => {
  if (!matches || matches.length === 0) return false;

  const verse = matches[0];
  const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;

  setMatchedVerses(matches);

  setCurrentContext({
    currentBook: verse.book,
    currentChapter: verse.chapter,
    currentVerse: verse.verse,
  });

  // 🔐 Prevent repeated reading
  if (lastSpokenVerseRef.current !== verseKey) {
    lastSpokenVerseRef.current = verseKey;
    toggleSpeakVerse(verse);
  } else {
    console.log("🔁 Verse already spoken, skipping TTS");
  }

  setLoading(false);
  return true;
};

  // 0️⃣ Direct reference check
  const refResult = fetchVerseByReference(query);
  if (refResult) return handleMatch([refResult.verse]);

  // 1️⃣ Tokenize & get candidates
  const cleaned = clean(query);
  const tokens = tokenize(cleaned)
    .map(t => t.toLowerCase())
    .filter(t => !STOP_WORDS.has(t));

  let tokenSets = tokens.map(t => invertedIndexRef.current.get(t)).filter(Boolean);

  // Fallback: if all tokens missing, consider all verses
  if (!tokenSets.length) tokenSets = tokens.map(() => new Set(verseByIdRef.current.keys()));

  // Layers in order
  if (handleMatch(fuseLayer(query))) return; 
if (handleMatch(phraseMatchLayer(tokens, tokenSets))) return;      // Layer 1: bigram phrase
if (handleMatch(exactMatchLayer(tokens, tokenSets))) return;       // Layer 2: strict intersection                        // Layer 3: Fuse semantic
if (handleMatch(tokenOverlapLayer(tokens, tokenSets))) return;     // Layer 4: token overlap
if (handleMatch(letterSubsetLayer(tokens, tokenSets))) return;     // Layer 5: letter subset
if (handleMatch(fuzzyLayer(tokens))) return;                       // Layer 6: fuzzy letter

  setMatchedVerses([]); // no matches
  setLoading(false);
  console.log("loading is false done loading", loading)
};

useEffect(() => {
  console.log("🔄 loading changed:", loading);
}, [loading]);





  // ---------- processChunks (unchanged) ----------
const processChunks = debounce(async (inputText) => {
  if (!inputText.trim()) return;
  if (parseContextCommand(inputText)) return;

  const chunks = getChunksSliding(inputText);
  const newChunks = chunks.filter(c => !processedChunksRef.current.includes(c));

  for (const chunk of newChunks) {
    await runLocalSearch(chunk);
  }

  processedChunksRef.current.push(...newChunks);
  setProcessedChunks([...processedChunksRef.current]);
}, 250);



  // ---------- parseContextCommand & fetchVerse (slightly adapted to check local index first) ----------
  const parseContextCommand = (input) => {
    let match;

    match = input.match(/chapter (\d+) verse (\d+)/i);
    if (match && currentContext.currentBook) {
      const newContext = {
        ...currentContext,
        currentChapter: parseInt(match[1]),
        currentVerse: parseInt(match[2])
      };
      setCurrentContext(newContext);
      fetchVerse(
        currentContext.currentBook,       // keep book from context
        newContext.currentChapter,
        newContext.currentVerse
      );
      return true;
    }

    match = input.match(/verse (\d+)/i);
    if (match && currentContext.currentBook && currentContext.currentChapter) {
      const newVerse = parseInt(match[1]);
      setCurrentContext((prev) => ({
        ...prev,
        currentVerse: newVerse
      }));
      fetchVerse(currentContext.currentBook, currentContext.currentChapter, newVerse);
      return true;
    }

    return false;
  };


  const fetchVerse = async (book, chapter, verse) => {
    // try local
    const local = getLocalVerse(book, chapter, verse);
    if (local) {
      setMatchedVerses((prev) => [...prev, local]);
      return;
    }

    // else fallback to backend
    return
  };

  // ---------- textarea change handler ----------
  const handleChange = (e) => {
    setText(e.target.value);

    // Auto-resize textarea
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }

    processChunks(e.target.value);
  };

  //==================auto grow==================
  const autoGrowTextarea = () => {
  const el = inputRef.current;
  if (!el) return;

  el.style.height = "auto";          // allow shrink
  el.style.height = el.scrollHeight + "px"; // grow to fit
};
useEffect(() => {
  autoGrowTextarea();
}, [text]);
useEffect(() => {
  autoGrowTextarea();
}, []);

  // ---------- render ----------
  return (
<div
  className="min-w-full max-w-2xl mx-auto p-4 m-auto"
  style={{
    background: "var(--chat-custom-gradient)",
    minHeight: "100vh",
  }}
>
      {showIntro && <IntroModal onComplete={handleIntroComplete} />}


<div className="flex flex-col items-center mb-6 text-center">
  <div className="flex items-center mb-2">
    <BookOpen className="w-7 h-7 text-[var(--primary)] mr-2" />
    <h2 className="text-2xl font-bold text-[var(--primary)] tracking-tight">
      Scripture Assistant
    </h2>
  </div>
  <span className="text-[var(--text-secondary)] text-sm max-w-md leading-relaxed">
Speak and find the wisdom you seek. Ask for specific chapters or share your heart. If the assistant isn’t listening, simply turn the microphone off and on again to continue.</span>
</div>

<VoiceInput
   ref={voiceInputRef}
  onTranscribe={async (sentChunk, leftover, meta = {}) => {
    // 🔵 Live typing: always update textarea with what's being spoken
    if (meta.live) {
      setText(leftover); // show interim/live speech
      return;
    }

    // 🟢 Forced search triggered
    if (meta.forceSearch && sentChunk) {
      setText(sentChunk); // update textarea with the chunk being searched

      // Only process if not already processed
      if (!processedChunksRef.current.includes(sentChunk)) {
        processedChunksRef.current.push(sentChunk);
        setProcessedChunks([...processedChunksRef.current]);
        await runLocalSearch(sentChunk);
      }

      // leftoverRef is already updated in VoiceInput; next speech will append correctly
      return;
    }

    // Optional fallback for any chunk that comes without flags
    if (sentChunk) {
      setText(sentChunk);
      if (!processedChunksRef.current.includes(sentChunk)) {
        processedChunksRef.current.push(sentChunk);
        setProcessedChunks([...processedChunksRef.current]);
        await runLocalSearch(sentChunk);
      }
    }
  }}
/>






<div className="flex flex-col items-center w-full gap-5">

  <textarea
    ref={inputRef}
    value={text}
    onChange={handleChange}
    placeholder={currentUser ? "Speak or type your scripture..." : "Sign in to use"}
    disabled={!currentUser}
    rows={1}
    className="
      w-full
      max-w-[600px]
      rounded-[var(--radius)]
      border
      border-[var(--input-border)]
      bg-[var(--white)]
      p-4
      text-[var(--secondary)]
      text-sm
      placeholder:text-[var(--text-muted)]
      shadow-[var(--input-shadow)]
      focus:outline-none
      focus:ring-2
      focus:ring-[var(--primary)]
      focus:border-[var(--primary)]
      transition-[var(--transition-default)]
      resize-none
      overflow-hidden
    "
  />

  <div className="space-y-8">
       {
  loading ? (
    <div className="space-y-3">
  {[...Array(3)].map((_, idx) => (
    <div
      key={idx}
      className="flex items-start gap-3 p-3 border-l-4 border-indigo-500 bg-gray-100 rounded-md animate-pulse"
    >
      {/* SVG Book */}
      <svg
        className="w-5 h-5 text-indigo-400 animate-pulse"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 016.5 7H20v13" />
      </svg>

      <div className="flex-1">
        <div className="h-3 bg-gray-300 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
      </div>
    </div>
  ))}
</div>

  ):
  matchedVerses.map((v, idx) => (
<div
  key={idx}
  className="
    verse-card
    group
    relative
    rounded-xl
    max-w-[600px]
    px-5
    py-4
    shadow-sm
    border
    border-white/10
    transition-[var(--transition-default)]
    hover:shadow-md
    hover:border-[var(--primary)]
  "
>
  {/* Accent bar */}
  <div
    className="
      verse-accent
      absolute
      left-0
      top-4
      bottom-4
      w-[3px]
      rounded-full
      bg-[var(--primary)]
    "
  />

  {/* Reference */}
  <p
    className="
      verse-reference
      mb-1
      text-[11px]
      font-medium
      tracking-wider
      uppercase
    "
  >
    {v.book} {v.chapter}:{v.verse}
  </p>

  {/* Verse text */}
<div className="flex flex-col">
  <p className="text-[15px] leading-relaxed text-[var(--secondary)] font-normal transition-[var(--transition-default)] group-hover:text-[var(--white)]">
    {v.text}
  </p>
{idx === 0 && (
  <button
    className="mt-3 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg hover:bg-indigo-700 transition-[var(--transition-default)] relative z-10"
    onClick={() => toggleSpeakVerse(v)}
    title={ttsPlaying ? "Pause" : "Play"}
  >
    {ttsPlaying ? <Pause size={20} /> : <Play size={20} />}
  </button>
)}

</div>

</div>


))}
</div>
</div>



      {error && (
        <div className="p-3 bg-red-100 border-l-4 border-red-600 text-red-700 rounded-md mb-3">
          <p className="text-sm">{error}</p>
        </div>
      )}


    </div>
  );
}
