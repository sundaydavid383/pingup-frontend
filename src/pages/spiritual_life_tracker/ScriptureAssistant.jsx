// ScriptureAssistant.jsx
import React, { useState, useRef, useEffect } from "react";
import VoiceInput from "./VoiceInput";
import bible from "../../data/en_kjv.json";
import { flattenBible } from "../../utils/flattenBible";
import { BookOpen } from "lucide-react";
import Fuse from "fuse.js";
import "./biblereader.css"


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

// local index refs
const versesRef = useRef([]);
const verseByIdRef = useRef(new Map());
const invertedIndexRef = useRef(new Map());
const bookChapterMapRef = useRef(new Map());
const localIndexReady = useRef(false);
const chunkCache = useRef({});
const fuseRef = useRef(null);


// -------------------------
// Initialize local index from flattenBible
// -------------------------
// Initialize local index from flattenBible
useEffect(() => {
  const { verses, invertedIndex, bookChapterMap } = flattenBible(bible);
  console.log("Flattened verses:", verses);

  versesRef.current = verses;

  verseByIdRef.current = new Map();
  invertedIndexRef.current = new Map();
  bookChapterMapRef.current = new Map();

  for (const v of verses) {
    verseByIdRef.current.set(v.id, v);

    // build inverted index
    for (const t of v.tokens || tokenize(clean(v.text))) {
      if (!invertedIndexRef.current.has(t)) invertedIndexRef.current.set(t, new Set());
      invertedIndexRef.current.get(t).add(v.id);
    }

    // book|chapter|verse mapping
    const key = `${v.book}|${v.chapter}|${v.verse}`;
    bookChapterMapRef.current.set(key, v.id);
  }

  localIndexReady.current = true;
}, []);



