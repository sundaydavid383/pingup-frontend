// ScriptureAssistant.jsx
import React, { useState, useRef, useEffect } from "react";
import VoiceInput from "./VoiceInput";
import bible from "../../data/en_kjv.json";
import { flattenBible } from "../../utils/flattenBible";


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
  const searchChunk = async (chunk) => {
    if (!chunk || chunk.length < 3) return; // ignore very short chunks

    // check cache
    const cleanedChunk = clean(chunk);
    if (chunkCache.current[cleanedChunk]) {
      const verse = chunkCache.current[cleanedChunk];
      if (verse) {
        setMatchedVerses((prev) => [...prev, verse]);
        setCurrentContext({
          currentBook: verse.book,
          currentChapter: verse.chapter,
          currentVerse: verse.verse
        });
      }
      return;
    }

    // try local search
    const localResult = localSearch(chunk);
    if (localResult) {
      chunkCache.current[clean(chunk)] = localResult;
      setMatchedVerses((prev) => [...prev, localResult]);
      setCurrentContext({
        currentBook: localResult.book,
        currentChapter: localResult.chapter,
        currentVerse: localResult.verse
      });
      return;
    }

    // fallback: call backend search endpoint (keeps compatibility)
    return
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

  // ---------- render ----------
  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <VoiceInput
        onTranscribe={async (sentChunk, leftover) => {
          // leftover always shows pending unsent words
          setText(leftover || "");

          if (sentChunk) {
            // allow context commands to override (chapter/verse navigation)
            if (parseContextCommand(sentChunk)) return;

            // prevent duplicate chunk processing
            if (!processedChunksRef.current.includes(sentChunk)) {
              processedChunksRef.current.push(sentChunk);
              setProcessedChunks([...processedChunksRef.current]);

              // live search (uses local index when available)
              await searchChunk(sentChunk);
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
        className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 overflow-hidden"
      />

      {error && (
        <div className="p-3 bg-red-100 border-l-4 border-red-600 text-red-700 rounded-md mb-3">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {loading && (
          <div className="mt-4 space-y-2">
            {[...Array(2)].map((_, idx) => (
              <div
                key={idx}
                className="p-2 border-l-4 border-indigo-500 bg-gray-100 rounded-md animate-pulse"
              >
                <div className="h-3 bg-gray-300 rounded w-1/4 mb-1"></div> {/* book/chapter */}
                <div className="h-3 bg-gray-300 rounded w-3/4"></div> {/* text */}
              </div>
            ))}
          </div>
        )}

        {matchedVerses.map((v, idx) => (
          <div key={idx} className="p-2 border-l-4 border-indigo-500 bg-gray-50 rounded-md">
            <p className="text-xs font-semibold">{v.book} {v.chapter}:{v.verse}</p>
            <p className="text-sm">{v.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
