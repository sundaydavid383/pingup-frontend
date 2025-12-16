import { useEffect, useRef } from "react";

export default function useVerseVisibility(onEnter, onLeave) {
  const elementRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Verse enters viewport
            startTimeRef.current = Date.now();
            timerRef.current = requestAnimationFrame(trackTime);

            onEnter();
          } else {
            // Verse leaves viewport
            if (startTimeRef.current) {
              const seconds =
                (Date.now() - startTimeRef.current) / 1000;

              cancelAnimationFrame(timerRef.current);
              onLeave(seconds);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) observer.unobserve(elementRef.current);
      cancelAnimationFrame(timerRef.current);
    };
  }, []);

  const trackTime = () => {
    timerRef.current = requestAnimationFrame(trackTime);
  };

  return elementRef;
}
