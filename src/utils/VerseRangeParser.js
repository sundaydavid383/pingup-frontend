// VerseRangeParser.js
import assets from "../assets/assets"; // bibleBooks2 array

const normalize = (s) => {
  if (typeof s !== "string") return "";
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const CHAPTER_WORDS = [
  "chapter", "chaptar", "chaper", "after", "matte", "chapt", "chap", "afterch"
];
const VERSE_WORDS = [
  "verse", "vers", "vass", "versee", "fas", "fars", "vurz"
];
const TO_WORDS = ["to", "til", "two", "-", "tu", "tuh"];
const FILLERS = ["the", "and", "of", "a", "after", "matter"];
const NUM_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20,
  ate: 8, aight: 8, too: 2, tu: 2
};

function fuzzyMatch(input, candidates) {
  if (!input) return null;
  input = normalize(input);
  let best = null;
  let score = 0;

  candidates.forEach(c => {
    // Ensure c is a book object with name and aliases
    const namesToCheck = [c.name, ...(c.aliases || [])];
    for (const nRaw of namesToCheck) {
      const n = normalize(nRaw);
      if (n === input) { 
        best = c; 
        score = 1; 
        break; 
      } 
      else if (n.includes(input) || input.includes(n)) {
        if (0.7 > score) { 
          best = c; 
          score = 0.7; 
        }
      }
    }
  });

  return best;
}


export function parseVerseRange(input, context = {}) {
  if (!input) return null;

  const words = normalize(input).split(" ").filter(w => !FILLERS.includes(w));
  if (!words.length) return null;

  let book = null;
  for (let i = 0; i < words.length; i++) {
    book = fuzzyMatch(words[i], assets.bibleBooks2);
    if (book) break;
  }
  if (!book) book = context.currentBook; // fallback to current context

  let chapter = null;
  let startVerse = null;
  let endVerse = null;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (CHAPTER_WORDS.includes(w) && i + 1 < words.length) {
      const n = NUM_WORDS[words[i + 1]] || Number(words[i + 1]);
      if (!isNaN(n)) chapter = n;
      i++; continue;
    }

    if (VERSE_WORDS.includes(w) && i + 1 < words.length) {
      const n = NUM_WORDS[words[i + 1]] || Number(words[i + 1]);
      if (!isNaN(n)) startVerse = n;
      i++; continue;
    }

    if (TO_WORDS.includes(w) && i + 1 < words.length) {
      const n = NUM_WORDS[words[i + 1]] || Number(words[i + 1]);
      if (!isNaN(n)) endVerse = n;
      i++; continue;
    }

    const n = NUM_WORDS[w] || Number(w);
    if (!isNaN(n)) {
      if (!chapter) chapter = n;
      else if (!startVerse) startVerse = n;
      else if (!endVerse) endVerse = n;
    }
  }

  // Defaults with context fallback
  if (chapter && startVerse && !endVerse) endVerse = startVerse;
  if (chapter && !startVerse && !endVerse) startVerse = endVerse = 1;
  if (!book && context.currentBook) book = context.currentBook;
  if (!chapter && context.currentChapter) chapter = context.currentChapter;
if (!book && !context.currentBook) return null;
if (!chapter && !context.currentChapter) return null;

return {
  book: book || context.currentBook,
  chapter: chapter || context.currentChapter,
  startVerse: startVerse || context.currentVerse || 1,
  endVerse: endVerse || startVerse || context.currentVerse || 1
};

}
