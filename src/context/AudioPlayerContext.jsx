import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/* ---------------------------------------------
   CONTEXT SETUP
--------------------------------------------- */
const AudioPlayerContext = createContext(null);

export const useAudioPlayer = () => {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error("useAudioPlayer must be used inside AudioPlayerProvider");
  }
  return ctx;
};

/* ---------------------------------------------
   PROVIDER
--------------------------------------------- */
export const AudioPlayerProvider = ({ children }) => {
  /* ---------- CORE AUDIO ELEMENT ---------- */
  const audioRef = useRef(null);

  /* ---------- WEB AUDIO NODES ---------- */
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  /* ---------- STATE ---------- */
  const [currentUrl, setCurrentUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeInView, setActiveInView] = useState(true);
  const [progress, setProgress] = useState(0);
  //timer
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // refs for each audio card
  const audioRefs = useRef({});

  // call this to scroll to the current playing audio
  const scrollToCurrentAudio = () => {
    const el = audioRefs.current[currentUrl];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };


  /* ---------------------------------------------
     INIT AUDIO ELEMENT (ONCE)
  --------------------------------------------- */
  useEffect(() => {
    const audio = new Audio();

    // 🔑 REQUIRED for Cloudinary / remote audio analysis
    audio.crossOrigin = "anonymous";

    audio.preload = "metadata";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
      setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef]);

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };


  /* ---------------------------------------------
     INIT WEB AUDIO GRAPH (ONCE)
  --------------------------------------------- */
  const initAudioGraph = () => {
    if (audioCtxRef.current) return; // 🚫 never recreate

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    const audioCtx = new AudioContextClass();

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioCtx.createMediaElementSource(audioRef.current);

    // CONNECT GRAPH
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceRef.current = source;
  };

  /* ---------------------------------------------
     PLAY
  --------------------------------------------- */
  const play = async (url) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Ensure Web Audio exists
    initAudioGraph();

    // 🔑 Browser autoplay policy fix
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    // Change source only if different
    if (currentUrl !== url) {
      audio.src = url;
      setCurrentUrl(url);
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio play failed:", err);
    }
  };

  /* ---------------------------------------------
     PAUSE
  --------------------------------------------- */
  const pause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
  };

  /* ---------------------------------------------
     TOGGLE
  --------------------------------------------- */
  const togglePlay = (url) => {
    if (isPlaying && currentUrl === url) {
      pause();
    } else {
      play(url);
    }
  };
  const clearAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    audio.src = "";

    setIsPlaying(false);
    setCurrentUrl(null);
    setProgress(0);
    setActiveInView(true);
  };

  /* ---------------------------------------------
     SEEK
  --------------------------------------------- */
  const seek = (value) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    audio.currentTime = (value / 100) * audio.duration;
    setProgress(value);
  };

  /* ---------------------------------------------
     PROVIDER VALUE
  --------------------------------------------- */
  return (
    <AudioPlayerContext.Provider
      value={{
        // refs
        audioRef,
        analyserRef,

        // state
        currentUrl,
        isPlaying,
        progress,
        activeInView,
        setActiveInView,
        audioRefs,               // <-- add this
        scrollToCurrentAudio,

        // timer
        currentTime,
        duration,
        formatTime,

        // controls
        play,
        pause,
        togglePlay,
        seek,
        clearAudio,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};
