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
  
  // Debug: Log call context changes
  useEffect(() => {
    const call = callContext?.currentCall;
    console.log("📞 CallContainer: CallContext changed", {
      hasCallContext: !!callContext,
      currentCall: call,
      callStatus: call?.status,
      callDirection: call?.direction,
      socketConnected: connected,
      socketId: socket?.id,
      callStatusMessage: callContext?.callStatusMessage
    });
    
      // Update local status for call initiation UI
    if (call) {
      // Reset states when new call starts
      if (call.status === callContext.CALL_STATES.INITIATING) {
        setUserDismissedOverlay(false);
        setLastCallStatus(null);
        console.log("📞 CallContainer: Call is in INITIATING state - showing call initiation UI");
        setCallInitiationStatus({
          stage: 'initiating',
          message: callContext.callStatusMessage || `Calling ${call.receiverName}...`,
          callType: call.type,
          receiverName: call.receiverName
        });
      } else if (call.status === callContext.CALL_STATES.RINGING && call.direction === 'outgoing') {
        console.log("📞 CallContainer: Call is RINGING (outgoing) - showing ringing UI");
        setCallInitiationStatus({
          stage: 'ringing',
          message: callContext.callStatusMessage || `Ringing ${call.receiverName}...`,
          callType: call.type,
          receiverName: call.receiverName
        });
      } else if (call.status === callContext.CALL_STATES.CONNECTING) {
        console.log("📞 CallContainer: Call is CONNECTING - showing connecting UI");
        setCallInitiationStatus({
          stage: 'connecting',
          message: callContext.callStatusMessage || '🔗 Connecting...',
          callType: call.type,
          receiverName: call.receiverName
        });
      } else if (call.status === callContext.CALL_STATES.REJECTED || call.status === callContext.CALL_STATES.FAILED) {
        console.log(`📞 CallContainer: Call failed/rejected - status: ${call.status}`);
        const failedStatus = {
          stage: 'failed',
          message: callContext.callStatusMessage || 'Call failed',
          callType: call?.type,
          receiverName: call?.receiverName
        };
        setCallInitiationStatus(failedStatus);
        setLastCallStatus(failedStatus); // Keep this status even after call is cleared
      } else if (call.status === callContext.CALL_STATES.CONNECTED) {
        console.log("📞 CallContainer: Call CONNECTED - showing call UI");
        setCallInitiationStatus(null);
        setLastCallStatus(null);
      } else if (call.status === callContext.CALL_STATES.REJECTED || call.status === callContext.CALL_STATES.FAILED) {
        // Keep the failed status even after call object is cleared
        console.log(`📞 CallContainer: Call ${call.status} - keeping status visible until user dismisses`);
      } else if (!call || call.status === callContext.CALL_STATES.IDLE || call.status === callContext.CALL_STATES.ENDED) {
        // Only clear if user has dismissed or we have no last status
        if (userDismissedOverlay || !lastCallStatus) {
          console.log("📞 CallContainer: No active call - hiding call initiation UI");
          setCallInitiationStatus(null);
        }
      }
    } else {
      // No call object - check if we have a last status to display
      if (!userDismissedOverlay && lastCallStatus) {
        setCallInitiationStatus(lastCallStatus);
      } else {
        setCallInitiationStatus(null);
      }
    }
  }, [callContext, connected, socket]);

  // 📞 Set up socket event listeners for incoming calls
  useEffect(() => {
    if (!socket || !connected || !callContext) {
      console.log("📞 CallContainer: Waiting for socket and call context...");
      return;
    }

    console.log("📞 CallContainer: Setting up call event listeners");

    // Listen for incoming calls
    const handleIncomingCall = (callData) => {
      console.log("📞 Incoming call received:", callData);
      if (callContext?.handleIncomingCall) {
        callContext.handleIncomingCall({
          callId: callData.callId,
          type: callData.callType,
          direction: "incoming",
          initiatorId: callData.initiatorId,
          initiatorName: callData.initiatorName,
          initiatorImage: callData.initiatorImage,
          status: "ringing"
        });
      }
    };

    // Listen for call accepted
    const handleCallAccepted = (data) => {
      console.log("📞 Call accepted:", data);
    };

    // Listen for call rejected
    const handleCallRejected = (data) => {
      console.log("📞 Call rejected:", data);
      if (callContext?.rejectCall) {
        callContext.rejectCall(data.reason || "declined");
      }
    };

    // Listen for call ended
    const handleCallEnded = (data) => {
      console.log("📞 Call ended:", data);
      if (callContext?.endCall) {
        callContext.endCall();
      }
    };

    // Register listeners
    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAcceptedAck", handleCallAccepted);
    socket.on("callRejectedAck", handleCallRejected);
    socket.on("callEnded", handleCallEnded);

    // Cleanup
    return () => {
      console.log("📞 CallContainer: Cleaning up call event listeners");
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAcceptedAck", handleCallAccepted);
      socket.off("callRejectedAck", handleCallRejected);
      socket.off("callEnded", handleCallEnded);
    };
  }, [socket, connected, callContext]);
  
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

      {/* Call Initiation Overlay - Shows feedback during call setup (INITIATING, RINGING, CONNECTING, REJECTED, FAILED) */}
      {callInitiationStatus && !userDismissedOverlay && (
        <CallInitiationOverlay
          status={callInitiationStatus}
          onCancel={() => {
            console.log("📞 CallContainer: User dismissed call status overlay");
            setUserDismissedOverlay(true);
            setLastCallStatus(null);
            // Only actually end the call if it's still active
            if (callManager && callContext?.currentCall) {
              const status = callContext.currentCall.status;
              if (status === callContext.CALL_STATES.INITIATING || 
                  status === callContext.CALL_STATES.RINGING ||
                  status === callContext.CALL_STATES.CONNECTING) {
                callManager.endCall();
              }
            }
          }}
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
  const isAudio = callType === 'audio';
  const isVideo = callType === 'video';
  const isFailed = stage === 'failed';
  
  // Animation for ringing/calling states
  const isAnimating = stage === 'initiating' || stage === 'ringing' || stage === 'connecting';
  
  console.log("📞 CallInitiationOverlay: Rendering", { stage, message, isFailed });
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-gray-700">
        {/* Call Type Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isFailed ? 'bg-red-500/20' : 'bg-blue-500/20'} animate-pulse`}>
            {isFailed ? (
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : isAudio ? (
              <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Status Message */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            {isFailed ? 'Call Failed' : (isAudio ? 'Audio Call' : 'Video Call')}
          </h2>
          <p className="text-gray-300 text-lg">
            {message}
          </p>
          {receiverName && !isFailed && (
            <p className="text-gray-400 text-sm mt-2">
              Calling {receiverName}...
            </p>
          )}
        </div>
        
        {/* Loading Animation */}
        {isAnimating && (
          <div className="flex justify-center mb-6">
            <div className="flex gap-1">
              <div className="w-3 h-12 bg-blue-500 rounded animate-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-12 bg-blue-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-12 bg-blue-500 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-3 h-12 bg-blue-500 rounded animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            </div>
          </div>
        )}
        
        {/* Cancel Button */}
        <div className="flex justify-center">
          <button
            onClick={onCancel}
            className={`px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
              isFailed 
                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isFailed ? 'Dismiss' : 'Cancel'}
          </button>
        </div>
        
        {/* Status Indicator */}
        <div className="text-center mt-4">
          <p className="text-gray-500 text-xs">
            {stage === 'initiating' && 'Establishing connection...'}
            {stage === 'ringing' && 'Waiting for user to answer...'}
            {stage === 'connecting' && 'Setting up secure connection...'}
            {stage === 'failed' && 'Please try again or check your connection'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CallContainer;
