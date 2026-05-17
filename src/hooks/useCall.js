import { useContext, useCallback } from "react";
import { CallContext } from "../context/CallContext";

const useCall = () => {
  const callContext = useContext(CallContext);

  if (!callContext) {
    console.error("useCall must be used within CallProvider");
    return {};
  }

  const initiateAudioCall = useCallback(
    (receiverId, receiverName, receiverImage = null) => {
      const manager = callContext.callManagerRef?.current;
      if (manager) {
        return manager.initiateCall(
          receiverId,
          receiverName,
          callContext.CALL_TYPES.AUDIO,
          receiverImage
        );
      }
      console.warn("⚠️ useCall: callManager not ready yet");
    },
    [callContext]
  );

  const initiateVideoCall = useCallback(
    (receiverId, receiverName, receiverImage = null) => {
      const manager = callContext.callManagerRef?.current;
      if (manager) {
        return manager.initiateCall(
          receiverId,
          receiverName,
          callContext.CALL_TYPES.VIDEO,
          receiverImage
        );
      }
      console.warn("⚠️ useCall: callManager not ready yet");
    },
    [callContext]
  );

  const acceptCall = useCallback(() => {
    const manager = callContext.callManagerRef?.current;
    if (manager) return manager.acceptCall();
  }, [callContext]);

  const rejectCall = useCallback((reason = "declined") => {
    const manager = callContext.callManagerRef?.current;
    if (manager) return manager.rejectCall(reason);
  }, [callContext]);

  const endCall = useCallback(() => {
    const manager = callContext.callManagerRef?.current;
    if (manager) return manager.endCall();
  }, [callContext]);

  const hasActiveCall = useCallback(() => {
    return callContext.hasActiveCall();
  }, [callContext]);

  return {
    initiateAudioCall,
    initiateVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    currentCall: callContext.currentCall,
    hasActiveCall,
    callState: callContext.getCallStatus(),
    CALL_STATES: callContext.CALL_STATES,
    CALL_TYPES: callContext.CALL_TYPES,
    callHistory: callContext.callHistory,
    callError: callContext.callError,
  };
};

export default useCall;