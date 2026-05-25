import React, { useContext, useEffect, useRef, useState } from "react";
import { CallContext } from "../../context/CallContext";
import { useSocket } from "../../context/useSocket";
import useWebRTC from "../../hooks/useWebRTC";
import useCallManager from "../../hooks/useCallManager";
import IncomingCallModal from "./IncomingCallModal";
import VideoCallUI from "./VideoCallUI";
import AudioCallUI from "./AudioCallUI";

/**
 * CallContainer
 *
 * Main component that orchestrates the entire call system:
 * 1. Manages call context
 * 2. Initializes WebRTC connections
 * 3. Sets up socket listeners for call events
 * 4. Displays appropriate UI based on call state
 * 5. Handles all call actions
 *
 * Props:
 * - user: Current user object {_Id, name, image}
 * - children: Application children
 *
 * Usage:
 * <CallContainer user={currentUser}>
 *   <YourApp />
 * </CallContainer>
 */

const CallContainer = ({ user, children }) => {
  const callContext = useContext(CallContext);
  const { socket, connected } = useSocket() || {};
  const [callInitiationStatus, setCallInitiationStatus] = useState(null);
  const [userDismissedOverlay, setUserDismissedOverlay] = useState(false);
  const [lastCallStatus, setLastCallStatus] = useState(null);

  useEffect(() => {
    const call = callContext?.currentCall;
    console.log("📞 CallContainer: CallContext changed", {
      hasCallContext: !!callContext,
      currentCall: call,
      callStatus: call?.status,
      callDirection: call?.direction,
      socketConnected: connected,
      socketId: socket?.id,
      callStatusMessage: callContext?.callStatusMessage,
    });

    if (call) {
      if (call.status === callContext.CALL_STATES.INITIATING) {
        setUserDismissedOverlay(false);
        setLastCallStatus(null);
        console.log(
          "📞 CallContainer: Call is in INITIATING state - showing call initiation UI"
        );
        setCallInitiationStatus({
          stage: "initiating",
          message:
            callContext.callStatusMessage ||
            `Calling ${call.receiverName}...`,
          callType: call.type,
          receiverName: call.receiverName,
        });
      } else if (
        call.status === callContext.CALL_STATES.RINGING &&
        call.direction === "outgoing"
      ) {
        console.log(
          "📞 CallContainer: Call is RINGING (outgoing) - showing ringing UI"
        );
        setCallInitiationStatus({
          stage: "ringing",
          message:
            callContext.callStatusMessage ||
            `Ringing ${call.receiverName}...`,
          callType: call.type,
          receiverName: call.receiverName,
        });
      } else if (call.status === callContext.CALL_STATES.CONNECTING) {
        console.log(
          "📞 CallContainer: Call is CONNECTING - showing connecting UI"
        );
        setCallInitiationStatus({
          stage: "connecting",
          message:
            callContext.callStatusMessage || "🔗 Connecting...",
          callType: call.type,
          receiverName: call.receiverName,
        });
      } else if (
        call.status === callContext.CALL_STATES.REJECTED ||
        call.status === callContext.CALL_STATES.FAILED
      ) {
        console.log(
          `📞 CallContainer: Call failed/rejected - status: ${call.status}`
        );
        const failedStatus = {
          stage: "failed",
          message: callContext.callStatusMessage || "Call failed",
          callType: call?.type,
          receiverName: call?.receiverName,
        };
        setCallInitiationStatus(failedStatus);
        setLastCallStatus(failedStatus);
      } else if (call.status === callContext.CALL_STATES.CONNECTED) {
        console.log("📞 CallContainer: Call CONNECTED - showing call UI");
        setCallInitiationStatus(null);
        setLastCallStatus(null);
      } else if (
        !call ||
        call.status === callContext.CALL_STATES.IDLE ||
        call.status === callContext.CALL_STATES.ENDED
      ) {
        if (userDismissedOverlay || !lastCallStatus) {
          console.log(
            "📞 CallContainer: No active call - hiding call initiation UI"
          );
          setCallInitiationStatus(null);
        }
      }
    } else {
      if (!userDismissedOverlay && lastCallStatus) {
        setCallInitiationStatus(lastCallStatus);
      } else {
        setCallInitiationStatus(null);
      }
    }
  }, [callContext, connected, socket]);

  const webrtcInstanceRef = useRef(null);

  // Stable callbacks in refs so they never cause re-renders
  const callContextRef = useRef(callContext);
  useEffect(() => { callContextRef.current = callContext; }, [callContext]);

  const onLocalStreamReady = useRef((stream) => {
    console.log("📞 CallContainer: Local stream ready", {
      streamId: stream?.id, active: stream?.active,
    });
  }).current;

  const onRemoteStreamAdded = useRef((stream) => {
    console.log("📞 CallContainer: Remote stream added", {
      streamId: stream?.id, active: stream?.active,
    });
    const ctx = callContextRef.current;
    if (ctx && ctx.currentCall) {
      ctx.setCallConnected(
        webrtcInstanceRef.current?.localStreamRef.current,
        stream
      );
    }
  }).current;

  const onConnectionStateChange = useRef((state) => {
    console.log("📞 CallContainer: Connection state changed:", state);
    if (state === "failed" || state === "disconnected") {
      setTimeout(() => {
        webrtcInstanceRef.current?.cleanup();
      }, 3000);
    }
  }).current;

  const onError = useRef((error) => {
    console.error("📞 CallContainer: WebRTC error:", error);
    callContextRef.current?.setError(error.message);
  }).current;

  const callType = callContext?.currentCall?.type || "audio";
  const isAudioOnly = callType === "audio";

  const webrtcInstance = useWebRTC({
    callType,
    constraints: isAudioOnly
      ? {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        }
      : {
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
        },
    socket,
    callId: callContext?.currentCall?.callId,
    isInitiator: callContext?.currentCall?.direction === "outgoing",
    remoteUserId: callContext?.currentCall?.receiverId,
    onLocalStreamReady,
    onRemoteStreamAdded,
    onConnectionStateChange,
    onError,
  });

  // Keep ref always pointing to latest instance
  useEffect(() => {
    webrtcInstanceRef.current = webrtcInstance;
  }, [webrtcInstance]);

  const callManager = useCallManager({
    socket,
    user,
    webrtcManager: webrtcInstance,
    onCallStateChange: (state) => {
      console.log("📞 CallContainer: Call state changed:", state);
    },
  });

  // Only cleanup on unmount — not on every re-render
  useEffect(() => {
    return () => {
      webrtcInstanceRef.current?.cleanup();
    };
  }, []); 

  useEffect(() => {
    if (callContext && callContext.callManagerRef) {
      callContext.callManagerRef.current = callManager;
    }
  }, [callManager, callContext]);

  useEffect(() => {
    if (
      callContext &&
      callContext.currentCall &&
      callContext.currentCall.status === callContext.CALL_STATES.CONNECTING &&
      !callContext.currentCall.localStream
    ) {
      console.log(
        "📞 CallContainer: Call accepted, WebRTC will initialize",
        {
          callId: callContext.currentCall.callId,
          type: callContext.currentCall.type,
          direction: callContext.currentCall.direction,
        }
      );
    }
  }, [callContext]);

  if (!callContext || !socket || !connected) {
    return children;
  }

  const call = callContext.currentCall;
  const isIncomingCallRinging =
    call &&
    call.status === callContext.CALL_STATES.RINGING &&
    call.direction === "incoming";

  const isCallActive =
    call &&
    (call.status === callContext.CALL_STATES.CONNECTED ||
      call.status === callContext.CALL_STATES.CONNECTING);

  const isAudioCall = call && call.type === callContext.CALL_TYPES.AUDIO;
  const isVideoCall = call && call.type === callContext.CALL_TYPES.VIDEO;

  return (
    <div className="relative w-full h-full">
      {children}

      {/* Incoming Call Modal */}
      {isIncomingCallRinging && (
        <IncomingCallModal
          onAccept={() => {
            if (callManager) {
              callManager.acceptCall();
            }
          }}
          onReject={(reason) => {
            if (callManager) {
              callManager.rejectCall(reason);
            }
          }}
        />
      )}

      {/* Video Call UI */}
{isCallActive && isVideoCall && (
  <VideoCallUI
    localStream={webrtcInstance.localStream}
    remoteStream={webrtcInstance.remoteStream}
    onEndCall={() => {
            if (callManager) {
              callManager.endCall();
            }
          }}
          onMuteToggle={(muted) => {
            if (webrtcInstance) {
              webrtcInstance.setAudioEnabled(!muted);
              if (callContext) {
                callContext.toggleAudio(muted);
              }
            }
          }}
          onVideoToggle={(disabled) => {
            if (webrtcInstance) {
              webrtcInstance.setVideoEnabled(!disabled);
              if (callContext) {
                callContext.toggleVideo(disabled);
              }
            }
          }}
          onSpeakerToggle={(enabled) => {
            if (callContext) {
              callContext.toggleSpeaker(enabled);
            }
          }}
          isMuted={call.muted}
          isVideoDisabled={call.videoDisabled}
          isSpeakerOn={call.speakerOn}
        />
      )}

      {/* Audio Call UI */}
      {isCallActive && isAudioCall && (
        <AudioCallUI
    localStream={webrtcInstance.localStream}
    remoteStream={webrtcInstance.remoteStream}
          onEndCall={() => {
            if (callManager) {
              callManager.endCall();
            }
          }}
          onMuteToggle={(muted) => {
            if (webrtcInstance) {
              webrtcInstance.setAudioEnabled(!muted);
              if (callContext) {
                callContext.toggleAudio(muted);
              }
            }
          }}
          onSpeakerToggle={(enabled) => {
            if (callContext) {
              callContext.toggleSpeaker(enabled);
            }
          }}
          isMuted={call.muted}
          isSpeakerOn={call.speakerOn}
        />
      )}

      {/* Call Initiation Overlay */}
      {callInitiationStatus && !userDismissedOverlay && (
        <CallInitiationOverlay
          status={callInitiationStatus}
          onCancel={() => {
            console.log(
              "📞 CallContainer: User dismissed call status overlay"
            );
            setUserDismissedOverlay(true);
            setLastCallStatus(null);
            if (callManager && callContext?.currentCall) {
              const status = callContext.currentCall.status;
              if (
                status === callContext.CALL_STATES.INITIATING ||
                status === callContext.CALL_STATES.RINGING ||
                status === callContext.CALL_STATES.CONNECTING
              ) {
                callManager.endCall();
              }
            }
          }}
        />
      )}

      {/* Error display */}
      {callContext.callError && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            background: "var(--error, #ef4444)",
            color: "var(--white, #ffffff)",
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 50,
            boxShadow: "0 8px 20px rgba(239,68,68,0.3)",
          }}
        >
          {callContext.callError}
        </div>
      )}
    </div>
  );
};

