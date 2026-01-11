// CommandProcessor.js
import { parseVerseRange } from "./VerseRangeParser";

export function processCommand(input, context = {}) {
  const cmd = input.toLowerCase().trim();

  // Navigation keywords
  if (cmd === "next") {
    return {
      type: "navigation",
      action: "nextVerse"
    };
  }
  if (cmd === "previous" || cmd === "prev") {
    return {
      type: "navigation",
      action: "prevVerse"
    };
  }

  // Detect structured verse/chapter command
  const range = parseVerseRange(input, context);
  if (range) {
    // Determine if full range or just chapter/verse jump
    if (range.startVerse === 1 && range.endVerse === 1 && !input.match(/verse/)) {
      // only chapter specified
      return {
        type: "navigation",
        action: "jumpChapter",
        book: range.book,
        chapter: range.chapter
      };
    } else {
      return {
        type: "navigation",
        action: "jumpVerse",
        book: range.book,
        chapter: range.chapter,
        verse: range.startVerse
      };
    }
  }

  // Not a command
  return { type: "search", query: input };
}
