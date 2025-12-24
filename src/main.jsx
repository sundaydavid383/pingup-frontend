import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import "leaflet/dist/leaflet.css";
import { ClerkProvider } from '@clerk/clerk-react';
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
);

// ======= Service Worker Logging =======
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('✅ Service Worker registered:', reg);

      // Listen for updates
      reg.onupdatefound = () => {
        console.log('ℹ️ Service Worker update found');
        const newWorker = reg.installing;
        newWorker.onstatechange = () => {
          console.log('ℹ️ New worker state:', newWorker.state);
        };
      };
    }).catch(err => {
      console.error('❌ Service Worker registration failed:', err);
    });
  });

  // Listen for controlling worker changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker controlling page changed.');
  });
}
