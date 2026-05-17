import { useRef, useCallback, useState } from "react";

// ─── Module-level variables ───────────────────────────────────────────────────
// These live OUTSIDE React so they survive every re-render of CallContainer.
// When cleanup() is called they all reset to null/false/[].
let _isInitialized = false;
let _peerConnection = null;
let _localStream = null;
let _remoteStream = null;
let _iceCandidateQueue = [];
let _remoteDescriptionSet = false;
// ─────────────────────────────────────────────────────────────────────────────

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
  onError,
}) => {
  // Refs that point at the module-level variables above.
  // We sync them on every render so callbacks always read the latest value.
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidateQueueRef = useRef(_iceCandidateQueue);
  const remoteDescriptionSetRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Sync module vars → refs on every render
  peerConnectionRef.current = _peerConnection;
  localStreamRef.current = _localStream;
  remoteStreamRef.current = _remoteStream;
  iceCandidateQueueRef.current = _iceCandidateQueue;
  remoteDescriptionSetRef.current = _remoteDescriptionSet;
  isInitializedRef.current = _isInitialized;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("new");

  // ─── Get local media ────────────────────────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    try {
      const mediaConstraints =
        callType === "audio"
          ? {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: false,
            }
          : constraints || {
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

      console.log("📞 useWebRTC: Requesting media:", mediaConstraints);
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      // Write to BOTH the module var and the ref
      _localStream = stream;
      localStreamRef.current = stream;

      console.log("📞 useWebRTC: Local stream obtained", {
        tracks: stream.getTracks().map((t) => t.kind),
      });
      onLocalStreamReady?.(stream);
      return stream;
    } catch (error) {
      console.error("📞 useWebRTC: Error getting local stream:", error);
      onError?.({
        code: "LOCAL_STREAM_ERROR",
        message: "Failed to access microphone/camera. Please check permissions.",
        originalError: error,
      });
      throw error;
    }
  }, [callType, constraints, onLocalStreamReady, onError]);

  // ─── Process queued ICE candidates ─────────────────────────────────────────
  const processIceCandidateQueue = useCallback(async () => {
    console.log(`📞 useWebRTC: Processing ${_iceCandidateQueue.length} queued ICE candidates`);
    while (_iceCandidateQueue.length > 0) {
      const candidate = _iceCandidateQueue.shift();
      try {
        await _peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("📞 useWebRTC: Error processing queued ICE candidate:", err);
      }
    }
  }, []);

  // ─── Create peer connection ─────────────────────────────────────────────────
  const createPeerConnection = useCallback(async () => {
    try {
      console.log("📞 useWebRTC: Creating RTCPeerConnection");

      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun1.l.google.com:19302"] },
          { urls: ["stun:stun2.l.google.com:19302"] },
        ],
      });

      // Add local tracks
      if (_localStream) {
        _localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, _localStream);
          console.log("📞 useWebRTC: Added local track:", track.kind);
        });
      }

      // Remote stream handler
      peerConnection.ontrack = (event) => {
        console.log("📞 useWebRTC: Remote track received:", event.track.kind);
        if (!_remoteStream) {
          _remoteStream = new MediaStream();
          remoteStreamRef.current = _remoteStream;
        }
        _remoteStream.addTrack(event.track);
        onRemoteStreamAdded?.(_remoteStream);
      };

      // ICE candidate handler
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("📞 useWebRTC: Sending ICE candidate");
          socket?.emit("webrtcIceCandidate", {
            callId,
            to: remoteUserId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
            },
          });
        } else {
          console.log("📞 useWebRTC: ICE gathering complete");
        }
      };

      // Connection state handler
      peerConnection.onconnectionstatechange = () => {
        const newState = peerConnection.connectionState;
        console.log("📞 useWebRTC: Connection state:", newState);
        setConnectionState(newState);
        onConnectionStateChange?.(newState);
        if (newState === "connected") setIsConnected(true);
        else if (["failed", "disconnected", "closed"].includes(newState))
          setIsConnected(false);
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log("📞 useWebRTC: ICE state:", peerConnection.iceConnectionState);
      };

      // Write to BOTH module var and ref
      _peerConnection = peerConnection;
      peerConnectionRef.current = peerConnection;

      return peerConnection;
    } catch (error) {
      console.error("📞 useWebRTC: Error creating peer connection:", error);
      onError?.({
        code: "PEER_CONNECTION_ERROR",
        message: "Failed to create peer connection",
        originalError: error,
      });
      throw error;
    }
  }, [callId, remoteUserId, socket, onConnectionStateChange, onError, onRemoteStreamAdded]);

  // ─── Create and send offer (initiator only) ─────────────────────────────────
  const createOffer = useCallback(async () => {
    try {
      if (!_peerConnection) throw new Error("Peer connection not initialized");
      console.log("📞 useWebRTC: Creating offer");
      const offer = await _peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });
      await _peerConnection.setLocalDescription(offer);
      console.log("📞 useWebRTC: Emitting webrtcOffer");
      socket?.emit("webrtcOffer", { callId, to: remoteUserId, sdp: offer.sdp });
      return offer;
    } catch (error) {
      console.error("📞 useWebRTC: Error creating offer:", error);
      onError?.({ code: "OFFER_ERROR", message: "Failed to create WebRTC offer", originalError: error });
      throw error;
    }
  }, [callId, callType, remoteUserId, socket, onError]);

  // ─── Handle incoming offer (receiver only) ──────────────────────────────────
  const handleOffer = useCallback(async (offer) => {
    try {
      if (!_peerConnection) throw new Error("Peer connection not initialized");
      console.log("📞 useWebRTC: Handling incoming offer");
      await _peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "offer", sdp: offer })
      );
      // Write to BOTH
      _remoteDescriptionSet = true;
      remoteDescriptionSetRef.current = true;

      const answer = await _peerConnection.createAnswer();
      await _peerConnection.setLocalDescription(answer);
      console.log("📞 useWebRTC: Emitting webrtcAnswer");
      socket?.emit("webrtcAnswer", { callId, to: remoteUserId, sdp: answer.sdp });
      await processIceCandidateQueue();
      return answer;
    } catch (error) {
      console.error("📞 useWebRTC: Error handling offer:", error);
      onError?.({ code: "OFFER_HANDLE_ERROR", message: "Failed to handle WebRTC offer", originalError: error });
      throw error;
    }
  }, [callId, remoteUserId, socket, onError, processIceCandidateQueue]);

  // ─── Handle incoming answer (initiator only) ────────────────────────────────
  const handleAnswer = useCallback(async (answer) => {
    try {
      if (!_peerConnection) throw new Error("Peer connection not initialized");
      console.log("📞 useWebRTC: Handling incoming answer");
      await _peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: answer })
      );
      // Write to BOTH
      _remoteDescriptionSet = true;
      remoteDescriptionSetRef.current = true;

      await processIceCandidateQueue();
    } catch (error) {
      console.error("📞 useWebRTC: Error handling answer:", error);
      onError?.({ code: "ANSWER_HANDLE_ERROR", message: "Failed to handle WebRTC answer", originalError: error });
      throw error;
    }
  }, [onError, processIceCandidateQueue]);

  // ─── Handle incoming ICE candidate ──────────────────────────────────────────
  const handleIceCandidate = useCallback(async (candidate) => {
    try {
      if (!_peerConnection || !_remoteDescriptionSet) {
        console.log("📞 useWebRTC: Queuing ICE candidate");
        _iceCandidateQueue.push(candidate);
        return;
      }
      await _peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("📞 useWebRTC: ICE candidate added");
    } catch (error) {
      console.warn("📞 useWebRTC: Error adding ICE candidate:", error);
    }
  }, []);

  // ─── Audio / video toggles ──────────────────────────────────────────────────
  const setAudioEnabled = useCallback((enabled) => {
    _localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    console.log("📞 useWebRTC: Audio enabled:", enabled);
  }, []);

  const setVideoEnabled = useCallback((enabled) => {
    _localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
    console.log("📞 useWebRTC: Video enabled:", enabled);
  }, []);

  // ─── Full cleanup — resets ALL module vars ──────────────────────────────────
  const cleanup = useCallback(() => {
    console.log("📞 useWebRTC: Cleaning up");
    _localStream?.getTracks().forEach((t) => {
      t.stop();
      console.log("📞 useWebRTC: Stopped track:", t.kind);
    });
    if (_peerConnection) {
      _peerConnection.ontrack = null;
      _peerConnection.onicecandidate = null;
      _peerConnection.onconnectionstatechange = null;
      _peerConnection.close();
    }
    // Reset ALL module vars
    _peerConnection = null;
    _localStream = null;
    _remoteStream = null;
    _iceCandidateQueue = [];
    _remoteDescriptionSet = false;
    _isInitialized = false;

    // Reset refs too
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    iceCandidateQueueRef.current = [];
    remoteDescriptionSetRef.current = false;
    isInitializedRef.current = false;

    setIsConnected(false);
    setConnectionState("closed");
    console.log("📞 useWebRTC: Cleanup complete");
  }, []);

  // ─── Main initialize ────────────────────────────────────────────────────────
  const initialize = useCallback(async () => {
    if (_isInitialized) {
      console.log("📞 useWebRTC: Already initialized, skipping");
      return;
    }
    console.log("📞 useWebRTC: Initializing...", { callType, isInitiator, callId });
    try {
      await getLocalStream();
      await createPeerConnection();
      if (isInitiator) {
        await createOffer();
      }
      // Write to BOTH
      _isInitialized = true;
      isInitializedRef.current = true;
      console.log("📞 useWebRTC: Initialization complete");
    } catch (error) {
      console.error("📞 useWebRTC: Initialization failed:", error);
      cleanup();
      throw error;
    }
  }, [getLocalStream, createPeerConnection, createOffer, isInitiator, callType, callId, cleanup]);

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
    isConnected,
    connectionState,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
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
    peerConnectionRef,
    localStreamRef,
    remoteStreamRef,
  };
};

export default useWebRTC;