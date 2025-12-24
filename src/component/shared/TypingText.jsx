import React, { useEffect, useState } from "react";

export default function TypingText({ text, speed = 50, style={} }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText(""); // reset when text changes
    let index = 0;

    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index)); // slice ensures no characters are skipped
      if (index >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <p style={style}>{displayedText}</p>;
}
