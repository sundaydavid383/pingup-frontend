import React, { createContext, useContext, useState, useCallback } from 'react';

const PipModalContext = createContext(null);

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
    setActiveChatId(userId);
    setPipOpen(true);
  }, []);

  const closePipModal = useCallback(() => {
    setPipOpen(false);
    setActiveChatId(null);
    setActiveChatHistory([]);
    setChatId(null);
    setDraft("");
    setImage(null);
    setAudioURL(null);
    setRecording(false);
    setRecordTime(0);
    setAudioLevel(0);
    setAudioStream(null);
    setIsAtBottom(true);
    setChatLoading(false);
    setMediaViewerOpen(false);
    setMediaInitialIndex(0);
    setChatImages([]);
  }, []);

  const value = {
    // State
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
    // Actions
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
