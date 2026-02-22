import React, { useContext, useEffect, useRef } from "react";
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
  
  // Debug: Log call context changes
  useEffect(() => {
    console.log("📞 CallContainer: CallContext changed", {
      hasCallContext: !!callContext,
      currentCall: callContext?.currentCall,
      socketConnected: connected,
      socketId: socket?.id
    });
  }, [callContext, connected, socket]);
  
  // Use ref to store WebRTC instance for stable reference in callbacks
  const webrtcInstanceRef = useRef(null);

  // Initialize WebRTC manager
  const webrtcInstance = useWebRTC({
    callType: callContext?.currentCall?.type || "video",
    constraints: callContext?.mediaConstraints,
    socket,
    callId: callContext?.currentCall?.callId,
    isInitiator: callContext?.currentCall?.direction === "outgoing",
    remoteUserId: callContext?.currentCall?.receiverId,
    onLocalStreamReady: (stream) => {
      console.log("📞 CallContainer: Local stream ready", {
        streamId: stream?.id,
        active: stream?.active
      });
    },
    onRemoteStreamAdded: (stream) => {
      console.log("📞 CallContainer: Remote stream added", {
        streamId: stream?.id,
        active: stream?.active
      });
      if (callContext && callContext.currentCall) {
        callContext.setCallConnected(
          webrtcInstanceRef.current?.localStreamRef.current,
          stream
        );
      }
    },
    onConnectionStateChange: (state) => {
      console.log("📞 CallContainer: Connection state changed:", state);
      if (state === "failed" || state === "disconnected") {
        if (callContext && webrtcInstanceRef.current) {
          setTimeout(() => {
            webrtcInstanceRef.current?.endCall();
          }, 3000);
        }
      }
    },
    onError: (error) => {
      console.error("📞 CallContainer: WebRTC error:", error);
      if (callContext) {
        callContext.setError(error.message);
      }
    }
  });

  // Store instance in ref for callbacks that need stable reference
  useEffect(() => {
    webrtcInstanceRef.current = webrtcInstance;
  }, [webrtcInstance]);

  // Initialize call manager
  const callManager = useCallManager({
    socket,
    user,
    webrtcManager: webrtcInstance,
    onCallStateChange: (state) => {
      console.log("📞 CallContainer: Call state changed:", state);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webrtcInstance && webrtcInstance.cleanup) {
        webrtcInstance.cleanup();
      }
    };
  }, [webrtcInstance]);

  // Handle WebRTC initialization when call is accepted
  useEffect(() => {
    if (
      callContext &&
      callContext.currentCall &&
      callContext.currentCall.status === callContext.CALL_STATES.CONNECTING &&
      !callContext.currentCall.localStream
    ) {
      // WebRTC initialization is handled by useCallManager via acceptCall
      console.log("📞 CallContainer: Call accepted, WebRTC will initialize", {
        callId: callContext.currentCall.callId,
        type: callContext.currentCall.type,
        direction: callContext.currentCall.direction
      });
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
    call && (call.status === callContext.CALL_STATES.CONNECTED ||
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
          localStream={webrtcInstance.localStreamRef.current}
          remoteStream={webrtcInstance.remoteStreamRef.current}
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
          localStream={webrtcInstance.localStreamRef.current}
          remoteStream={webrtcInstance.remoteStreamRef.current}
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

      {/* Error display (optional) */}
      {callContext.callError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {callContext.callError}
        </div>
      )}
    </div>
  );
};

export default CallContainer;
