// src/hooks/useIntersectionObserver.js
import { useEffect } from "react";

export const useIntersectionObserver = ({ containerRef, messages, onVisible }) => {
  useEffect(() => {
    if (!containerRef.current || !messages?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.id;
            if (id) onVisible(id);
          }
        });
      },
      { root: containerRef.current, threshold: 0.6 }
    );

    const msgEls = containerRef.current.querySelectorAll("[data-id]");
    msgEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages]);
};
