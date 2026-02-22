import { useEffect, useRef, useCallback, useState } from "react";

/**
 * useWebRTC Hook
 * 
 * Manages WebRTC peer connection lifecycle:
 * - Create/close peer connections
 * - Handle local media streams
 * - Handle SDP offer/answer negotiation
 * - Handle ICE candidate gathering and adding
 * - Manage connection state changes
 * 
 * Props:
 * - callType: "audio" or "video"
 * - constraints: Media device constraints
 * - socket: Socket.io connection
 * - callId: Call identifier
 * - isInitiator: Whether this user is initiating the call
 * - remoteUserId: The other user's ID
 * - onLocalStreamReady: Callback when local stream is captured
 * - onRemoteStreamAdded: Callback when remote stream received
 * - onConnectionStateChange: Callback for connection state changes
 * - onError: Callback for errors
 */

const useWebRTC = ({
  callType,
  constraints,
  socket,
  callId,
  isInitiator,
  remoteUserId,
  onLocalStreamReady,
  onRemoteStreamAdded,
  onConnectionStateChange,
  onError
}) => {
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("new");
  const iceCandidateQueueRef = useRef([]);
  const remoteDescriptionSetRef = useRef(false);

  /**
   * Get user media (camera/microphone)
   */
  const getLocalStream = useCallback(async () => {
    try {
      const mediaConstraints = callType === "video"
        ? constraints
        : { audio: constraints.audio, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      localStreamRef.current = stream;

      // Call callback with local stream
      if (onLocalStreamReady) {
        onLocalStreamReady(stream);
      }

      return stream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      if (onError) {
        onError({
          code: "LOCAL_STREAM_ERROR",
          message: "Failed to access microphone/camera",
          originalError: error
        });
      }
      throw error;
    }
  }, [callType, constraints, onLocalStreamReady, onError]);

  /**
   * Create RTCPeerConnection
   */
  const createPeerConnection = useCallback(async () => {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun1.l.google.com:19302"] }
        ]
      });

      peerConnection.ref = useRef();

      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("Remote track received:", event.track.kind);

        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }

        remoteStreamRef.current.addTrack(event.track);

        if (onRemoteStreamAdded) {
          onRemoteStreamAdded(remoteStreamRef.current);
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtcIceCandidate", {
            callId,
            to: remoteUserId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid
            }
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const newState = peerConnection.connectionState;
        setConnectionState(newState);

        if (onConnectionStateChange) {
          onConnectionStateChange(newState);
        }

        if (newState === "connected") {
          setIsConnected(true);
        } else if (newState === "failed" || newState === "disconnected" || newState === "closed") {
          setIsConnected(false);
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    } catch (error) {
      console.error("Error creating peer connection:", error);
      if (onError) {
        onError({
          code: "PEER_CONNECTION_ERROR",
          message: "Failed to create peer connection",
          originalError: error
        });
      }
      throw error;
    }
  }, [callId, remoteUserId, socket, onConnectionStateChange, onError, onRemoteStreamAdded]);

  /**
   * Create and send SDP offer
   */
  const createOffer = useCallback(async () => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error("Peer connection not initialized");
      }

      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video"
      });

      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit("webrtcOffer", {
        callId,
        to: remoteUserId,
        sdp: offer.sdp
      });

      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      if (onError) {
        onError({
          code: "OFFER_ERROR",
          message: "Failed to create WebRTC offer",
          originalError: error
        });
      }
      throw error;
    }
  }, [callId, callType, remoteUserId, socket, onError]);

  /**
   * Handle incoming SDP offer
   */
  const handleOffer = useCallback(async (offer) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error("Peer connection not initialized");
      }

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription({ type: "offer", sdp: offer })
      );

      remoteDescriptionSetRef.current = true;

      // Create and send answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socket.emit("webrtcAnswer", {
        callId,
        to: remoteUserId,
        sdp: answer.sdp
      });

      // Process queued ICE candidates
      processIceCandidateQueue();

      return answer;
    } catch (error) {
      console.error("Error handling offer:", error);
      if (onError) {
        onError({
          code: "OFFER_HANDLE_ERROR",
          message: "Failed to handle WebRTC offer",
          originalError: error
        });
      }
      throw error;
    }
  }, [callId, remoteUserId, socket, onError]);

  /**
   * Handle incoming SDP answer
   */
  const handleAnswer = useCallback(async (answer) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error("Peer connection not initialized");
      }

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: answer })
      );

      remoteDescriptionSetRef.current = true;

      // Process queued ICE candidates
      processIceCandidateQueue();

      return answer;
    } catch (error) {
      console.error("Error handling answer:", error);
      if (onError) {
        onError({
          code: "ANSWER_HANDLE_ERROR",
          message: "Failed to handle WebRTC answer",
          originalError: error
        });
      }
      throw error;
    }
  }, [callId, remoteUserId, onError]);

  /**
   * Handle incoming ICE candidate
   */
  const handleIceCandidate = useCallback(async (candidate) => {
    try {
      if (!peerConnectionRef.current) {
        console.warn("Peer connection not ready, queueing ICE candidate");
        iceCandidateQueueRef.current.push(candidate);
        return;
      }

      if (remoteDescriptionSetRef.current) {
        // Remote description is set, add candidate immediately
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } else {
        // Queue for later when remote description is set
        iceCandidateQueueRef.current.push(candidate);
      }
    } catch (error) {
      // Ignore errors for candidates that can't be added
      console.warn("Error adding ICE candidate:", error);
    }
  }, []);

  /**
   * Process queued ICE candidates
   */
  const processIceCandidateQueue = useCallback(async () => {
    while (iceCandidateQueueRef.current.length > 0) {
      const candidate = iceCandidateQueueRef.current.shift();
      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.warn("Error processing queued ICE candidate:", error);
      }
    }
  }, []);

  /**
   * Toggle audio track
   */
  const setAudioEnabled = useCallback((enabled) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, []);

  /**
   * Toggle video track
   */
  const setVideoEnabled = useCallback((enabled) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, []);

  /**
   * Close all connections and cleanup
   */
  const cleanup = useCallback(() => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Clear remote stream
    remoteStreamRef.current = null;

    // Clear state
    setIsConnected(false);
    setConnectionState("closed");
    iceCandidateQueueRef.current = [];
    remoteDescriptionSetRef.current = false;
  }, []);

  /**
   * Initialize WebRTC
   */
  const initialize = useCallback(async () => {
    try {
      // Step 1: Get local stream
      const localStream = await getLocalStream();

      // Step 2: Create peer connection
      const peerConnection = await createPeerConnection();

      // Step 3: If initiator, create offer
      if (isInitiator) {
        await createOffer();
      }

      return { localStream, peerConnection };
    } catch (error) {
      cleanup();
      throw error;
    }
  }, [getLocalStream, createPeerConnection, createOffer, isInitiator, cleanup]);

  /**
   * Check if WebRTC is supported
   */
  const isWebRTCSupported = useCallback(() => {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      (window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection)
    );
  }, []);

  return {
    // State
    isConnected,
    connectionState,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,

    // Methods
    initialize,
    cleanup,
    getLocalStream,
    createPeerConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    setAudioEnabled,
    setVideoEnabled,
    isWebRTCSupported,

    // Refs
    peerConnectionRef,
    localStreamRef,
    remoteStreamRef
  };
};

export default useWebRTC;
