import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";

const TTSContext = createContext(null);

export const TTSProvider = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const speakingRef = useRef(false);
  const processingRef = useRef(false);

  const startSpeaking = useCallback(() => {
    speakingRef.current = true;
    setIsSpeaking(true);
  }, []);

  const stopSpeaking = useCallback(() => {
    speakingRef.current = false;
    setIsSpeaking(false);
    // Also cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const startProcessing = useCallback(() => {
    processingRef.current = true;
    setIsProcessing(true);
  }, []);

  const stopProcessing = useCallback(() => {
    processingRef.current = false;
    setIsProcessing(false);
  }, []);

  // Check if voice input should be blocked
  const shouldBlockVoice = speakingRef.current || processingRef.current;

  // Listen for page unload to stop TTS
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <TTSContext.Provider
      value={{
        isSpeaking,
        isProcessing,
        speakingRef,
        processingRef,
        shouldBlockVoice,
        startSpeaking,
        stopSpeaking,
        startProcessing,
        stopProcessing,
      }}
    >
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error("useTTS must be used within a TTSProvider");
  }
  return context;
};

export default TTSContext;
