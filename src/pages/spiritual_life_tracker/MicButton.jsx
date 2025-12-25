import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import "./micbutton.css"

export default function MicButton({ listening, toggleListening, disabled, statusMessage }) {
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
        analyser.fftSize = 256; // smaller fft for faster responsiveness
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

  const getStatusClass = () => {
  if (!statusMessage) return "";
  if (statusMessage.toLowerCase().includes("loading")) return "loading";
  if (statusMessage.toLowerCase().includes("not")) return "error";
  if (listening) return "listening";
  return "";
};


  const glowIntensity = Math.min(1, volume * 3.5);
  const speaking = volume > 0.15;

  // Calculate dynamic pulsating scale for outer ring
  const pulsateScale = 1 + volume * 0.8; // 1 → 1.8

  return (
    <div className="flex flex-col gap-6 w-full items-center justify-center py-6">
      <div
        className={`relative flex items-center justify-center rounded-full transition-all duration-150 ease-out ${
          listening ? "w-[90px] h-[90px]" : "w-[48px] h-[48px]"
        }`}
      >
        {/* ===== OUTER RING (PULSATING) ===== */}
        {listening && !permissionDenied && (
          <div
            className="absolute inset-0 rounded-full animate-[spin_6s_linear_infinite]"
            style={{
              background:
                "conic-gradient(from 0deg, var(--primary), var(--color-5), var(--color-3), var(--primary))",
              transform: `scale(${pulsateScale})`,
              transition: "transform 50ms ease-out", // very quick transition to match voice
              boxShadow: `
                0 0 ${50 + volume * 120}px rgba(30,64,175,${0.8 * glowIntensity}),
                0 0 ${100 + volume * 200}px rgba(99,102,241,${0.6 * glowIntensity}),
                0 0 ${150 + volume * 300}px rgba(99,102,241,${0.4 * glowIntensity})
              `,
            }}
          />
        )}

        {/* ===== PERMISSION DENIED RING ===== */}
        {permissionDenied && (
          <div
            className="absolute inset-0 rounded-full bg-red-600 opacity-80 animate-pulse"
            style={{ boxShadow: "0 0 40px rgba(239,68,68,0.6)" }}
          />
        )}

        {/* ===== AMBIENT GLOW ===== */}
        {listening && !permissionDenied && (
          <div
            className="absolute rounded-full "
            style={{
              inset: `-${15 + volume * 20}px`,
              background: "var(--primary)",
              opacity: speaking ? 1 : 0.25 + glowIntensity * 0.5,
              filter: `blur(${speaking ? 30 : 20}px)`,
              transition: "all 50ms ease-out", // match outer pulsation
            }}
          />
        )}

        {/* ===== INNER BUTTON ===== */}
        <button
          type="button"
          onClick={toggleListening}
          aria-pressed={listening}
          disabled={disabled || false}
          aria-label={
            permissionDenied
              ? "Microphone permission denied"
              : listening
              ? "Stop voice input"
              : "Start voice input"
          }
          title={
            permissionDenied
              ? "Microphone access denied"
              : listening
              ? "Stop Recording"
              : "Start Recording"
          }
          className={`relative z-10 flex items-center justify-center rounded-full
            transition-all duration-200 active:scale-95
            backdrop-blur-[10px]
            shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]
            text-[var(--btn-text)]
            ${listening ? "w-[64px] h-[64px] bg-[var(--form-bg)]" : "w-[54px] h-[54px] bg-[var(--btn-bg)]"}
            ${disabled ? "bg-red-600 cursor-not-allowed opacity-60" : ""}
          `}
        >
           {listening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>
          {statusMessage && <div className={`mic-status ${getStatusClass()}`}>
             {statusMessage}
           </div>
}

    
    </div>
  );
}
