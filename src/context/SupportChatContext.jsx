import { createContext, useContext, useState } from 'react';

const SupportChatContext = createContext();

export const SupportChatProvider = ({ children }) => {
  const [supportOpen, setSupportOpen] = useState(false);
  return (
    <SupportChatContext.Provider value={{ supportOpen, setSupportOpen }}>
      {children}
    </SupportChatContext.Provider>
  );
};

export const useSupportChat = () => useContext(SupportChatContext);