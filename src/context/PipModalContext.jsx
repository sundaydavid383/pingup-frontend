import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const PipModalContext = createContext(null);

const initialPipState = {
  pipOpen: false,
  activeChatId: null,
  activeChatHistory: [],
  chatId: null,
  chatLoading: false,
};

export const PipModalProvider = ({ children }) => {
  const [pipState, setPipState] = useState(initialPipState);

 const setActiveChatHistory = useCallback((historyOrUpdater) => {
  setPipState((prev) => ({
    ...prev,
    activeChatHistory: typeof historyOrUpdater === 'function'
      ? historyOrUpdater(Array.isArray(prev.activeChatHistory) ? prev.activeChatHistory : [])
      : (Array.isArray(historyOrUpdater) ? historyOrUpdater : []),
  }));
}, []);

  const setChatId = useCallback((id) => {
    setPipState((prev) => ({ ...prev, chatId: id }));
  }, []);

  const setChatLoading = useCallback((loading) => {
    setPipState((prev) => ({ ...prev, chatLoading: loading }));
  }, []);

 const openPipModal = useCallback((userId) => {
    setPipState((prev) => {
      if (prev.pipOpen && prev.activeChatId === userId) {
        return { ...prev, pipOpen: true };
      }
      return { ...initialPipState, pipOpen: true, activeChatId: userId };
    });
}, []);

  const closePipModal = useCallback(() => {
    setPipState(initialPipState);
  }, []);

  const { pipOpen, activeChatId, activeChatHistory, chatId, chatLoading } = pipState;

  const value = useMemo(() => ({
    pipOpen,
    activeChatId,
    activeChatHistory,
    chatId,
    chatLoading,
    setActiveChatHistory,
    setChatId,
    setChatLoading,
    openPipModal,
    closePipModal,
  }), [
    pipOpen,
    activeChatId,
    activeChatHistory,
    chatId,
    chatLoading,
    setActiveChatHistory,
    setChatId,
    setChatLoading,
    openPipModal,
    closePipModal,
  ]);

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
