import { useEffect, useCallback, useRef, useContext } from "react";
import { CallContext } from "../context/CallContext";

/**
 * useCallManager Hook
 * 
 * Manages the call flow:
 * - Listen for incoming calls via socket
 * - Emit call events (initiated, accepted, rejected, ended)
 * - Coordinate with CallContext
 * - Integrate with WebRTC via useWebRTC
 * 
 * Props:
 * - socket: Socket.io connection
 * - user: Current user object {_id, name, image}
 * - webrtcManager: Object with WebRTC methods (from useWebRTC)
 */

const useCallManager = ({ socket, user, webrtcManager, onCallStateChange }) => {
  const callContext = useContext(CallContext);
  const ringtoneSoundRef = useRef(new Audio("/audio/ringtone.mp3")); // Path to ringtone
  const callRejectionTimeoutRef = useRef(null);
  const connectionTimeoutRef = useRef(null);


  /**
   * Initiate a call to another user
   */
  const initiateCall = useCallback(
    (receiverId, receiverName, callType = "video", receiverImage = null) => {
      try {
          if (!socket || !user || !callContext) {
      console.warn("Call system not ready yet");
      return;
    }
        // Create call in context
        const callId = callContext.initiateCall(
          receiverId,
          receiverName,
          callType,
          receiverImage
        );

        if (!callId) {
          console.error("Cannot initiate call - another call is active");
          return;
        }

        // Emit to backend
        socket.emit("callInitiated", {
          callId,
          initiatorId: user._id,
          receiverId,
          callType,
          timestamp: new Date().toISOString()
        });

        // Set timeout for ringing (30 seconds)
        callRejectionTimeoutRef.current = setTimeout(() => {
          console.log("Call not answered - timeout");
          callContext.setError("Call not answered");
        }, 30000);

        console.log("Call initiated to", receiverName);
      } catch (error) {
        console.error("Error initiating call:", error);
        callContext.setError(error.message);
      }
    },
    [socket, user, callContext]
  );

  /**
   * Accept incoming call
   */
  const acceptCall = useCallback(async () => {
    try {
  
          if (!socket || !user || !callContext) {
      console.warn("Call system not ready yet");
      return;
    }
      if (!callContext.currentCall) {
        console.error("No incoming call to accept");
        return;
      }

      // Stop ringtone
      ringtoneSoundRef.current.pause();

      // Update context
      callContext.acceptCall();

      // Emit acceptance to backend
      socket.emit("callAccepted", {
        callId: callContext.currentCall.callId,
        acceptorId: user._id,
        timestamp: new Date().toISOString()
      });

      // Initialize WebRTC if available
      if (webrtcManager) {
        try {
          await webrtcManager.initialize();
        } catch (error) {
          console.error("WebRTC initialization failed:", error);
          callContext.setError("Failed to initialize media");
        }
      }

      console.log("Call accepted");
    } catch (error) {
      console.error("Error accepting call:", error);
      callContext.setError(error.message);
    }
  }, [callContext, socket, user, webrtcManager]);

  /**
   * Reject incoming call
   */
  const rejectCall = useCallback(
    (reason = "declined") => {
        if (!socket || !user || !callContext) {
      console.warn("Call system not ready yet");
      return;
    }
      try {
        if (!callContext.currentCall) {
          console.error("No incoming call to reject");
          return;
        }

        // Stop ringtone
        ringtoneSoundRef.current.pause();

        // Emit rejection to backend
        socket.emit("callRejected", {
          callId: callContext.currentCall.callId,
          rejecterId: user._id,
          reason,
          timestamp: new Date().toISOString()
        });

        // Update context
        callContext.rejectCall(reason);

        // Clear after 2 seconds
        setTimeout(() => {
          callContext.clearCall();
        }, 2000);

        console.log("Call rejected -", reason);
      } catch (error) {
        console.error("Error rejecting call:", error);
      }
    },
    [callContext, socket, user]
  );

  /**
   * End active call
   */
  const endCall = useCallback(() => {
    try {
        if (!socket || !user || !callContext) {
      console.warn("Call system not ready yet");
      return;
    }
      if (!callContext.currentCall) {
        console.error("No active call to end");
        return;
      }

      // Cleanup WebRTC
      if (webrtcManager) {
        webrtcManager.cleanup();
      }

      // Calculate duration
      const duration = callContext.currentCall.duration || 0;

      // Emit end call to backend
      socket.emit("callEnded", {
        callId: callContext.currentCall.callId,
        endedBy: user._id,
        duration,
        timestamp: new Date().toISOString()
      });

      // Update context
      callContext.endCall();

      // Clear after 2 seconds
      setTimeout(() => {
        callContext.clearCall();
      }, 2000);

      // Clear timeouts
      clearTimeout(callRejectionTimeoutRef.current);
      clearTimeout(connectionTimeoutRef.current);

      console.log("Call ended");
    } catch (error) {
      console.error("Error ending call:", error);
    }
  }, [callContext, socket, user, webrtcManager]);

  /**
   * Setup socket listeners for incoming calls
   */
  useEffect(() => {
    if (!socket) return;

    // Incoming call from another user
    const handleIncomingCall = (callData) => {
      console.log("Incoming call:", callData);

      // Check if can accept (no active call)
      if (callContext.hasActiveCall()) {
        console.warn("Cannot accept call - another call is active");
        socket.emit("callRejected", {
          callId: callData.callId,
          rejecterId: user._id,
          reason: "busy"
        });
        return;
      }

      // Add current user to call data
      const fullCallData = {
        ...callData,
        receiverId: user._id
      };

      // Show incoming call
      callContext.handleIncomingCall(fullCallData);

      // Play ringtone
      try {
        ringtoneSoundRef.current.loop = true;
        ringtoneSoundRef.current.play().catch(err => console.log("Ringtone play failed:", err));
      } catch (error) {
        console.log("Could not play ringtone:", error);
      }

      // Auto-reject after 30 seconds
      const timeout = setTimeout(() => {
        console.log("Auto-rejecting call - no answer");
        rejectCall("missed");
      }, 30000);

      return () => clearTimeout(timeout);
    };

    // Call was accepted by other user
    const handleCallAcceptedAck = () => {
      console.log("Call accepted by other user");
      clearTimeout(callRejectionTimeoutRef.current);

      // Update context
      callContext.acceptCall();

      // Initialize WebRTC
      if (webrtcManager) {
        webrtcManager.initialize().catch(error => {
          console.error("WebRTC init failed:", error);
          endCall();
        });
      }
    };

    // Call was rejected
    const handleCallRejectedAck = (data) => {
      console.log("Call rejected -", data.reason);
      clearTimeout(callRejectionTimeoutRef.current);

      callContext.rejectCall(data.reason);

      setTimeout(() => {
        callContext.clearCall();
      }, 2000);
    };

    // Call ended by other user
    const handleCallEndedAck = (data) => {
      console.log("Call ended by other user");
      if (webrtcManager) {
        webrtcManager.cleanup();
      }

      callContext.endCall();

      setTimeout(() => {
        callContext.clearCall();
      }, 2000);
    };

    // WebRTC: Incoming offer from peer
    const handleWebrtcOffer = async (data) => {
      console.log("Received WebRTC offer");
      if (webrtcManager && webrtcManager.handleOffer) {
        try {
          await webrtcManager.handleOffer(data.sdp);
        } catch (error) {
          console.error("Error handling offer:", error);
          endCall();
        }
      }
    };

    // WebRTC: Incoming answer from peer
    const handleWebrtcAnswer = async (data) => {
      console.log("Received WebRTC answer");
      if (webrtcManager && webrtcManager.handleAnswer) {
        try {
          await webrtcManager.handleAnswer(data.sdp);
        } catch (error) {
          console.error("Error handling answer:", error);
          endCall();
        }
      }
    };

    // WebRTC: Incoming ICE candidate
    const handleWebrtcIceCandidate = (data) => {
      if (webrtcManager && webrtcManager.handleIceCandidate) {
        webrtcManager.handleIceCandidate(data.candidate);
      }
    };

    // Register listeners
    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAcceptedAck", handleCallAcceptedAck);
    socket.on("callRejectedAck", handleCallRejectedAck);
    socket.on("callEndedAck", handleCallEndedAck);
    socket.on("webrtcOffer", handleWebrtcOffer);
    socket.on("webrtcAnswer", handleWebrtcAnswer);
    socket.on("webrtcIceCandidate", handleWebrtcIceCandidate);

    // Cleanup
    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAcceptedAck", handleCallAcceptedAck);
      socket.off("callRejectedAck", handleCallRejectedAck);
      socket.off("callEndedAck", handleCallEndedAck);
      socket.off("webrtcOffer", handleWebrtcOffer);
      socket.off("webrtcAnswer", handleWebrtcAnswer);
      socket.off("webrtcIceCandidate", handleWebrtcIceCandidate);
    };
  }, [socket, user, callContext, webrtcManager, endCall, rejectCall]);

  return {
    initiateCall,
    acceptCall,
    answerCall: acceptCall, // Alias for acceptCall
    rejectCall,
    endCall
  };
};

export default useCallManager;
