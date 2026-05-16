import { useEffect, useRef } from "react";

/**
 * Very small trigger element that calls onReachBottom when near viewport.
 * threshold lowered to 0.6 so it fires before the very bottom and avoids race conditions.
 */
export default function InfiniteScrollTrigger({ onReachBottom, enabled = true, root = null }) {
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
      { threshold: 0.6, root: root || null }
    );

    if (triggerRef.current) observer.observe(triggerRef.current);

    return () => observer.disconnect();
  }, [enabled, onReachBottom, root]);

  return <div ref={triggerRef} style={{ height: "40px", display: "block" }} />;
}