const speakVerse = (verse) => {
  if (!verse || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(`${verse.text}`);
  utterance.lang = "en-US";
  utterance.rate = 1;     // normal speed
  utterance.pitch = 1;    // normal pitch
  window.speechSynthesis.cancel(); // stop any previous speech
  window.speechSynthesis.speak(utterance);
};





//============= FUSE.JS INITIALIZING....==================
useEffect(() => {
  if (versesRef.current.length) {
    fuseRef.current = new Fuse(versesRef.current, {
      keys: ["text", "book"],
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 3,
    });
  }
}, [versesRef.current]);



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

  // ---------- local in-browser search using inverted index ----------
  // tokens: array of normalized tokens for the query chunk
  const localSearch = (chunk) => {
    if (!localIndexReady.current) return null;
    const cleaned = clean(chunk);
    const tokens = tokenize(cleaned);
    if (tokens.length === 0) return null;

    // quick cache hit
    if (chunkCache.current[cleaned]) return chunkCache.current[cleaned];

    // gather candidate ids by token sets
    const tokenSets = [];
    for (const t of tokens) {
      const s = invertedIndexRef.current.get(t);
      if (s) tokenSets.push(s);
    }

    let candidates = new Set();
    if (tokenSets.length === 0) {
      // no token matches at all -> no candidates
      candidates = new Set();
    } else {
      // start from smallest set to reduce intersection cost
      tokenSets.sort((a, b) => a.size - b.size);
      // attempt intersection of the first few tokens
      let intersection = new Set(tokenSets[0]);
      for (let i = 1; i < tokenSets.length; i++) {
        const next = tokenSets[i];
        intersection = new Set([...intersection].filter((id) => next.has(id)));
        if (intersection.size === 0) break;
      }
      if (intersection.size > 0) {
        candidates = intersection;
      } else {
        // if strict intersection is empty, fall back to union (less strict)
        for (const s of tokenSets) for (const id of s) candidates.add(id);
      }
    }

    if (candidates.size === 0) {
      chunkCache.current[cleaned] = null;
      return null;
    }

    // scoring: count token overlap for each candidate
    const scored = [];
    for (const id of candidates) {
      const v = verseByIdRef.current.get(id);
      if (!v) continue;
      // compare tokens: count how many query tokens appear in verse tokens
      const verseTokens = new Set(v.tokens || tokenize(clean(v.cleaned || v.text || "")));
      let matches = 0;
      for (const t of tokens) if (verseTokens.has(t)) matches++;
      const score = matches / (v.tokenCount || (verseTokens.size || 1)); // relative match ratio
      scored.push({ id, score, matches });
    }

    // sort by score desc, then by absolute matches desc
    scored.sort((a, b) => {
      if (b.score === a.score) return b.matches - a.matches;
      return b.score - a.score;
    });

    // pick best candidate
    const best = scored[0];
    if (!best) {
      chunkCache.current[cleaned] = null;
      return null;
    }
    const resultVerse = verseByIdRef.current.get(best.id);
    // cache and return a simplified verse object for UI (book, chapter, verse, text)
    const result = {
      book: resultVerse.book,
      chapter: resultVerse.chapter,
      verse: resultVerse.verse,
      text: resultVerse.text,
      score: best.score,
      matches: best.matches
    };
    chunkCache.current[cleaned] = result;
    return result;
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
// ---------- Step 0: Fetch verse by reference ----------
function fetchVerseByReference(query) {
  const referenceRegex = /(\b[a-zA-Z]+)\s+(\d+)\s*(?:[:.\-]\s*(\d+))?/; 
  const match = query.match(referenceRegex);

  if (!match) return null;

  const bookName = match[1];
  const chapter = parseInt(match[2]);
  const verse = match[3] ? parseInt(match[3]) : 1;

  const local = getLocalVerse(bookName, chapter, verse);
  if (!local) return null;

  return {
    verse: local,
    context: {
      currentBook: local.book,
      currentChapter: local.chapter,
      currentVerse: local.verse,
    }
  };
}

// ---------- Step 1 & 2: Tokenize and fetch candidate verses ----------


function getTokenCandidates(query) {
  const cleaned = clean(query);
  const tokens = tokenize(cleaned)
  if (!tokens.length) return null;

  const tokenSets = tokens.map(t => invertedIndexRef.current.get(t)).filter(Boolean);
  if (!tokenSets.length) return null;

  return { tokens, tokenSets };
}



// ---------- LAYER 1: Two-word phrase match ----------
function phraseMatchLayer(tokens, tokenSets) {
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

  if (phraseMatches.length === 0) return null;

  // Sort descending by score and take top 3
  phraseMatches.sort((a, b) => b.score - a.score);
  return phraseMatches.slice(0, 3);
}


// ---------- LAYER 3: Strict intersection exact match ----------
function exactMatchLayer(tokens, tokenSets) {
  if (!tokens.length || !tokenSets.length) return null;

  // Sort sets by size to optimize intersection
  const sortedSets = [...tokenSets].sort((a, b) => a.size - b.size);
  let exactCandidates = new Set(sortedSets[0]);

  for (let i = 1; i < sortedSets.length; i++) {
    exactCandidates = new Set([...exactCandidates].filter(id => sortedSets[i].has(id)));
    if (exactCandidates.size === 0) break;
  }

  // Filter candidates to only those that include all tokens in text
  const exactMatches = [...exactCandidates]
    .map(id => verseByIdRef.current.get(id))
    .filter(v => tokens.every(t => v.text.toLowerCase().includes(t)));

  if (!exactMatches.length) return null;

  // Sort by text length (shorter first) and return top 3
  exactMatches.sort((a, b) => a.text.length - b.text.length);
  return exactMatches.slice(0, 3);
}


// 🔹 LAYER 4: Token overlap scoring function
const tokenOverlapLayer = (tokens, tokenSets) => {
  if (!tokens.length || !tokenSets.length) return null;

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

  if (!scored.length) return null;

  // Sort descending by score and take top 3
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
};

// 🟡 LAYER 3: Letter-subset word matching
const letterSubsetLayer = (tokens, tokenSets) => {
  if (!tokens.length || !tokenSets.length) return null;

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

  if (!matches.length) return null;

  matches.sort((a,b) => b.score - a.score);
  return matches.slice(0,3);
};

// 🔴 LAYER 4: Letter-to-letter fallback
const fuzzyLayer = (tokens) => {
  if (!tokens.length) return null;

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

  if (!fuzzy.length) return null;

  fuzzy.sort((a,b) => b.score - a.score);
  return fuzzy.slice(0,3);
};


const STOP_WORDS = new Set([
  "the", "who", "was", "an", "is", "to", "and", "in", "he", "she", "of", "a"
]);

const runLocalSearch = async (query) => {
  if (!query.trim() || !localIndexReady.current) return;

  setLoading(true);
  await new Promise(r => setTimeout(r, 0)); // yield to browser

  const handleMatch = (matches) => {
    if (!matches || matches.length === 0) return false;
    setMatchedVerses(matches);
    if (matches[0].book) {
      setCurrentContext({
        currentBook: matches[0].book,
        currentChapter: matches[0].chapter,
        currentVerse: matches[0].verse,
      });
    }
    speakVerse(matches[0]);
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
  if (handleMatch(phraseMatchLayer(tokens, tokenSets))) return;      // Layer 1: bigram phrase
  if (handleMatch(exactMatchLayer(tokens, tokenSets))) return;       // Layer 2: strict intersection
  if (handleMatch(tokenOverlapLayer(tokens, tokenSets))) return;     // Layer 3: token overlap
  if (handleMatch(letterSubsetLayer(tokens, tokenSets))) return;     // Layer 4: letter subset
  if (handleMatch(fuzzyLayer(tokens))) return;                        // Layer 5: fuzzy letter similarity

  setMatchedVerses([]); // no matches
  setLoading(false);
};







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
    <div className="w-full max-w-2xl mx-auto p-4">

<div className="flex flex-col items-center mb-6 text-center">
  <div className="flex items-center mb-2">
    <BookOpen className="w-7 h-7 text-[var(--primary)] mr-2" />
    <h2 className="text-2xl font-bold text-[var(--primary)] tracking-tight">
      Scripture Assistant
    </h2>
  </div>
  <span className="text-[var(--text-secondary)] text-sm max-w-md leading-relaxed">
    Speak and find the wisdom you seek. Ask for specific chapters or share your heart.
  </span>
</div>

<VoiceInput
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






<textarea
  ref={inputRef}
  value={text}
  onChange={handleChange}
  placeholder={currentUser ? "Speak or type your scripture..." : "Sign in to use"}
  disabled={!currentUser}
  rows={1}
  className="
    w-full
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


      {error && (
        <div className="p-3 bg-red-100 border-l-4 border-red-600 text-red-700 rounded-md mb-3">
          <p className="text-sm">{error}</p>
        </div>
      )}

<div className="mt-4 space-y-2">
  {loading ? (
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

  ):matchedVerses.map((v, idx) => (
<div
  key={idx}
  className="
    verse-card
    group
    relative
    rounded-xl
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
  <p
    className="
      text-[15px]
      leading-relaxed
      text-[var(--secondary)]
      font-normal
      transition-[var(--transition-default)]
      group-hover:text-[var(--white)]
    "
  >
    {v.text}
  </p>
</div>

))}



</div>

    </div>
  );
}
