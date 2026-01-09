import React, { useState, useRef, useEffect } from "react";
import VoiceInput from "./VoiceInput";
import bible from "../../data/en_kjv.json";
import { flattenBible } from "../../utils/flattenBible";
import { BookOpen, Play } from "lucide-react";
import Fuse from "fuse.js";
import "./biblereader.css";
import assets from "../../assets/assets";
import IntroModal from "./IntroModal";
import VerseCard from "../../component/shared/VerseCard";

// ---------------- Debounce helper ----------------
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// ---------------- Stop words ----------------
const STOP_WORDS = new Set([
  "the", "who", "was", "an", "is", "to", "and", "in", "he", "she", "of", "a"
]);

// ----------------- Helpers -----------------
const clean = (s) =>
  s
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (s) => {
  if (!s) return [];
  return s.split(/\s+/).filter(Boolean);
};

function buildBigrams(words) {
  const pairs = [];
  for (let i = 0; i < words.length - 1; i++) {
    pairs.push(words[i] + " " + words[i + 1]);
  }
  return pairs;
}

function letterSubsets(word) {
  if (word.length <= 3) return [word];
  return [word.slice(1), word.slice(0, -1), word.slice(1, -1)];
}

function wordSimilarity(a, b) {
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.85;
  return 0;
}

// ----------------- Scoring function -----------------
function scoreVerse(queryTokens, verse, invertedIndex, totalVerses) {
  const verseTokens = verse.tokens || tokenize(clean(verse.text));
  const tokenSet = new Set(verseTokens);

  // 1️⃣ TF-IDF
  let tfidfScore = 0;
  for (const qt of queryTokens) {
    const tf = verseTokens.filter(t => t === qt).length / verseTokens.length;
    const df = invertedIndex.get(qt)?.size || 0;
    const idf = Math.log((totalVerses + 1) / (1 + df));
    tfidfScore += tf * idf;
  }

  // 2️⃣ Positional proximity
  let positions = [];
  queryTokens.forEach(qt => {
    verseTokens.forEach((vt, idx) => {
      if (vt === qt) positions.push(idx);
    });
  });
  let proximityScore = 0;
  if (positions.length >= queryTokens.length) {
    positions.sort((a, b) => a - b);
    let distances = [];
    for (let i = 1; i < positions.length; i++) distances.push(positions[i] - positions[i - 1]);
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    proximityScore = 1 / (1 + avgDistance);
  }

  // 3️⃣ Phrase boosting
  const bigrams = buildBigrams(queryTokens);
  let phraseBoost = 0;
  bigrams.forEach(bg => {
    if (verse.text.toLowerCase().includes(bg)) phraseBoost += 0.1;
  });

  // 4️⃣ Speech-tolerance
  let speechScore = 0;
  queryTokens.forEach(qt => {
    let bestSim = 0;
    verseTokens.forEach(vt => {
      bestSim = Math.max(bestSim, wordSimilarity(qt, vt));
    });
    speechScore += bestSim;
  });
  speechScore = speechScore / queryTokens.length;

  // 5️⃣ Combine
  const wTFIDF = 0.4, wProx = 0.2, wPhrase = 0.2, wSpeech = 0.2;
  const finalScore = wTFIDF * tfidfScore
                   + wProx * proximityScore
                   + wPhrase * phraseBoost
                   + wSpeech * speechScore;

  return finalScore;
}

// ----------------- ScriptureAssistant -----------------
export default function ScriptureAssistant({ currentUser }) {
  const inputRef = useRef(null);
  const voiceInputRef = useRef(null);
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

  const versesRef = useRef([]);
  const verseByIdRef = useRef(new Map());
  const invertedIndexRef = useRef(new Map());
  const bookChapterMapRef = useRef(new Map());
  const localIndexReady = useRef(false);

  const bibleBooks = assets.bibleBooks2;

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

    const seenIntro = localStorage.getItem("SpringsConnectSeenIntro");
    if (!seenIntro) setShowIntro(true);
  }, []);

  // ----------------- Text-to-Speech -----------------
  const toggleSpeakVerse = (verse) => {
    if (!verse || !window.speechSynthesis) return;

    if (ttsPlaying) {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
      return;
    }

    if (voiceInputRef.current?.stop) voiceInputRef.current.stop();

    const utterance = new SpeechSynthesisUtterance(verse.text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setTtsPlaying(true);
    utterance.onend = () => {
      setTtsPlaying(false);
      voiceInputRef.current?.start?.();
    };

    ttsUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

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

  // ----------------- Run local search -----------------
  const runLocalSearch = async (query) => {
    if (!query.trim() || !localIndexReady.current) return;
    setLoading(true);
    voiceInputRef.current?.stop();

    const cleaned = clean(query);
    const tokens = tokenize(cleaned).filter(t => !STOP_WORDS.has(t));
    let tokenSets = tokens.map(t => invertedIndexRef.current.get(t)).filter(Boolean);
    if (!tokenSets.length) tokenSets = tokens.map(() => new Set(verseByIdRef.current.keys()));

    // Score all candidates
    const candidateIds = new Set(tokenSets.flatMap(s => [...s]));
    const scored = [...candidateIds].map(id => {
      const v = verseByIdRef.current.get(id);
      return { ...v, _score: scoreVerse(tokens, v, invertedIndexRef.current, versesRef.current.length) };
    });
    scored.sort((a, b) => b._score - a._score);
    const top3 = scored.slice(0, 3);

    if (top3.length) {
      const verse = top3[0];
      setMatchedVerses(top3);
      setCurrentContext({ currentBook: verse.book, currentChapter: verse.chapter, currentVerse: verse.verse });

      const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
      if (lastSpokenVerseRef.current !== verseKey) {
        lastSpokenVerseRef.current = verseKey;
        toggleSpeakVerse(verse);
      }
    } else setMatchedVerses([]);

    setLoading(false);
    voiceInputRef.current?.start?.();
  };

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

  const processChunks = debounce(async (inputText) => {
    if (!inputText.trim()) return;
    const chunks = getChunksSliding(inputText).filter(c => !processedChunksRef.current.includes(c));
    for (const chunk of chunks) {
      await runLocalSearch(chunk);
      processedChunksRef.current.push(chunk);
    }
    setProcessedChunks([...processedChunksRef.current]);
  }, 250);

  const handleChange = (e) => {
    setText(e.target.value);
    autoGrowTextarea();
    processChunks(e.target.value);
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
        onTranscribe={async (sentChunk, leftover, meta = {}) => {
          if (!sentChunk) return;
          setText(sentChunk);
          if (!processedChunksRef.current.includes(sentChunk)) {
            processedChunksRef.current.push(sentChunk);
            setProcessedChunks([...processedChunksRef.current]);
            await runLocalSearch(sentChunk);
          }
        }}
      />

      <div className="flex flex-col items-center w-full gap-5 mt-4">
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleChange}
          placeholder={currentUser ? "Speak or type your scripture..." : "Sign in to use"}
          disabled={!currentUser}
          rows={1}
          className="w-full max-w-[600px] rounded border p-4 text-sm resize-none overflow-hidden"
        />

        <div className="space-y-4 w-full flex flex-col justify-center items-center">
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
