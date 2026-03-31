import React, { createContext, useContext, useState, useCallback } from 'react';

const PipModalContext = createContext(null);

/**
 * PipModalProvider - Manages the global PIP (Picture-in-Picture) chat modal state.
 *
 * The PIP is a floating chat window that appears when a user clicks on a recent
 * message in the right sidebar. State is simple:
 * - pipOpen: whether the PIP is visible
 * - activeChatId: which user's chat is shown in the PIP
 * - openPipModal(userId): opens the PIP for a user
 * - closePipModal(): closes the PIP and resets all chat state
 */
export const PipModalProvider = ({ children }) => {
  const [pipOpen, setPipOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatHistory, setActiveChatHistory] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioStream, setAudioStream] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaInitialIndex, setMediaInitialIndex] = useState(0);
  const [chatImages, setChatImages] = useState([]);

  const openPipModal = useCallback((userId) => {
    console.group("🚀 [PipModalContext] openPipModal()");
    console.log("→ Entering openPipModal()", { userId });
    console.log("📋 Setting activeChatId to:", userId);
    setActiveChatId(userId);
    console.log("📋 Setting pipOpen to: true");
    setPipOpen(true);
    console.log("✅ openPipModal() complete — pipOpen=true, activeChatId=", userId);
    console.groupEnd();
  }, []);

  const closePipModal = useCallback(() => {
    console.group("🛑 [PipModalContext] closePipModal()");
    console.log("→ Entering closePipModal()");
    console.log("📋 Resetting all PiP state to defaults...");
    setPipOpen(false);
    console.log("  ✓ pipOpen = false");
    setActiveChatId(null);
    console.log("  ✓ activeChatId = null");
    setActiveChatHistory([]);
    console.log("  ✓ activeChatHistory = []");
    setChatId(null);
    console.log("  ✓ chatId = null");
    setDraft("");
    console.log("  ✓ draft = ''");
    setImage(null);
    console.log("  ✓ image = null");
    setAudioURL(null);
    console.log("  ✓ audioURL = null");
    setRecording(false);
    console.log("  ✓ recording = false");
    setRecordTime(0);
    console.log("  ✓ recordTime = 0");
    setAudioLevel(0);
    console.log("  ✓ audioLevel = 0");
    setAudioStream(null);
    console.log("  ✓ audioStream = null");
    setIsAtBottom(true);
    console.log("  ✓ isAtBottom = true");
    setChatLoading(false);
    console.log("  ✓ chatLoading = false");
    setMediaViewerOpen(false);
    console.log("  ✓ mediaViewerOpen = false");
    setMediaInitialIndex(0);
    console.log("  ✓ mediaInitialIndex = 0");
    setChatImages([]);
    console.log("  ✓ chatImages = []");
    console.log("✅ closePipModal() complete — all state reset");
    console.groupEnd();
  }, []);

  const value = {
    pipOpen,
    activeChatId,
    activeChatHistory,
    setActiveChatHistory,
    chatId,
    setChatId,
    draft,
    setDraft,
    image,
    setImage,
    audioURL,
    setAudioURL,
    recording,
    setRecording,
    recordTime,
    setRecordTime,
    audioLevel,
    setAudioLevel,
    audioStream,
    setAudioStream,
    isAtBottom,
    setIsAtBottom,
    chatLoading,
    setChatLoading,
    mediaViewerOpen,
    setMediaViewerOpen,
    mediaInitialIndex,
    setMediaInitialIndex,
    chatImages,
    setChatImages,
    openPipModal,
    closePipModal,
  };

  return (
    <PipModalContext.Provider value={value}>
      {children}
    </PipModalContext.Provider>
  );
};

export const usePipModal = () => {
  const context = useContext(PipModalContext);
  if (!context) {
    throw new Error('usePipModal must be used within a PipModalProvider');
  }
  return context;
};

export default PipModalContext;
