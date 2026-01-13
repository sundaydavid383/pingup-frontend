// utils/CommandProcessor.js
import { parseVerseRange } from "./VerseRangeParser";

const NAV_WORDS = ["next", "previous", "prev", "back"];

export function processCommand(input, context = {}) {
  if (!input || typeof input !== "string") {
    return { type: "none" };
  }

  const cmd = input.toLowerCase().trim();

  // 1️⃣ Hard navigation commands (highest priority)
  if (NAV_WORDS.includes(cmd)) {
    return {
      type: "navigation",
      action: cmd === "next" ? "nextVerse" : "prevVerse"
    };
  }

  // 2️⃣ Try structured verse/chapter parsing
  const range = parseVerseRange(cmd, context);

  if (range) {
    // Verse jump
    if (range.startVerse) {
      return {
        type: "navigation",
        action: "jumpVerse",
        book: range.book,
        chapter: range.chapter,
        verse: range.startVerse
      };
    }

    // Chapter jump
    return {
      type: "navigation",
      action: "jumpChapter",
      book: range.book,
      chapter: range.chapter
    };
  }

  // 3️⃣ Not a command → allow search
  return {
    type: "search",
    query: input
  };
}
