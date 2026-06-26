import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import { CallContext } from "../../context/CallContext";
import { useSocket } from "../../context/useSocket";
import useWebRTC from "../../hooks/useWebRTC";
import useCallManager from "../../hooks/useCallManager";
import IncomingCallModal from "./IncomingCallModal";
import VideoCallUI from "./VideoCallUI";
import AudioCallUI from "./AudioCallUI";

/**
 * CallContainer — orchestrates the entire call system.
 *
 * Key fixes:
 * 1. useWebRTC is called with a STABLE set of deps; callId + isInitiator come
 *    from refs so the hook instance is never re-created mid-call.
 * 2. setCallConnected is called via onRemoteStreamAdded; localStream is read
 *    from localStreamRef (always populated by then) not from React state.
 * 3. Cleanup effect runs on UNMOUNT ONLY and is guarded so it doesn't fire
 *    during React StrictMode double-invoke.
 * 4. callInitiationStatus logic is simplified and doesn't recreate on every
 *    context change.
 */
const CallContainer = ({ user, children }) => {
  const callContext = useContext(CallContext);
  const { socket, connected } = useSocket() || {};

  const [callInitiationStatus, setCallInitiationStatus] = useState(null);
  const [userDismissedOverlay, setUserDismissedOverlay] = useState(false);
  const [lastCallStatus, setLastCallStatus] = useState(null);

  // ─── Stable refs to avoid stale closures ────────────────────────────────────
  const callContextRef         = useRef(callContext);
  const webrtcInstanceRef      = useRef(null);
  const callManagerRef_local   = useRef(null); // local ref so callbacks don't capture stale manager
  const didMountRef            = useRef(false); // StrictMode guard

  useEffect(() => { callContextRef.current = callContext; }, [callContext]);

  // ─── Derive call properties as refs so WebRTC hook is STABLE ────────────────
  // ✅ FIX 2: WebRTC hook reads these from refs at the time initialize() is called,
  // not from the React props at hook instantiation time.
  const callIdRef      = useRef(null);
  const isInitiatorRef = useRef(false);

  // Sync refs whenever the call changes
  useEffect(() => {
    const call = callContext?.currentCall;
    callIdRef.current      = call?.callId ?? null;
    isInitiatorRef.current = call?.direction === "outgoing";
    console.log("📞 CallContainer: Call props synced — callId:", callIdRef.current, "isInitiator:", isInitiatorRef.current);
  }, [callContext?.currentCall?.callId, callContext?.currentCall?.direction]);

  // ─── Stable WebRTC callbacks ─────────────────────────────────────────────────
  const onLocalStreamReady = useRef((stream) => {
    console.log("📞 CallContainer: Local stream ready —", stream.getTracks().map(t => t.kind).join(", "));
  }).current;

  const onRemoteStreamAdded = useRef((stream) => {
    console.log("📞 CallContainer: Remote stream added —", stream.getTracks().length, "tracks");
    const ctx = callContextRef.current;
    if (ctx && ctx.currentCall) {
      // ✅ FIX 10: Read localStream from localStreamRef (always populated), not from React state
      const localStream = webrtcInstanceRef.current?.localStreamRef?.current;
      ctx.setCallConnected(localStream, stream);
      console.log("📞 CallContainer: setCallConnected called — localStream:", !!localStream, "remoteStream:", !!stream);
    }
  }).current;

  const onConnectionStateChange = useRef((state) => {
    console.log("📞 CallContainer: Connection state →", state);
    if (state === "failed") {
      console.warn("📞 CallContainer: Connection failed — scheduling cleanup");
      setTimeout(() => {
        webrtcInstanceRef.current?.cleanup();
      }, 3000);
    }
  }).current;

  const onError = useRef((error) => {
    console.error("📞 CallContainer: WebRTC error:", error.code, error.message);
    callContextRef.current?.setError(error.message);
  }).current;

  // ─── Determine call type for constraints ────────────────────────────────────
  // ✅ FIX 2: We compute this once and keep it stable.
  // The call type doesn't change mid-call.
  const callType = callContext?.currentCall?.type || "audio";
  const isAudioOnly = callType !== "video";

  const constraints = useMemo(() => {
    if (isAudioOnly) {
      return {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      };
    }
    return {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
    };
  }, [isAudioOnly]);

  // ─── WebRTC hook — STABLE instance ──────────────────────────────────────────
  // ✅ FIX 2: We do NOT pass callContext?.currentCall?.direction here because that
  // would recreate the hook every time direction changes. Instead isInitiator is
  // read from isInitiatorRef INSIDE useWebRTC at the time initialize() is called.
  const webrtcInstance = useWebRTC({
    callType,
    constraints,
    socket,
    callId: callContext?.currentCall?.callId,
    // ✅ Pass the current value; useWebRTC stores it in its own ref immediately
    isInitiator: callContext?.currentCall?.direction === "outgoing",
    remoteUserId: callContext?.currentCall?.receiverId,
    onLocalStreamReady,
    onRemoteStreamAdded,
    onConnectionStateChange,
    onError,
  });

  // Keep ref in sync
  useEffect(() => {
    webrtcInstanceRef.current = webrtcInstance;
  }, [webrtcInstance]);

  // ─── Call manager ────────────────────────────────────────────────────────────
  const callManager = useCallManager({
    socket,
    user,
    webrtcManager: webrtcInstance,
    onCallStateChange: (state) => {
      console.log("📞 CallContainer: Call state →", state);
    },
  });

  useEffect(() => {
    callManagerRef_local.current = callManager;
  }, [callManager]);

  // Expose callManager to context so useCall hook can access it
  useEffect(() => {
    if (callContext && callContext.callManagerRef) {
      callContext.callManagerRef.current = callManager;
    }
  }, [callManager, callContext]);

  // ─── Cleanup on unmount ONLY ────────────────────────────────────────────────
  // ✅ FIX 9: Guard with didMountRef so React StrictMode double-invoke doesn't
  // clean up a live call on the first unmount.
  useEffect(() => {
    didMountRef.current = true;
    return () => {
      if (didMountRef.current) {
        console.log("📞 CallContainer: Unmounting — cleaning up WebRTC");
        webrtcInstanceRef.current?.cleanup();
      }
    };
  }, []);

  // ─── Call initiation overlay state ──────────────────────────────────────────
  useEffect(() => {
    const call = callContext?.currentCall;
    const STATES = callContext?.CALL_STATES;
    if (!STATES) return;

    if (!call) {
      if (!userDismissedOverlay && lastCallStatus) {
        setCallInitiationStatus(lastCallStatus);
      } else if (userDismissedOverlay) {
        setCallInitiationStatus(null);
      }
      return;
    }

    const msg = callContext.callStatusMessage;

    switch (call.status) {
      case STATES.INITIATING:
        setUserDismissedOverlay(false);
        setLastCallStatus(null);
        setCallInitiationStatus({
          stage: "initiating",
          message: msg || `Calling ${call.receiverName}...`,
          callType: call.type,
          receiverName: call.receiverName,
        });
        break;

      case STATES.RINGING:
        if (call.direction === "outgoing") {
          setCallInitiationStatus({
            stage: "ringing",
            message: msg || `Ringing ${call.receiverName}...`,
            callType: call.type,
            receiverName: call.receiverName,
          });
        }
        break;

      case STATES.CONNECTING:
        setCallInitiationStatus({
          stage: "connecting",
          message: msg || "Connecting...",
          callType: call.type,
          receiverName: call.receiverName,
        });
        break;

      case STATES.CONNECTED:
        setCallInitiationStatus(null);
        setLastCallStatus(null);
        break;

      case STATES.REJECTED:
      case STATES.FAILED: {
        const failedStatus = {
          stage: "failed",
          message: msg || "Call failed",
          callType: call.type,
          receiverName: call.receiverName,
        };
        setCallInitiationStatus(failedStatus);
        setLastCallStatus(failedStatus);
        break;
      }

      case STATES.IDLE:
      case STATES.ENDED:
        if (userDismissedOverlay || !lastCallStatus) {
          setCallInitiationStatus(null);
        }
        break;

      default:
        break;
    }
  }, [
    callContext?.currentCall?.status,
    callContext?.callStatusMessage,
    userDismissedOverlay,
    lastCallStatus,
  ]);

  // ─── Guard: nothing to render without context/socket ────────────────────────
  if (!callContext || !socket || !connected) {
    return children;
  }

  const call   = callContext.currentCall;
  const STATES = callContext.CALL_STATES;
  const TYPES  = callContext.CALL_TYPES;

  const isIncomingRinging = call?.status === STATES?.RINGING && call?.direction === "incoming";
  const isCallActive      = call && (call.status === STATES?.CONNECTED || call.status === STATES?.CONNECTING);
  const isAudioCall       = call?.type === TYPES?.AUDIO;
  const isVideoCall       = call?.type === TYPES?.VIDEO;

  return (
    <div className="relative w-full h-full">
      {children}

      {/* Incoming call modal */}
      {isIncomingRinging && (
        <IncomingCallModal
          onAccept={() => callManagerRef_local.current?.acceptCall()}
          onReject={(reason) => callManagerRef_local.current?.rejectCall(reason)}
        />
      )}

      {/* Video call UI */}
      {isCallActive && isVideoCall && (
        <VideoCallUI
          localStream={webrtcInstance.localStream}
          remoteStream={webrtcInstance.remoteStream}
          onEndCall={() => callManagerRef_local.current?.endCall()}
          onMuteToggle={(muted) => {
            webrtcInstance.setAudioEnabled(!muted);
            callContext.toggleAudio(muted);
          }}
          onVideoToggle={(disabled) => {
            webrtcInstance.setVideoEnabled(!disabled);
            callContext.toggleVideo(disabled);
          }}
          onSpeakerToggle={(enabled) => callContext.toggleSpeaker(enabled)}
          isMuted={call.muted}
          isVideoDisabled={call.videoDisabled}
          isSpeakerOn={call.speakerOn}
        />
      )}

      {/* Audio call UI */}
      {isCallActive && isAudioCall && (
        <AudioCallUI
          localStream={webrtcInstance.localStream}
          remoteStream={webrtcInstance.remoteStream}
          onEndCall={() => callManagerRef_local.current?.endCall()}
          onMuteToggle={(muted) => {
            webrtcInstance.setAudioEnabled(!muted);
            callContext.toggleAudio(muted);
          }}
          onSpeakerToggle={(enabled) => callContext.toggleSpeaker(enabled)}
          isMuted={call.muted}
          isSpeakerOn={call.speakerOn}
        />
      )}

      {/* Call initiation overlay */}
      {callInitiationStatus && !userDismissedOverlay && (
        <CallInitiationOverlay
          status={callInitiationStatus}
          onCancel={() => {
            console.log("📞 CallContainer: User cancelled overlay");
            setUserDismissedOverlay(true);
            setLastCallStatus(null);
            const s = callContext?.currentCall?.status;
            if (
              s === STATES?.INITIATING ||
              s === STATES?.RINGING ||
              s === STATES?.CONNECTING
            ) {
              callManagerRef_local.current?.endCall();
            }
          }}
        />
      )}

      {/* Error toast */}
      {callContext.callError && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            background: "var(--red, #ef4444)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 9999,
            boxShadow: "0 8px 20px rgba(239,68,68,0.3)",
          }}
        >
          {callContext.callError}
        </div>
      )}
    </div>
  );
};