/**
 * CallInitiationOverlay
 *
 * Shows user feedback during call setup phases:
 * - INITIATING: "Calling [Name]..."
 * - RINGING (outgoing): "Ringing..."
 * - CONNECTING: "Connecting..."
 * - REJECTED/FAILED: Shows error with option to dismiss
 */
const CallInitiationOverlay = ({ status, onCancel }) => {
  const { stage, message, callType, receiverName } = status;
  const isAudio = callType === "audio";
  const isFailed = stage === "failed";
  const isAnimating =
    stage === "initiating" || stage === "ringing" || stage === "connecting";

  console.log("📞 CallInitiationOverlay: Rendering", {
    stage,
    message,
    isFailed,
  });

  const stageHint = {
    initiating: "Establishing connection...",
    ringing: "Waiting for user to answer...",
    connecting: "Setting up secure connection...",
    failed: "Please try again or check your connection",
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
        .cio-cancel-btn:hover {
          background: rgba(239,68,68,0.18) !important;
        }
        .cio-dismiss-btn:hover {
          background: rgba(255,255,255,0.1) !important;
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(3, 7, 20, 0.78)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -58%)",
            width: 380,
            height: 180,
            background: isFailed
              ? "radial-gradient(ellipse, rgba(239,68,68,0.08) 0%, transparent 70%)"
              : "radial-gradient(ellipse, rgba(var(--primary-rgb, 59,92,203), 0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Card */}
        <div
          className="cio-card"
          style={{
            position: "relative",
            background: "rgba(8, 15, 38, 0.8)",
            border: "0.5px solid rgba(255,255,255,0.09)",
            borderTop: "0.5px solid rgba(255,255,255,0.15)",
            borderRadius: 24,
            padding: "32px 32px 28px",
            width: "100%",
            maxWidth: 360,
            margin: "0 16px",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Icon */}
          <div
            className="cio-icon-wrap"
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: isFailed
                ? "rgba(239,68,68,0.1)"
                : "rgba(var(--primary-rgb, 59,92,203), 0.1)",
              border: isFailed
                ? "0.5px solid rgba(239,68,68,0.28)"
                : "0.5px solid rgba(var(--primary-rgb, 59,92,203), 0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 22px",
            }}
          >
            {isFailed ? (
              <svg
                width={30}
                height={30}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fca5a5"
                strokeWidth={2}
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : isAudio ? (
              <svg
                width={30}
                height={30}
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(var(--primary-rgb, 59,92,203), 0.9)"
                strokeWidth={1.8}
              >
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            ) : (
              <svg
                width={30}
                height={30}
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(var(--primary-rgb, 59,92,203), 0.9)"
                strokeWidth={1.8}
              >
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              textAlign: "center",
              color: "var(--white, #ffffff)",
              marginBottom: 6,
              letterSpacing: "-0.2px",
            }}
          >
            {isFailed ? "Call failed" : isAudio ? "Audio call" : "Video call"}
          </div>

          {/* Message */}
          <div
            style={{
              fontSize: 14,
              textAlign: "center",
              color: "var(--text-secondary, #94a3b8)",
              marginBottom: 4,
            }}
          >
            {message}
          </div>

          {/* Sub-message */}
          {receiverName && !isFailed && (
            <div
              style={{
                fontSize: 12,
                textAlign: "center",
                color: "var(--text-muted, #64748b)",
                marginBottom: 24,
                letterSpacing: "0.01em",
              }}
            >
              Calling {receiverName}...
            </div>
          )}

          {isFailed && (
            <div
              style={{
                fontSize: 12,
                textAlign: "center",
                color: "var(--text-muted, #64748b)",
                marginBottom: 24,
                letterSpacing: "0.01em",
              }}
            >
              Check your connection and try again
            </div>
          )}

          {/* Animated bars */}
          {isAnimating && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 5,
                height: 36,
                marginBottom: 24,
              }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="cio-dot-bar"
                  style={{
                    width: 4,
                    background:
                      "rgba(var(--primary-rgb, 59,92,203), 0.7)",
                    borderRadius: 3,
                  }}
                />
              ))}
            </div>
          )}

          {/* Action button */}
          <button
            onClick={onCancel}
            className={isFailed ? "cio-dismiss-btn" : "cio-cancel-btn"}
            style={{
              display: "block",
              width: "100%",
              padding: "13px 0",
              borderRadius: 14,
              border: isFailed
                ? "0.5px solid rgba(255,255,255,0.1)"
                : "0.5px solid rgba(239,68,68,0.3)",
              background: isFailed
                ? "rgba(255,255,255,0.05)"
                : "rgba(239,68,68,0.09)",
              color: isFailed
                ? "var(--text-secondary, #94a3b8)"
                : "#fca5a5",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s",
              letterSpacing: "0.01em",
            }}
          >
            {isFailed ? "Dismiss" : "Cancel call"}
          </button>

          {/* Hint */}
          <div
            style={{
              fontSize: 11,
              textAlign: "center",
              color: "var(--text-muted, #64748b)",
              marginTop: 12,
              letterSpacing: "0.02em",
            }}
          >
            {stageHint}
          </div>
        </div>
      </div>
    </>
  );
};

export default CallContainer;