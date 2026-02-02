// processCommand.js
import { parseVerseRange } from "./VerseRangeParser";

const NAV_WORDS = ["next", "previous", "prev", "back"];

export function processCommand(input, context = {}) {
  if (!input || typeof input !== "string") return { type: "none" };

  const cmd = input.toLowerCase().trim();

  // 1️⃣ Hard navigation commands
  if (NAV_WORDS.includes(cmd)) {
    return {
      type: "navigation",
      action: cmd === "next" ? "nextVerse" : "prevVerse"
    };
  }

  // 2️⃣ Try structured verse/chapter parsing
  const range = parseVerseRange(cmd, context);

  if (range) {
    // Decide type: chapter jump vs verse jump
const bookId = typeof range.book === "object" ? range.book.abbrev : range.book;

if (range.startVerse && range.startVerse !== 1) {
  return {
    type: "navigation",
    action: "jumpVerse",
    book: bookId,
    chapter: range.chapter,
    verse: range.startVerse
  };
}

// Chapter jump
return {
  type: "navigation",
  action: "jumpChapter",
  book: bookId,
  chapter: range.chapter
};
  }

  // 3️⃣ If no book/chapter mentioned → treat as search
  return {
    type: "search",
    query: input
  };
}