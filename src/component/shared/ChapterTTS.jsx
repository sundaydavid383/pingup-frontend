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

const ChapterTTS = forwardRef(
  ({ text, speed = 0.7, progress, setProgress, moodVolume = 0.9, verseOffsetsRef }, ref) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoadingTTS, setIsLoadingTTS] = useState(false);
    const [alert, setAlert] = useState(null);

    const utteranceRef = useRef(null);
    const shouldSpeakRef = useRef(false);
    const readingSpeedRef = useRef(speed);

/* ------------------------------
   Build verse units safely
------------------------------ */
const verseUnits = React.useMemo(() => {
  if (!verseOffsetsRef?.current?.length || !text) return [];

  const offsets = verseOffsetsRef.current;
  const units = offsets.map((v, i) => {
    const safeBookId = v.book.replace(/\s+/g, "-").toLowerCase();

    // Start is always within text bounds
    const start = Math.max(0, Math.min(v.start ?? 0, text.length - 1));

    // End is either the given end, or next verse's start, or end of text
    const nextStart = offsets[i + 1]?.start ?? text.length;
    const rawEnd = v.end ?? nextStart;
    const end = Math.max(start + 1, Math.min(rawEnd, nextStart, text.length));

    const verseText = text.slice(start, end).trim();

    return {
      id: `v-${safeBookId}-${v.chapter}-${v.verse}`,
      text: verseText || "[empty verse]",
      start,
      end,
      verse: v.verse,
      chapter: v.chapter,
    };
  });

  console.log("Verse units built safely:", units);
  return units;
}, [text, verseOffsetsRef]);


    // ------------------------------
    // Keep speed ref in sync
    // ------------------------------
    useEffect(() => {
      readingSpeedRef.current = speed;
    }, [speed]);

    // ------------------------------
    // Reset on text change
    // ------------------------------
    useEffect(() => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      shouldSpeakRef.current = false;
      setIsSpeaking(false);
      setIsLoadingTTS(false);
      setProgress(0);
    }, [text, setProgress]);

    // ------------------------------
    // Play a verse
    // ------------------------------
    const playVerse = (index) => {
      if (!verseUnits[index] || !shouldSpeakRef.current) return;

      const verse = verseUnits[index];
      console.log(`Playing verse ${verse.verse}: "${verse.text}" [${verse.start}, ${verse.end}]`);

      const utterance = new SpeechSynthesisUtterance(verse.text || " ");
      utterance.rate = readingSpeedRef.current;
      utterance.volume = moodVolume;

      utterance.onstart = () => {
        setIsLoadingTTS(false);
        setIsSpeaking(true);

        const percent = Math.round(((index + 1) / verseUnits.length) * 100);
        setProgress(percent);

        const el = document.getElementById(verse.id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("verse-highlight");
        }
      };

      utterance.onend = () => {
        const el = document.getElementById(verse.id);
        if (el) el.classList.remove("verse-highlight");

        if (!shouldSpeakRef.current) return;

        const nextIndex = index + 1;
        if (nextIndex < verseUnits.length) {
          playVerse(nextIndex);
        } else {
          shouldSpeakRef.current = false;
          setIsSpeaking(false);
          setProgress(100);
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== "interrupted") {
          console.error("❌ Verse TTS error:", e);
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // ------------------------------
    // Play / Pause
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

      if (!verseUnits.length) return;

      shouldSpeakRef.current = true;
      setIsLoadingTTS(true);

      const startIndex = Math.min(
        verseUnits.length - 1,
        Math.floor((progress / 100) * verseUnits.length)
      );

      window.speechSynthesis.cancel();
      playVerse(startIndex);
    };

    // ------------------------------
    // Stop speaking
    // ------------------------------
    const stopSpeaking = () => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      shouldSpeakRef.current = false;
      setIsSpeaking(false);
      setIsLoadingTTS(false);
      setProgress(0);
    };

    // ------------------------------
    // Exposed API
    // ------------------------------
    useImperativeHandle(ref, () => ({
      jumpToPercent(percent) {
        if (!verseUnits.length) return;

        const index = Math.min(
          verseUnits.length - 1,
          Math.floor((percent / 100) * verseUnits.length)
        );

        console.log("🎚 Jump to verse:", index);
        window.speechSynthesis.cancel();
        shouldSpeakRef.current = true;
        playVerse(index);
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
    // Cleanup
    // ------------------------------
    useEffect(() => {
      const stop = () => window.speechSynthesis.cancel();
      window.addEventListener("beforeunload", stop);
      return () => {
        window.removeEventListener("beforeunload", stop);
        stop();
      };
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
