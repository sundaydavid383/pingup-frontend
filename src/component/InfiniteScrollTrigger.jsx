import { useEffect, useRef } from "react";

/**
 * Very small trigger element that calls onReachBottom when near viewport.
 * threshold lowered to 0.6 so it fires before the very bottom and avoids race conditions.
 */
export default function InfiniteScrollTrigger({ onReachBottom, enabled = true }) {
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        if (ent?.isIntersecting) {
          onReachBottom();
        }
      },
      { threshold: 0.6 } // fire when 60% of the trigger is visible
    );

    if (triggerRef.current) observer.observe(triggerRef.current);

    return () => observer.disconnect();
  }, [enabled, onReachBottom]);

  // tiny height so it sits at the bottom, but IntersectionObserver sees it reliably
  return <div ref={triggerRef} style={{ height: "40px", display: "block" }} />;
}
