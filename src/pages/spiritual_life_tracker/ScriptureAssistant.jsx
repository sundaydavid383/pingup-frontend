// ScriptureAssistant.jsx
import React, { useState, useRef, useEffect } from "react";
import VoiceInput from "./VoiceInput";
import bible from "../../data/en_kjv.json";
import { flattenBible } from "../../utils/flattenBible";
import { BookOpen } from "lucide-react";
import Fuse from "fuse.js";


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

  // ---------- searchChunk now uses localSearch if available, otherwise falls back to server ----------
const runFuseSearch = (query) => {
  if (!query.trim() || !fuseRef.current) return;

  setLoading(true);

  const results = fuseRef.current.search(query.trim());

  const ranked = results
    .map((r) => {
      const text = r.item.text.toLowerCase();
      const book = r.item.book.toLowerCase();
      let boost = 0;

      // Exact phrase match → stronger
      if (text.includes(query.toLowerCase())) boost -= 0.15;
      if (book.includes(query.toLowerCase())) boost -= 0.1;
      boost += Math.min(text.length / 1000, 0.1);

      return {
        ...r.item,
        _score: r.score + boost,
      };
    })
    .sort((a, b) => a._score - b._score)
    .slice(0, 3); // only top 3

  setMatchedVerses(ranked);

  if (ranked.length) {
    setCurrentContext({
      currentBook: ranked[0].book,
      currentChapter: ranked[0].chapter,
      currentVerse: ranked[0].verse,
    });
  }

  setLoading(false);
};


  // ---------- processChunks (unchanged) ----------
  const processChunks = debounce(async (inputText) => {
    if (parseContextCommand(inputText)) return; // handle context commands

    const chunks = getChunksSliding(inputText);
    const newChunks = chunks.filter((c) => !processedChunks.includes(c));

    for (const chunk of newChunks) {
      await searchChunk(chunk);
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

    // 🔵 Live typing only (NO search)
    if (meta.live) {
      setText(leftover);
      return;
    }

    // 🟢 Real search trigger
    if (meta.forceSearch && sentChunk) {
      setText(sentChunk);

      if (!processedChunksRef.current.includes(sentChunk)) {
        processedChunksRef.current.push(sentChunk);
        setProcessedChunks([...processedChunksRef.current]);
        await searchChunk(sentChunk);
      }
      return;
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
  {loading && (
    <div className="space-y-2">
      {[...Array(3)].map((_, idx) => (
        <div
          key={idx}
          className="p-2 border-l-4 border-indigo-500 bg-gray-100 rounded-md animate-pulse"
        >
          <div className="h-3 bg-gray-300 rounded w-1/4 mb-1"></div> {/* book/chapter */}
          <div className="h-3 bg-gray-300 rounded w-3/4"></div> {/* verse text */}
        </div>
      ))}
    </div>
  )}

{matchedVerses.map((v, idx) => (
  <div
    key={idx}
    className="
      group
      relative
      rounded-xl
      bg-[var(--form-bg)]
      backdrop-blur-[var(--backdrop-blur)]
      px-5
      py-4
      shadow-sm
      border
      border-white/5
      transition-[var(--transition-default)]
      hover:shadow-md
      hover:border-[var(--primary)]
    "
  >
    {/* Accent bar */}
    <div
      className="
        absolute
        left-0
        top-4
        bottom-4
        w-[3px]
        rounded-full
        bg-[var(--primary)]
        opacity-70
      "
    />

    {/* Reference */}
    <p
      className="
        mb-1
        text-xs
        font-medium
        tracking-wide
        text-[var(--text-secondary)]
      "
    >
      {v.book} {v.chapter}:{v.verse}
    </p>

    {/* Verse text */}
    <p
      className="
        text-[15px]
        leading-relaxed
        text-[var(--text-main)]
        font-normal
        group-hover:text-[var(--white)]
        transition-[var(--transition-default)]
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
