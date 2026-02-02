// ChapterTTS.jsx
import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { FaPlay, FaPause, FaStop } from "react-icons/fa";
import { Loader } from "lucide-react";
import CustomAlert from "./CustomAlert";

// ------------------------------
// Safe text chunker (word-boundary)
// ------------------------------
const chunkText = (text, size = 160) => {
  if (!text) return [];
  const chunks = [];
  let i = 0;

  while (i < text.length) {
    let end = i + size;
    if (end >= text.length) {
      chunks.push(text.slice(i).trim());
      break;
    }

    // walk backward to nearest punctuation
    let safeEnd = end;
    while (safeEnd > i && !/[.,!?;:]/.test(text[safeEnd])) safeEnd--;

    if (safeEnd === i) safeEnd = end; // fallback
    chunks.push(text.slice(i, safeEnd).trim());
    i = safeEnd;
  }

  return chunks.filter(Boolean);
};

const ChapterTTS = forwardRef(
  ({ text, speed = 0.7, progress, setProgress, moodVolume = 0.9, verseOffsetsRef }, ref) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoadingTTS, setIsLoadingTTS] = useState(false);
    const [alert, setAlert] = useState(null);

    const utteranceRef = useRef(null);
    const chunkIndexRef = useRef(0);
    const shouldSpeakRef = useRef(false);
    const readingSpeedRef = useRef(speed);

    // ------------------------------
    // Keep speed ref in sync
    // ------------------------------
    useEffect(() => {
      readingSpeedRef.current = speed;
    }, [speed]);

    // ------------------------------
    // Build verse units if available
    // ------------------------------
    const verseUnits = React.useMemo(() => {
      if (!verseOffsetsRef?.current?.length || !text) return [];
      return verseOffsetsRef.current.map((v, i) => {
        const safeBookId = v.book.replace(/\s+/g, "-").toLowerCase();
        const start = Math.max(0, Math.min(v.start ?? 0, text.length - 1));
        const nextStart = verseOffsetsRef.current[i + 1]?.start ?? text.length;
        const end = Math.max(start + 1, Math.min(v.end ?? nextStart, nextStart, text.length));
        return {
          id: `v-${safeBookId}-${v.chapter}-${v.verse}`,
          text: text.slice(start, end).trim() || "[empty verse]",
          start,
          end,
          chapter: v.chapter,
          verse: v.verse,
        };
      });
    }, [text, verseOffsetsRef]);

    // ------------------------------
    // Reset on text change
    // ------------------------------
    useEffect(() => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      chunkIndexRef.current = 0;
      shouldSpeakRef.current = false;
      setIsSpeaking(false);
      setIsLoadingTTS(false);
      setProgress(0);
    }, [text, setProgress]);

    // ------------------------------
    // Play a chunk (or verse if available)
    // ------------------------------
    const playChunk = (index) => {
      const chunks = verseUnits.length ? verseUnits.map(v => v.text) : chunkText(text);
      if (!chunks[index] || !shouldSpeakRef.current) return;

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = readingSpeedRef.current;
      utterance.volume = moodVolume;

      utterance.onstart = () => {
        setIsLoadingTTS(false);
        setIsSpeaking(true);

        setProgress(Math.round(((index + 1) / chunks.length) * 100));

        // highlight verse if available
        if (verseUnits[index]) {
          const el = document.getElementById(verseUnits[index].id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("verse-highlight");
            setTimeout(() => el.classList.remove("verse-highlight"), 1200);
          }
        }
      };

      utterance.onend = () => {
        if (!shouldSpeakRef.current) return;

        const nextIndex = index + 1;
        chunkIndexRef.current = nextIndex;

        if (nextIndex < chunks.length) {
          playChunk(nextIndex);
        } else {
          shouldSpeakRef.current = false;
          setIsSpeaking(false);
          setProgress(100);
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== "interrupted") console.error("❌ TTS error:", e);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // ------------------------------
    // Play / pause chapter
    // ------------------------------
    const handlePlayChapter = () => {
      if (!window.speechSynthesis) {
        setAlert({ message: "Text-to-speech not supported", type: "error" });
        return;
      }

      if (isSpeaking) {
        window.speechSynthesis.pause();
        setIsSpeaking(false);
        return;
      }

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }

      const chunks = verseUnits.length ? verseUnits.map(v => v.text) : chunkText(text);
      if (!chunks.length) return;

      shouldSpeakRef.current = true;
      setIsLoadingTTS(true);

      const startIndex = Math.floor((progress / 100) * chunks.length);
      chunkIndexRef.current = startIndex;

      playChunk(startIndex);
    };

    // ------------------------------
    // Stop speaking
    // ------------------------------
    const stopSpeaking = () => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      chunkIndexRef.current = 0;
      shouldSpeakRef.current = false;
      setIsSpeaking(false);
      setIsLoadingTTS(false);
      setProgress(0);
    };

    // ------------------------------
    // Expose API
    // ------------------------------
    useImperativeHandle(ref, () => ({
      jumpToPercent(percent) {
        const chunks = verseUnits.length ? verseUnits.map(v => v.text) : chunkText(text);
        if (!chunks.length) return;

        const index = Math.floor((percent / 100) * chunks.length);
        console.log("🎚 Progress jump → chunk:", index);

        window.speechSynthesis.cancel();
        shouldSpeakRef.current = true;
        chunkIndexRef.current = index;
        playChunk(index);
      },
      pauseForSpeedChange(newSpeed) {
        readingSpeedRef.current = newSpeed;
        if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setIsLoadingTTS(false);
        }
      },
    }));

    // ------------------------------
    // Cleanup on unload
    // ------------------------------
    useEffect(() => {
      const stop = () => window.speechSynthesis.cancel();
      window.addEventListener("beforeunload", stop);
      return () => window.removeEventListener("beforeunload", stop);
    }, []);

    // ------------------------------
    // UI
    // ------------------------------
    return (
      <div className="flex items-center gap-2 mt-2">
        {alert && (
          <CustomAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

        <button
          className="chapter-play-btn bg-blue-600 text-white p-2 rounded"
          onClick={handlePlayChapter}
          disabled={isLoadingTTS}
        >
          {isLoadingTTS ? (
            <Loader className="animate-spin w-5 h-5" />
          ) : isSpeaking ? (
            <FaPause className="w-5 h-5" />
          ) : (
            <FaPlay className="w-5 h-5" />
          )}
        </button>

        {isSpeaking && !isLoadingTTS && (
          <button
            className="chapter-restart-btn bg-red-600 text-white p-2 rounded"
            onClick={stopSpeaking}
          >
            <FaStop className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }
);

export default ChapterTTS;
