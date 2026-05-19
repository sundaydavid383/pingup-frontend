import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import "leaflet/dist/leaflet.css";
import { ClerkProvider } from '@clerk/clerk-react';
import { HelmetProvider } from "react-helmet-async";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from './context/SocketContext.jsx';
import { MessageProvider } from "./context/MessageContext";
import { MessageSeenProvider } from "../MessageSeenContext";
import { ThemeProvider } from './context/ThemeContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { AudioPlayerProvider } from "./context/AudioPlayerContext";
import { GlobalVideoProvider } from "./context/GlobalVideoContext";
import { TTSProvider } from "./context/TTSContext";
import { CallProvider } from "./context/CallContext";
import { PipModalProvider } from "./context/PipModalContext";
import { TaskTableProvider } from './context/TaskTableContext';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <TTSProvider>
        <NotificationProvider>
          <MessageProvider>
            <AuthProvider>
              <SocketProvider>
                <CallProvider>
                  <MessageSeenProvider>
                    <ThemeProvider>
                      <BrowserRouter>
                        <AudioPlayerProvider>
                          <GlobalVideoProvider>
                            <PipModalProvider>
                              <TaskTableProvider>
                                <App />
                              </TaskTableProvider>
                            </PipModalProvider>
                          </GlobalVideoProvider>
                        </AudioPlayerProvider>
                      </BrowserRouter>
                    </ThemeProvider>
                  </MessageSeenProvider>
                </CallProvider>
              </SocketProvider>
            </AuthProvider>
          </MessageProvider>
        </NotificationProvider>
      </TTSProvider>
    </ClerkProvider>
  </HelmetProvider>
);
