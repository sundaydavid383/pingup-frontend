// src/hooks/useMediaQuery.js
import { useEffect, useState } from "react";

export default function useMediaQuery(query) {
  const getMatches = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false;

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);

    // modern browsers
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);

    // initial sync (optional)
    setMatches(mq.matches);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [query]);

  return matches;
}
