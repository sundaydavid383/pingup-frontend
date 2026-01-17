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

/* ------------------------------
   Safe text chunker (core fix)
------------------------------ */
const chunkText = (text, size = 160) => {
  if (!text) return [];
  const chunks = [];
  let i = 0;

  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }

  return chunks.filter(Boolean);
};

const ChapterTTS = forwardRef(
  ({ text, speed = 0.7, progress, setProgress, moodVolume = 0.3 }, ref) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoadingTTS, setIsLoadingTTS] = useState(false);
    const [alert, setAlert] = useState(null);

    const utteranceRef = useRef(null);
    const chunkIndexRef = useRef(0);
    const shouldSpeakRef = useRef(false);
    const fromSliderRef = useRef(false);
    const readingSpeedRef = useRef(speed);

    const chunks = chunkText(text);

    /* ------------------------------
       Keep speed ref in sync
    ------------------------------ */
    useEffect(() => {
      readingSpeedRef.current = speed;
    }, [speed]);

    /* ------------------------------
       Reset on text change
    ------------------------------ */
    useEffect(() => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      chunkIndexRef.current = 0;
      shouldSpeakRef.current = false;
      setIsSpeaking(false);
      setIsLoadingTTS(false);
      setProgress(0);
    }, [text, setProgress]);

    /* ------------------------------
       Play / Pause
    ------------------------------ */
    const handlePlayChapter = () => {
      if (!window.speechSynthesis) {
        setAlert({ message: "Text-to-speech not supported", type: "error" });
        return;
      }

      // Pause
      if (isSpeaking) {
        window.speechSynthesis.pause();
        setIsSpeaking(false);
        return;
      }

      // Restart from paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }

      if (!chunks.length) return;

      shouldSpeakRef.current = true;
      setIsLoadingTTS(true);

      const startIndex = Math.floor((progress / 100) * chunks.length);
      chunkIndexRef.current = startIndex;

      playChunk(startIndex);
    };

    /* ------------------------------
       Play chunk
    ------------------------------ */
    const playChunk = (index) => {
      if (!chunks[index] || !shouldSpeakRef.current) return;

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = readingSpeedRef.current;
      utterance.volume = moodVolume;

      utterance.onstart = () => {
        setIsLoadingTTS(false);
        setIsSpeaking(true);

        const percent = Math.round((index / chunks.length) * 100);
        setProgress(percent);
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
        // "interrupted" is expected during seek / speed change
        if (e.error !== "interrupted") {
          console.error("❌ TTS error:", e);
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    /* ------------------------------
       Stop
    ------------------------------ */
    const stopSpeaking = () => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      shouldSpeakRef.current = false;
      chunkIndexRef.current = 0;
      setIsSpeaking(false);
      setIsLoadingTTS(false);
      setProgress(0);
    };

    /* ------------------------------
       Exposed API
    ------------------------------ */
    useImperativeHandle(ref, () => ({
      jumpToPercent(percent) {
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

    /* ------------------------------
       Cleanup
    ------------------------------ */
    useEffect(() => {
      const stop = () => window.speechSynthesis.cancel();
      window.addEventListener("beforeunload", stop);
      return () => {
        window.removeEventListener("beforeunload", stop);
        stop();
      };
    }, []);

    /* ------------------------------
       UI
    ------------------------------ */
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
