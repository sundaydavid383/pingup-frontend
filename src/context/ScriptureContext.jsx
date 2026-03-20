// ScriptureContext.jsx - Global Scripture State for Hybrid Modal/Page
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ScriptureContext = createContext(null);

// Provider component
export const ScriptureProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Scripture state
  const [scriptureState, setScriptureState] = useState({
    reference: null,        // Current verse reference (e.g., "John 3:16")
    verseData: null,         // Loaded verse content
    isModalOpen: false,      // Modal mode active
    isFullPage: false,       // Full page mode (vs modal)
    originRoute: null,       // Where it was opened from
    scrollPosition: 0,       // Scroll position for restoration
    isLoading: false,        // Loading state
    highlightedVerse: null,   // Currently highlighted verse
  });

  // Track origin route when scripture is opened
  useEffect(() => {
    if (scriptureState.reference && !scriptureState.originRoute) {
      setScriptureState(prev => ({
        ...prev,
        originRoute: location.pathname
      }));
    }
  }, [scriptureState.reference, location.pathname]);

  // Check if we're on a scripture route
  const isScriptureRoute = location.pathname.startsWith('/scriptures') || 
                           location.pathname.startsWith('/bible');

  // Update scripture state
  const updateScriptureState = useCallback((updates) => {
    setScriptureState(prev => ({ ...prev, ...updates }));
  }, []);

  // Open scripture (can be modal or full page)
  const openScripture = useCallback((reference, options = {}) => {
    const { mode = 'modal', fullPage = false } = options;
    
    // Save scroll position before navigating
    if (window.scrollY > 0) {
      setScriptureState(prev => ({
        ...prev,
        scrollPosition: window.scrollY
      }));
    }

    if (fullPage || !isScriptureRoute) {
      // Navigate to full page
      navigate(`/scriptures?ref=${encodeURIComponent(reference)}`);
      setScriptureState({
        reference,
        verseData: null,
        isModalOpen: false,
        isFullPage: true,
        originRoute: location.pathname,
        scrollPosition: 0,
        isLoading: true,
        highlightedVerse: null,
      });
    } else {
      // Open as modal (within current page)
      setScriptureState({
        reference,
        verseData: null,
        isModalOpen: true,
        isFullPage: false,
        originRoute: location.pathname,
        scrollPosition: 0,
        isLoading: true,
        highlightedVerse: null,
      });
    }
  }, [navigate, location.pathname, isScriptureRoute]);

  // Close scripture (back to previous state)
  const closeScripture = useCallback(() => {
    // Restore scroll position
    if (scriptureState.scrollPosition > 0) {
      window.scrollTo(0, scriptureState.scrollPosition);
    }

    if (scriptureState.isFullPage) {
      // Navigate back to origin
      navigate(scriptureState.originRoute || '/');
    }

    setScriptureState(prev => ({
      ...prev,
      isModalOpen: false,
      isFullPage: false,
    }));
  }, [navigate, scriptureState.scrollPosition, scriptureState.originRoute, scriptureState.isFullPage]);

  // Toggle between modal and full page
  const toggleFullPage = useCallback(() => {
    if (scriptureState.isFullPage) {
      // Switch to modal
      navigate(-1); // Go back one level
      setScriptureState(prev => ({
        ...prev,
        isFullPage: false,
        isModalOpen: true,
      }));
    } else {
      // Switch to full page
      navigate(`/scriptures?ref=${encodeURIComponent(scriptureState.reference || '')}`);
      setScriptureState(prev => ({
        ...prev,
        isFullPage: true,
        isModalOpen: false,
      }));
    }
  }, [navigate, scriptureState.isFullPage, scriptureState.reference]);

  // Navigate to specific verse within current reference
  const navigateToVerse = useCallback((verseRef) => {
    setScriptureState(prev => ({
      ...prev,
      highlightedVerse: verseRef,
    }));
  }, []);

  // Clear scripture state
  const resetScriptureState = useCallback(() => {
    setScriptureState({
      reference: null,
      verseData: null,
      isModalOpen: false,
      isFullPage: false,
      originRoute: null,
      scrollPosition: 0,
      isLoading: false,
      highlightedVerse: null,
    });
  }, []);

  const value = {
    scriptureState,
    updateScriptureState,
    openScripture,
    closeScripture,
    toggleFullPage,
    navigateToVerse,
    resetScriptureState,
    isScriptureRoute,
  };

  return (
    <ScriptureContext.Provider value={value}>
      {children}
    </ScriptureContext.Provider>
  );
};

// Custom hook for convenience
export const useScripture = () => {
  const context = useContext(ScriptureContext);
  if (!context) {
    throw new Error('useScripture must be used within a ScriptureProvider');
  }
  return context;
};

export default ScriptureContext;
