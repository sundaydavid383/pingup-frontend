import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, MessageCircle } from "lucide-react";
import { CallContext } from "../../context/CallContext";

const AudioCallUI = ({
  localStream,
  remoteStream,
  onEndCall,
  onMuteToggle,
  onSpeakerToggle,
  isMuted = false,
  isSpeakerOn = true,
}) => {
  const callContext = useContext(CallContext);
  const remoteAudioRef = useRef(null);
  const [callTimer, setCallTimer] = useState("00:00");
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const timerIntervalRef   = useRef(null);
  const timerStartedRef    = useRef(false);
  const callStartTimeRef   = useRef(null);

  const call              = callContext?.currentCall ?? null;
  const callStatusMessage = callContext?.callStatusMessage;

  // ─── Attach remote stream to audio element ───────────────────────────────────
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl || !remoteStream) return;

    console.log("📞 AudioCallUI: Attaching remote stream to audio element");
    audioEl.srcObject = remoteStream;
    audioEl.volume = 1.0;
    audioEl.jitterBufferTarget = 80; // ✅ restored: reduces audio jitter/latency

    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("📞 AudioCallUI: Audio playing");
          setAutoplayBlocked(false);
        })
        .catch((err) => {
          if (err.name === "NotAllowedError" || err.name === "AbortError") {
            console.warn("📞 AudioCallUI: Autoplay blocked by browser —", err.name);
            setAutoplayBlocked(true);
          } else {
            console.error("📞 AudioCallUI: Audio play error:", err);
          }
        });
    }
  }, [remoteStream]);

  // ─── Speaker toggle via setSinkId (Chrome + Android; not iOS) ───────────────
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl) return;

    if (typeof audioEl.setSinkId !== "function") {
      console.log("📞 AudioCallUI: setSinkId not supported on this browser");
      return;
    }

    const sinkId = isSpeakerOn ? "default" : "";
    audioEl.setSinkId(sinkId).then(() => {
      console.log("📞 AudioCallUI: Audio output routed to:", isSpeakerOn ? "speaker" : "earpiece");
    }).catch((err) => {
      console.warn("📞 AudioCallUI: setSinkId error:", err.message);
    });
  }, [isSpeakerOn]);

  // ─── Call timer + CONNECTING status message ───────────────────────────────────
  useEffect(() => {
    const status    = call?.status;
    const CONNECTED  = callContext?.CALL_STATES?.CONNECTED;
    const CONNECTING = callContext?.CALL_STATES?.CONNECTING;

    if (status === CONNECTED && !timerStartedRef.current) {
      console.log("📞 AudioCallUI: Call connected — starting timer");
      timerStartedRef.current  = true;
      callStartTimeRef.current = Date.now();

      if (!callStatusMessage) {
        callContext.setCallStatusMessage("✅ Connected");
      }

      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        setCallTimer(
          h > 0
            ? `${pad(h)}:${pad(m)}:${pad(s)}`
            : `${pad(m)}:${pad(s)}`
        );
      }, 1000);

    } else if (status === CONNECTING) {
      // ✅ restored: set connecting status message
      console.log("📞 AudioCallUI: Call is connecting");
      if (!callStatusMessage) {
        callContext.setCallStatusMessage("🔗 Connecting to " + call.receiverName + "...");
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [call?.status]);

  // ─── Tap-to-play for iOS autoplay workaround ─────────────────────────────────
  const handleTapToPlay = useCallback(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl) return;
    audioEl.play()
      .then(() => {
        console.log("📞 AudioCallUI: Audio playing after user gesture");
        setAutoplayBlocked(false);
      })
      .catch((err) => console.error("📞 AudioCallUI: Tap-to-play error:", err));
  }, []);

  if (!call) return null;

  const isConnected = call.status === callContext?.CALL_STATES?.CONNECTED || !!remoteStream;

  const statusLabel =
    callStatusMessage ||
    (call.status === callContext?.CALL_STATES?.CONNECTED ? "Connected"
    : call.status === callContext?.CALL_STATES?.RINGING  ? "Ringing..."
    : call.error ? `Call failed — ${call.error}`
    : remoteStream ? "Connected"
    : "Connecting...");

  return (
    <>
      <style>{`
        @keyframes acu-expand-ring {
          0%   { transform: scale(0.88); opacity: 0.75; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        @keyframes acu-wave {
          0%, 100% { transform: scaleY(0.35); opacity: 0.3; }
          50%       { transform: scaleY(1);    opacity: 1; }
        }
        @keyframes acu-dot-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        .acu-pulse-ring { animation: acu-expand-ring 2.8s ease-out infinite; }
        .acu-pulse-ring:nth-child(2) { animation-delay: 0.93s; }
        .acu-pulse-ring:nth-child(3) { animation-delay: 1.86s; }
        .acu-wave-bar { animation: acu-wave 1.1s ease-in-out infinite; }
        .acu-wave-bar:nth-child(1) { height: 8px;  animation-delay: 0s; }
        .acu-wave-bar:nth-child(2) { height: 16px; animation-delay: 0.15s; }
        .acu-wave-bar:nth-child(3) { height: 22px; animation-delay: 0.3s; }
        .acu-wave-bar:nth-child(4) { height: 13px; animation-delay: 0.45s; }
        .acu-wave-bar:nth-child(5) { height: 20px; animation-delay: 0.6s; }
        .acu-wave-bar:nth-child(6) { height: 11px; animation-delay: 0.75s; }
        .acu-wave-bar:nth-child(7) { height: 17px; animation-delay: 0.9s; }
        .acu-status-dot { animation: acu-dot-blink 1.4s ease-in-out infinite; }
        .acu-ctrl-icon:hover { background: rgba(255,255,255,0.11) !important; }
        .acu-ctrl-icon-active:hover { background: rgba(var(--primary-rgb, 59,92,203), 0.26) !important; }
        .acu-end-btn:hover {
          transform: scale(1.07) !important;
          box-shadow: 0 14px 34px rgba(239,68,68,0.5) !important;
        }
      `}</style>

      {/* Hidden audio element — playsInline critical for iOS */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        muted={false}
        style={{ display: "none" }}
      />

      {/* iOS autoplay fallback banner */}
      {autoplayBlocked && (
        <div
          onClick={handleTapToPlay}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0,
            zIndex: 9999,
            background: "rgba(239,68,68,0.92)",
            color: "#fff",
            textAlign: "center",
            padding: "12px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Tap here to hear the call
        </div>
      )}

      {/* Full-screen container */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #050c20 0%, #070e1c 45%, #040810 100%)",
          overflow: "hidden",
        }}
      >
        {/* Top radial glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 560,
            height: 320,
            background: "radial-gradient(ellipse, rgba(var(--primary-rgb, 59,92,203), 0.1) 0%, transparent 68%)",
            pointerEvents: "none",
          }}
        />
        {/* Bottom glow */}
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 400,
            height: 160,
            background: "radial-gradient(ellipse, rgba(var(--primary-rgb, 59,92,203), 0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: 360,
            padding: "0 20px",
          }}
        >
          {/* Avatar with pulse rings */}
          <div
            style={{
              position: "relative",
              width: 104,
              height: 104,
              marginBottom: 22,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="acu-pulse-ring"
                style={{
                  position: "absolute",
                  inset: -18,
                  borderRadius: "50%",
                  border: "1px solid rgba(var(--primary-rgb, 59,92,203), 0.2)",
                }}
              />
            ))}

            {call.receiverImage ? (
              <img
                src={call.receiverImage}
                alt={call.receiverName}
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: 104,
                  height: 104,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1.5px solid rgba(var(--primary-rgb, 59,92,203), 0.4)",
                  boxShadow: "0 0 0 5px rgba(var(--primary-rgb, 59,92,203), 0.07)",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: 104,
                  height: 104,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--secondary, #1a294a) 0%, #0d1a35 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  fontWeight: 600,
                  color: "rgba(var(--primary-rgb, 59,92,203), 0.85)",
                  border: "1.5px solid rgba(var(--primary-rgb, 59,92,203), 0.35)",
                  boxShadow: "0 0 0 5px rgba(var(--primary-rgb, 59,92,203), 0.07)",
                  letterSpacing: -1,
                }}
              >
                {call.receiverName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "??"}
              </div>
            )}
          </div>

          {/* Status pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              padding: "4px 13px",
              borderRadius: 20,
              marginBottom: 14,
              letterSpacing: "0.02em",
              background: isConnected
                ? "rgba(34,197,94,0.1)"
                : "rgba(var(--primary-rgb, 59,92,203), 0.1)",
              border: isConnected
                ? "0.5px solid rgba(34,197,94,0.28)"
                : "0.5px solid rgba(var(--primary-rgb, 59,92,203), 0.28)",
              color: isConnected
                ? "#86efac"
                : "rgba(var(--primary-rgb, 59,92,203), 0.95)",
            }}
          >
            <div
              className="acu-status-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isConnected ? "#22c55e" : "rgba(var(--primary-rgb, 59,92,203), 0.9)",
              }}
            />
            {statusLabel}
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: "var(--white, #ffffff)",
              letterSpacing: "-0.4px", // ✅ restored
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            {call.receiverName}
          </div>

          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted, #64748b)",
              marginBottom: 24,
            }}
          >
            Audio call
          </div>

          {/* Timer */}
          <div
            style={{
              fontSize: 46,
              fontWeight: 300,
              color: "var(--white, #ffffff)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: 3,
              marginBottom: 28,
              textShadow: "0 0 48px rgba(var(--primary-rgb, 59,92,203), 0.28)",
            }}
          >
            {callTimer}
          </div>

          {/* Wave bars — only when connected */}
          {remoteStream && (
            <div
              style={{
                display: "flex",
                gap: 3,
                alignItems: "center",
                height: 28,
                marginBottom: 32,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="acu-wave-bar"
                  style={{
                    width: 3,
                    background: "rgba(var(--primary-rgb, 59,92,203), 0.65)",
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
          )}

          {/* Connecting indicator */}
          {!remoteStream && (
            <div
              style={{
                display: "flex",
                gap: 4,
                alignItems: "center",
                marginBottom: 32,
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    background: "rgba(var(--primary-rgb, 59,92,203), 0.6)",
                    borderRadius: 3,
                    animation: `acu-wave 1.2s ease-in-out infinite ${i * 0.2}s`,
                    height: 20,
                  }}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 16,
              justifyContent: "center",
            }}
          >
            {/* Message */}
            <CtrlButton
              label="Message"
              active={false}
              onClick={() => {}}
              title="Send Message"
            >
              <MessageCircle size={20} strokeWidth={1.8} />
            </CtrlButton>

            {/* Mute */}
            <CtrlButton
              label={isMuted ? "Muted" : "Mute"}
              active={isMuted}
              onClick={() => {
                console.log("📞 AudioCallUI: Mute toggle clicked", { currentlyMuted: isMuted });
                onMuteToggle && onMuteToggle(!isMuted);
              }}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff size={20} strokeWidth={1.8} />
              ) : (
                <Mic size={20} strokeWidth={1.8} />
              )}
            </CtrlButton>

            {/* Speaker */}
            <CtrlButton
              label={isSpeakerOn ? "Speaker" : "Earpiece"}
              active={!isSpeakerOn}
              onClick={() => {
                console.log("📞 AudioCallUI: Speaker toggle clicked", { currentlySpeakerOn: isSpeakerOn });
                onSpeakerToggle && onSpeakerToggle(!isSpeakerOn);
              }}
              title={isSpeakerOn ? "Switch to earpiece" : "Switch to speaker"}
            >
              {isSpeakerOn ? (
                <Volume2 size={20} strokeWidth={1.8} />
              ) : (
                <VolumeX size={20} strokeWidth={1.8} />
              )}
            </CtrlButton>

            {/* End call */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <button
                onClick={() => {
                  console.log("📞 AudioCallUI: End call button clicked");
                  onEndCall();
                }}
                className="acu-end-btn"
                title="End Call"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--red, #ef4444)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 26px rgba(239,68,68,0.38)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  padding: 0,
                }}
              >
                <PhoneOff size={24} color="white" strokeWidth={2} />
              </button>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted, #64748b)",
                  letterSpacing: "0.03em",
                }}
              >
                End
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/** Reusable control button */
const CtrlButton = ({ label, active, onClick, title, children }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
    }}
  >
    <button
      onClick={onClick}
      title={title}
      className={active ? "acu-ctrl-icon-active" : "acu-ctrl-icon"}
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: active
          ? "0.5px solid rgba(var(--primary-rgb, 59,92,203), 0.42)"
          : "0.5px solid rgba(255,255,255,0.1)",
        background: active
          ? "rgba(var(--primary-rgb, 59,92,203), 0.18)"
          : "rgba(255,255,255,0.06)",
        cursor: "pointer",
        color: active
          ? "rgba(var(--primary-rgb, 59,92,203), 0.9)"
          : "var(--white, #ffffff)",
        transition: "background 0.15s, border-color 0.15s",
        padding: 0,
      }}
    >
      {children}
    </button>
    <span
      style={{
        fontSize: 11,
        color: "var(--text-muted, #64748b)",
        letterSpacing: "0.03em",
      }}
    >
      {label}
    </span>
  </div>
);

function pad(n) { return String(n).padStart(2, "0"); }

export default AudioCallUI;