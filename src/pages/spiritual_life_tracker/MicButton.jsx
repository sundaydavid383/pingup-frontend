import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2, AlertTriangle, Volume2 } from "lucide-react";
import "./micbutton.css"
export default function MicButton({ listening, isThinking, toggleListening, disabled, statusMessage, isSending, stage }) {
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const rafRef = useRef(null);

  const [volume, setVolume] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => { 
    if (!listening) {
      cancelAnimationFrame(rafRef.current);
      setVolume(0);
      return;
    }

    async function setupMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
          setVolume(Math.max(avg / 255, 0.05));
          rafRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch (err) {
        console.error("Mic permission denied", err);
        setPermissionDenied(true);
      }
    }

    setupMic();

    return () => {
      cancelAnimationFrame(rafRef.current);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, [listening]);

  const showMicOff = listening || isThinking;

  // NEW: stage-driven state buckets — this is what lets the mic
  // actually reflect what's happening (issue #2), instead of only
  // knowing "listening" vs "not listening".
  const isBusyStage = [
    "recording_finished",
    "sending_to_lemonfox",
    "pause_detected",
    "transcribing",
    "speech_received",
    "searching",
    "processing",
  ].includes(stage);

  const isErrorStage = ["error", "speech_timeout", "lemonfox_error"].includes(stage);
  const isSpeakingStage = stage === "tts";

  const getStatusClass = () => {
    // Prefer the reliable stage prop when it's available.
    if (stage) {
      if (isErrorStage) return "error";
      if (isBusyStage) return "loading";
      if (listening) return "listening";
      return "";
    }
    // Fallback (kept for backward compatibility if stage isn't passed)
    if (!statusMessage) return "";
    if (statusMessage.toLowerCase().includes("loading") || isThinking) return "loading";
    if (statusMessage.toLowerCase().includes("not")) return "error";
    if (listening) return "listening";
    return "";
  };

  const glowIntensity = Math.min(1, volume * 3.5);
  const speaking = volume > 0.15;
  const pulsateScale = 1 + volume * 0.8;

  // NEW: pick the right icon for the current stage instead of always
  // just Mic/MicOff.
  const renderIcon = () => {
    if (permissionDenied || isErrorStage) return <AlertTriangle className="w-8 h-8" />;
    if (isSpeakingStage) return <Volume2 className="w-8 h-8" />;
    if (isBusyStage) return <Loader2 className="w-8 h-8 animate-spin" />;
    if (showMicOff) return <MicOff className="w-8 h-8" />;
    return <Mic className="w-8 h-8" />;
  };

  return (
    <div className="flex flex-col gap-6 w-full items-center justify-center py-6">
      <div className="mic-shell">
        {/* Idle breathing blob — subtle life even at rest */}
        {!listening && !permissionDenied && <div className="mic-idle-blob" />}

        <div
          className={`relative flex items-center justify-center rounded-full transition-all duration-150 ease-out ${
            showMicOff ? "w-[90px] h-[90px]" : "w-[48px] h-[48px]"
          }`}
        >
          {/* OUTER RING + GLOW only when actually recording */}
          {listening && !permissionDenied && (
            <>
              <div
                className="absolute inset-0 rounded-full animate-[spin_6s_linear_infinite]"
                style={{
                  background: "conic-gradient(from 0deg, var(--primary), var(--color-5), var(--color-3), var(--primary))",
                  transform: `scale(${pulsateScale})`,
                  transition: "transform 50ms ease-out",
                  boxShadow: `
                    0 0 ${50 + volume * 120}px rgba(var(--primary-rgb),${0.8 * glowIntensity}),
                    0 0 ${100 + volume * 200}px rgba(var(--primary-rgb),${0.55 * glowIntensity}),
                    0 0 ${150 + volume * 300}px rgba(var(--primary-rgb),${0.35 * glowIntensity})
                  `,
                }}
              />
              {/* Second, counter-rotating ring — adds depth without adding noise */}
              <div
                className="absolute rounded-full animate-[spin_9s_linear_infinite_reverse]"
                style={{
                  inset: `-${6 + volume * 6}px`,
                  border: `1px solid rgba(var(--primary-rgb), ${0.25 + glowIntensity * 0.3})`,
                  opacity: speaking ? 1 : 0.5,
                  transition: "opacity 150ms ease-out",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  inset: `-${15 + volume * 20}px`,
                  background: "var(--primary)",
                  opacity: speaking ? 1 : 0.25 + glowIntensity * 0.5,
                  filter: `blur(${speaking ? 30 : 20}px)`,
                  transition: "all 50ms ease-out",
                }}
              />
            </>
          )}

          {permissionDenied && (
            <div
              className="absolute inset-0 rounded-full opacity-80 animate-pulse"
              style={{ background: 'var(--red)', boxShadow: "0 0 40px rgba(239,68,68,0.6)" }}
            />
          )}

          <button
            type="button"
            onClick={toggleListening}
            aria-pressed={showMicOff}
            disabled={disabled}
            aria-label={
              permissionDenied
                ? "Microphone permission denied"
                : isErrorStage
                ? "Voice input error — tap to try again"
                : showMicOff
                ? "Stop voice input (thinking)"
                : "Start voice input"
            }
            title={
              permissionDenied
                ? "Microphone access denied"
                : isErrorStage
                ? (statusMessage || "Something went wrong")
                : isBusyStage
                ? (statusMessage || "Working on it...")
                : showMicOff
                ? "Processing..."
                : "Start Recording"
            }
            className={`relative z-10 flex items-center justify-center rounded-full
              transition-all duration-200 active:scale-95
              backdrop-blur-[10px]
              shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]
              text-[var(--btn-text)]
              ${showMicOff 
                ? "w-[64px] h-[64px] bg-[var(--form-bg)]" 
                : "w-[54px] h-[54px] bg-[var(--btn-bg)]"}
              ${disabled ? "cursor-not-allowed opacity-60" : ""}
            `}
            style={
              permissionDenied || isErrorStage
                ? { background: 'var(--red)' }
                : undefined
            }
          >
            {renderIcon()}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`mic-status ${getStatusClass()}`}>
          {isSending && <span className="inline-block animate-spin mr-2">⏳</span>}
          {statusMessage}
        </div>
      )}
    </div>
  );
}