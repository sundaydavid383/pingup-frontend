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

const CHAPTER_WORDS = ["chapter", "chap", "chaptar", "chaper", "after", "matter"];
const VERSE_WORDS = ["verse", "vers", "vass", "versee", "fas", "fars", "vurz"];
const TO_WORDS = ["to", "til", "two", "-", "tu", "tuh"];
const FILLERS = ["the", "and", "of", "a", "matter"];
const NUM_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, ate: 8, aight: 8, too: 2, tu: 2
};


function fuzzyMatch(input, candidates) {
  if (!input) return null;
  input = normalize(input);
  let best = null;
  let score = 0;

  candidates.forEach(c => {
    const namesToCheck = [c.name, ...(c.aliases || [])];
    for (const nRaw of namesToCheck) {
      const n = normalize(nRaw);
      if (n === input) { 
        best = c; 
        score = 1; 
        break; 
      } else if (n.includes(input) || input.includes(n)) {
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
  const hasChapterWord = words.some(w => CHAPTER_WORDS.includes(w));
  const hasVerseWord = words.some(w => VERSE_WORDS.includes(w));


  // 1️⃣ Detect book explicitly mentioned
  let book = null;
  let bookMentioned = false;
  let bookIndex  = -1;
  for (let i = 0; i < words.length; i++) {
    const b = fuzzyMatch(words[i], assets.bibleBooks2);
    if (b) {
      book = b;
      bookMentioned = true;
      bookIndex  = i;
      break;
    }
  }

  // 2️⃣ Parse chapter & verses (numbers only if preceded by chapter/verse words)
  let chapter = null;
  let startVerse = null;
  let endVerse = null;
  let numbersFound = 0; 

 if (bookMentioned) {
  let expectingEndVerse = false;


// 1️⃣ First: scan words immediately after the book
for (let i = bookIndex + 1; i < words.length; i++) {
  const w = words[i];

  // Handle range keyword FIRST
  if (TO_WORDS.includes(w)) {
    if (numbersFound === 0) break; // invalid: "john to 5"
    expectingEndVerse = true;
    continue;
  }

  // Now try to parse number
  const n = NUM_WORDS[w] ?? Number(w);
  if (Number.isNaN(n)) break; // stop at first non-number

  numbersFound++;

  if (chapter === null) {
    chapter = n;
  } else if (startVerse === null) {
    startVerse = n;
  } else if (expectingEndVerse) {
    endVerse = n;
    break;
  }
}


  // Minimal fallback
  if (startVerse != null && endVerse == null) endVerse = startVerse;

  // 2️⃣ Only run keyword-based loop if first loop didn't find all numbers
  if (numbersFound < 2) {
    for (let i = 0; i < words.length; i++) {
      const w = words[i];

      // Chapter
      if (CHAPTER_WORDS.includes(w) && i + 1 < words.length) {
        const n = NUM_WORDS[words[i + 1]] ?? Number(words[i + 1]);
        if (!isNaN(n)) chapter = chapter ?? n;
        i++; continue;
      }

      // Verse
      if (VERSE_WORDS.includes(w) && i + 1 < words.length) {
        const n = NUM_WORDS[words[i + 1]] ?? Number(words[i + 1]);
        if (!isNaN(n)) startVerse = startVerse ?? n;
        i++; continue;
      }

      // Range (to)
      if (TO_WORDS.includes(w) && i + 1 < words.length) {
        const n = NUM_WORDS[words[i + 1]] ?? Number(words[i + 1]);
        if (!isNaN(n)) endVerse = endVerse ?? n;
        i++; continue;
      }
    }
  }
}


const hasDirectReference = numbersFound >= 2 || hasChapterWord || hasVerseWord;

// ✅ Fill missing numbers from context or fallbacks
if (bookMentioned && hasDirectReference) {
  // Fill from context if needed
  if (chapter === null && context.currentChapter) chapter = context.currentChapter;
  if (chapter !== null && startVerse === null && context.currentVerse) startVerse = context.currentVerse;
  if (chapter !== null && startVerse !== null && endVerse === null) endVerse = startVerse;

  // Minimal safety check: we must have at least chapter or verse
  if (chapter === null && startVerse === null) return null;

  return {
    book,
    chapter: chapter ?? 1,
    startVerse: startVerse ?? 1,
    endVerse: endVerse ?? startVerse ?? 1
  };
}
// Fallback for single "verse N" or "chapter N" without book
if (!book && (hasVerseWord || hasChapterWord)) {
  book = context.currentBook ?? null;

  // Extract the number
  for (let i = 0; i < words.length; i++) {
    const n = NUM_WORDS[words[i]] ?? Number(words[i]);
    if (!isNaN(n)) {
     if (hasVerseWord) startVerse = n;
     else if (hasChapterWord) chapter = n;

      break;
    }
  }

  // Fallbacks if missing
  if (!chapter && startVerse) chapter = context.currentChapter;
  if (!startVerse && chapter) startVerse = 1;
  if (!endVerse && startVerse) endVerse = startVerse;

  return {
    book,
    chapter,
    startVerse,
    endVerse
  };
}

return null;

}