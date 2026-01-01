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
import { ThemeProvider } from './context/ThemeContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <MessageProvider>
        <NotificationProvider>
          <AuthProvider>
            <SocketProvider>
              <ThemeProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </ThemeProvider>
            </SocketProvider>
          </AuthProvider>
        </NotificationProvider>
      </MessageProvider>
    </ClerkProvider>
  </HelmetProvider>
);
