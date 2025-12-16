import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

export default function VoiceInput({ onTranscribe, disabled }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const leftoverRef = useRef(""); // unsent words
  const pauseTimer = useRef(null);

  // chunking config
  const MIN_CHUNK_WORDS = 10; 
  const MAX_CHUNK_WORDS = 20; 
  const PAUSE_MS = 200; 

  // Bible books array with common abbreviations
  const bibleBooks = [
    { name: "Genesis", aliases: ["gen", "ge", "gn"] },
    { name: "Exodus", aliases: ["exod", "ex", "exo"] },
    { name: "Leviticus", aliases: ["lev", "lv"] },
    { name: "Numbers", aliases: ["num", "nm", "nu"] },
    { name: "Deuteronomy", aliases: ["deut", "dt"] },
    { name: "Joshua", aliases: ["josh", "jos", "jsh"] },
    { name: "Judges", aliases: ["judg", "jdg", "jg"] },
    { name: "Ruth", aliases: ["ruth", "ru"] },
    { name: "1 Samuel", aliases: ["1 sam", "1 sm", "i sam"] },
    { name: "2 Samuel", aliases: ["2 sam", "2 sm", "ii sam"] },
    { name: "1 Kings", aliases: ["1 kgs", "1 ki", "i kings"] },
    { name: "2 Kings", aliases: ["2 kgs", "2 ki", "ii kings"] },
    { name: "1 Chronicles", aliases: ["1 chron", "1 ch", "i chron"] },
    { name: "2 Chronicles", aliases: ["2 chron", "2 ch", "ii chron"] },
    { name: "Ezra", aliases: ["ezra", "ezr"] },
    { name: "Nehemiah", aliases: ["neh", "ne"] },
    { name: "Esther", aliases: ["esth", "es"] },
    { name: "Job", aliases: ["job"] },
    { name: "Psalms", aliases: ["ps", "psalm", "psa", "pss"] },
    { name: "Proverbs", aliases: ["prov", "pr", "prv"] },
    { name: "Ecclesiastes", aliases: ["eccl", "ecc", "qe"] },
    { name: "Song of Solomon", aliases: ["song", "ss", "song of sol"] },
    { name: "Isaiah", aliases: ["isa", "is"] },
    { name: "Jeremiah", aliases: ["jer", "je", "jr"] },
    { name: "Lamentations", aliases: ["lam", "la"] },
    { name: "Ezekiel", aliases: ["ezek", "ez", "eze"] },
    { name: "Daniel", aliases: ["dan", "dn"] },
    { name: "Hosea", aliases: ["hos", "ho"] },
    { name: "Joel", aliases: ["joel", "jl"] },
    { name: "Amos", aliases: ["amos", "am"] },
    { name: "Obadiah", aliases: ["obad", "ob"] },
    { name: "Jonah", aliases: ["jonah", "jon"] },
    { name: "Micah", aliases: ["mic", "mc"] },
    { name: "Nahum", aliases: ["nah", "na"] },
    { name: "Habakkuk", aliases: ["hab", "hb"] },
    { name: "Zephaniah", aliases: ["zeph", "zp"] },
    { name: "Haggai", aliases: ["hag", "hg"] },
    { name: "Zechariah", aliases: ["zech", "zc"] },
    { name: "Malachi", aliases: ["mal", "ml"] },
    { name: "Matthew", aliases: ["matt", "mathew"] },
    { name: "Mark", aliases: ["mark", "mk", "mrk"] },
    { name: "Luke", aliases: ["luke", "lk", "luk"] },
    { name: "John", aliases: ["john", "jn", "jhn"] },
    { name: "Acts", aliases: ["acts", "ac"] },
    { name: "Romans", aliases: ["rom", "ro", "rm"] },
    { name: "1 Corinthians", aliases: ["1 cor", "i cor", "1 co"] },
    { name: "2 Corinthians", aliases: ["2 cor", "ii cor", "2 co"] },
    { name: "Galatians", aliases: ["gal", "ga"] },
    { name: "Ephesians", aliases: ["eph", "ep"] },
    { name: "Philippians", aliases: ["phil", "php", "pp"] },
    { name: "Colossians", aliases: ["col", "cl"] },
    { name: "1 Thessalonians", aliases: ["1 thess", "i thess", "1 th"] },
    { name: "2 Thessalonians", aliases: ["2 thess", "ii thess", "2 th"] },
    { name: "1 Timothy", aliases: ["1 tim", "i tim", "1 ti"] },
    { name: "2 Timothy", aliases: ["2 tim", "ii tim", "2 ti"] },
    { name: "Titus", aliases: ["titus", "ti"] },
    { name: "Philemon", aliases: ["philem", "phm"] },
    { name: "Hebrews", aliases: ["heb", "he"] },
    { name: "James", aliases: ["jas", "jm"] },
    { name: "1 Peter", aliases: ["1 pet", "i pet", "1 pe"] },
    { name: "2 Peter", aliases: ["2 pet", "ii pet", "2 pe"] },
    { name: "1 John", aliases: ["1 jn", "i jn", "1 jn"] },
    { name: "2 John", aliases: ["2 jn", "ii jn", "2 jn"] },
    { name: "3 John", aliases: ["3 jn", "iii jn", "3 jn"] },
    { name: "Jude", aliases: ["jude", "jd"] },
    { name: "Revelation", aliases: ["rev", "re", "rv"] },
  ];

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
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        interim += event.results[i][0].transcript;
      }
      interim = interim.trim();
      if (!interim) return;

      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      pauseTimer.current = setTimeout(() => {
        const leftover = leftoverRef.current.trim();
        if (leftover) {
          onTranscribe(leftover, "");
          leftoverRef.current = "";
        } else {
          onTranscribe(null, "");
        }
      }, PAUSE_MS);

      processTranscript(interim);
    };

    recognition.onerror = (event) => console.error("SpeechRecognition error:", event.error);

    recognition.onend = () => {
      if (listening) recognition.start();
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch (e) {}
      recognitionRef.current = null;
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, [onTranscribe, listening]);

  const startListening = () => {
    if (disabled || listening || !recognitionRef.current) return;
    leftoverRef.current = "";
    try { recognitionRef.current.start(); setListening(true); } catch (err) { console.error(err); }
  };

  const stopListening = () => {
    if (!listening || !recognitionRef.current) return;
    const leftover = leftoverRef.current.trim();
    if (leftover) onTranscribe(leftover, "");
    leftoverRef.current = "";
    recognitionRef.current.stop();
    setListening(false);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
  };

  const toggleListening = () => listening ? stopListening() : startListening();

  const randomHeight = (idx) => {
    const base = 6 + (idx % 3) * 3;
    return `${base + Math.floor(Math.random() * 10)}px`;
  };

  return (
    <div className="mb-4 flex items-center space-x-3">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`flex items-center justify-center w-10 h-10 rounded-full text-white transition-colors duration-200 ${listening ? "bg-red-500 hover:bg-red-600" : "bg-indigo-500 hover:bg-indigo-600"} shadow-lg`}
        title={listening ? "Stop Recording" : "Start Recording"}
        aria-pressed={listening}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
      >
        {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {listening && (
        <div className="flex items-end space-x-1 select-none" aria-hidden>
          {[...Array(5)].map((_, idx) => (
            <span key={idx} className="w-1.5 bg-red-500 rounded transition-all" style={{height: randomHeight(idx), animation: `pulse 900ms ${idx * 80}ms infinite ease-in-out`, display: "inline-block"}} />
          ))}
          <style>{`@keyframes pulse {0%{transform:scaleY(0.6);opacity:0.7}50%{transform:scaleY(1.25);opacity:1}100%{transform:scaleY(0.6);opacity:0.7}}`}</style>
          <span className="ml-2 text-gray-700 font-medium text-sm">Listening...</span>
        </div>
      )}
    </div>
  );
}