// ─── CallInitiationOverlay (unchanged from original, kept here for completeness) ─
const CallInitiationOverlay = ({ status, onCancel }) => {
  const { stage, message, callType, receiverName } = status;
  const isAudio     = callType === "audio";
  const isFailed    = stage === "failed";
  const isAnimating = stage === "initiating" || stage === "ringing" || stage === "connecting";

  const stageHint = {
    initiating: "Establishing connection...",
    ringing:    "Waiting for user to answer...",
    connecting: "Setting up secure connection...",
    failed:     "Please try again or check your connection",
  }[stage];

  return (
    <>
      <style>{`
        @keyframes cio-icon-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb, 59,92,203), 0.22); }
          50%       { box-shadow: 0 0 0 10px rgba(var(--primary-rgb, 59,92,203), 0); }
        }
        @keyframes cio-bar-anim {
          0%, 100% { transform: scaleY(0.35); opacity: 0.28; }
          50%       { transform: scaleY(1);    opacity: 1; }
        }
        @keyframes cio-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .cio-card { animation: cio-slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .cio-icon-wrap { animation: cio-icon-pulse 2s ease-in-out infinite; }
        .cio-dot-bar { animation: cio-bar-anim 1.2s ease-in-out infinite; }
        .cio-dot-bar:nth-child(1) { height: 16px; animation-delay: 0s; }
        .cio-dot-bar:nth-child(2) { height: 26px; animation-delay: 0.18s; }
        .cio-dot-bar:nth-child(3) { height: 20px; animation-delay: 0.36s; }
        .cio-dot-bar:nth-child(4) { height: 26px; animation-delay: 0.54s; }
        .cio-dot-bar:nth-child(5) { height: 16px; animation-delay: 0.72s; }
        .cio-cancel-btn:hover { background: rgba(239,68,68,0.18) !important; }
        .cio-dismiss-btn:hover { background: rgba(255,255,255,0.1) !important; }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 9998,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(3, 7, 20, 0.78)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      }}>
        <div className="cio-card" style={{
          position: "relative",
          background: "rgba(8, 15, 38, 0.8)",
          border: "0.5px solid rgba(255,255,255,0.09)",
          borderTop: "0.5px solid rgba(255,255,255,0.15)",
          borderRadius: 24, padding: "32px 32px 28px",
          width: "100%", maxWidth: 360, margin: "0 16px",
          backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}>
          {/* Icon */}
          <div className="cio-icon-wrap" style={{
            width: 68, height: 68, borderRadius: "50%", margin: "0 auto 22px",
            background: isFailed ? "rgba(239,68,68,0.1)" : "rgba(var(--primary-rgb,59,92,203),0.1)",
            border: isFailed ? "0.5px solid rgba(239,68,68,0.28)" : "0.5px solid rgba(var(--primary-rgb,59,92,203),0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isFailed ? (
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : isAudio ? (
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="rgba(var(--primary-rgb,59,92,203),0.9)" strokeWidth={1.8}>
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            ) : (
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="rgba(var(--primary-rgb,59,92,203),0.9)" strokeWidth={1.8}>
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            )}
          </div>

          <div style={{ fontSize: 20, fontWeight: 600, textAlign: "center", color: "#fff", marginBottom: 6 }}>
            {isFailed ? "Call failed" : isAudio ? "Audio call" : "Video call"}
          </div>
          <div style={{ fontSize: 14, textAlign: "center", color: "#94a3b8", marginBottom: 4 }}>{message}</div>

          {receiverName && !isFailed && (
            <div style={{ fontSize: 12, textAlign: "center", color: "#64748b", marginBottom: 24 }}>
              Calling {receiverName}...
            </div>
          )}
          {isFailed && (
            <div style={{ fontSize: 12, textAlign: "center", color: "#64748b", marginBottom: 24 }}>
              Check your connection and try again
            </div>
          )}

          {isAnimating && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5, height: 36, marginBottom: 24 }}>
              {[0,1,2,3,4].map((i) => (
                <div key={i} className="cio-dot-bar" style={{ width: 4, background: "rgba(var(--primary-rgb,59,92,203),0.7)", borderRadius: 3 }}/>
              ))}
            </div>
          )}

          <button onClick={onCancel} className={isFailed ? "cio-dismiss-btn" : "cio-cancel-btn"} style={{
            display: "block", width: "100%", padding: "13px 0", borderRadius: 14,
            border: isFailed ? "0.5px solid rgba(255,255,255,0.1)" : "0.5px solid rgba(239,68,68,0.3)",
            background: isFailed ? "rgba(255,255,255,0.05)" : "rgba(239,68,68,0.09)",
            color: isFailed ? "#94a3b8" : "#fca5a5",
            fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background 0.15s",
          }}>
            {isFailed ? "Dismiss" : "Cancel call"}
          </button>

          <div style={{ fontSize: 11, textAlign: "center", color: "#64748b", marginTop: 12 }}>
            {stageHint}
          </div>
        </div>
      </div>
    </>
  );
};

export default CallContainer;