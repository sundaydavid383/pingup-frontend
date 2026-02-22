import { useContext, useCallback } from "react";
import { CallContext } from "../context/CallContext";

/**
 * useCall Hook
 * 
 * Provides call functionality to any component:
 * - initiateAudioCall()
 * - initiateVideoCall()
 * - acceptCall()
 * - rejectCall()
 * - endCall()
 * 
 * Usage:
 * const { initiateVideoCall, acceptCall } = useCall();
 * 
 * // Start a video call
 * <button onClick={() => initiateVideoCall(userId, userName, userImage)}>
 *   Call
 * </button>
 */

const useCall = () => {
  const callContext = useContext(CallContext);

  if (!callContext) {
    console.error("useCall must be used within CallProvider");
    return {};
  }

  const initiateAudioCall = useCallback(
    (receiverId, receiverName, receiverImage = null) => {
      return callContext.initiateCall(
        receiverId,
        receiverName,
        callContext.CALL_TYPES.AUDIO,
        receiverImage
      );
    },
    [callContext]
  );

  const initiateVideoCall = useCallback(
    (receiverId, receiverName, receiverImage = null) => {
      return callContext.initiateCall(
        receiverId,
        receiverName,
        callContext.CALL_TYPES.VIDEO,
        receiverImage
      );
    },
    [callContext]
  );

  const acceptCall = useCallback(() => {
    return callContext.acceptCall();
  }, [callContext]);

  const rejectCall = useCallback((reason = "declined") => {
    return callContext.rejectCall(reason);
  }, [callContext]);

  const endCall = useCallback(() => {
    return callContext.endCall();
  }, [callContext]);

  const hasActiveCall = useCallback(() => {
    return callContext.hasActiveCall();
  }, [callContext]);

  return {
    // Call actions
    initiateAudioCall,
    initiateVideoCall,
    acceptCall,
    rejectCall,
    endCall,

    // State accessors
    currentCall: callContext.currentCall,
    hasActiveCall,
    callState: callContext.getCallStatus(),
    CALL_STATES: callContext.CALL_STATES,
    CALL_TYPES: callContext.CALL_TYPES,

    // Utils
    callHistory: callContext.callHistory,
    callError: callContext.callError
  };
};

export default useCall;
