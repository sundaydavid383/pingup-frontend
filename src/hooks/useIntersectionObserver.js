import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for observing when elements enter the viewport
 * This is a simplified implementation using the native Intersection Observer API
 */
const useIntersectionObserver = ({ 
  containerRef, 
  messages, 
  onVisible,
  threshold = 0.5 
}) => {
  const observerRef = useRef(null);

  const observeMessages = useCallback(() => {
    if (!containerRef.current || !onVisible) return;

    // Disconnect previous observer if exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const container = containerRef.current;
    
    // Create new intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              onVisible(messageId);
            }
          }
        });
      },
      {
        root: container,
        threshold: threshold
      }
    );

    // Get all message elements in the container
    const messageElements = container.querySelectorAll('[data-message-id]');
    messageElements.forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, onVisible, threshold]);

  useEffect(() => {
    // Wait for messages to render
    const timeoutId = setTimeout(() => {
      observeMessages();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [observeMessages, messages]);
};

export default useIntersectionObserver;
