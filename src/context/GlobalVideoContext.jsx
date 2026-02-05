import React, { createContext, useContext, useState, useEffect} from "react";
import { useLocation } from "react-router-dom";

const GlobalVideoContext = createContext();

// ✅ Provider component
export const GlobalVideoProvider = ({ children }) => {
const [videoState, setVideoState] = useState({
  src: null,
  poster: null,
  currentTime: 0,
  playing: false,
  muted: false,
  volume: 1,
  inlineRef: null,
  isDetached: false,   // floating modal active
  originRoute: null,   // where it started
});
// ✅ Create the context

const location = useLocation();
useEffect(() => {
  if (!videoState.originRoute && videoState.src) {
    setVideoState(prev => ({
      ...prev,
      originRoute: location.pathname
    }));
  }
}, [location.pathname, videoState.src]);


  const updateVideoState = (updates) => {
    setVideoState((prev) => ({ ...prev, ...updates }));
  };

  const resetVideoState = () => {
    setVideoState({
      src: null,
      poster: null,
      currentTime: 0,
      playing: false,
      muted: false,
      volume: 1,
      originRoute: "/",
      inlineRef: null
    });
  };

  return (
    <GlobalVideoContext.Provider value={{ videoState, updateVideoState, resetVideoState }}>
      {children}
    </GlobalVideoContext.Provider>
  );
};

// ✅ Custom hook for convenience
export const useGlobalVideo = () => useContext(GlobalVideoContext);
