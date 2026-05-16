// Centralized App Configuration
// This file contains all app-wide constants that can be easily updated

export const APP_NAME = "SpringsCircle";

// Get the base URL for the current environment
export const getBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_CLIENT_URL) {
    return import.meta.env.VITE_CLIENT_URL;
  }
  
  // In production, use the window location origin
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  // Default to localhost for development
  return window.location.origin;
};

// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_SERVER || 'http://localhost:5000',
  clientUrl: getBaseUrl(),
  timeout: 30000,
};

// Additional app configuration
export const APP_CONFIG = {
  name: APP_NAME,
  version: "1.0.0",
  // Notification polling interval (ms)
  notificationPollInterval: 30000,
  // WebSocket reconnection settings
  socketReconnection: {
    attempts: 5,
    delay: 2000,
  },
};
