// utils/flattenBible.js
// Adapted for JSON like: [{ abbrev: "gn", chapters: [["verse1", "verse2"], ...] }]
export function flattenBible(bible) {
  const verses = [];
  const bookChapterMap = {};
  const invertedIndex = {};

  let id = 0;

  for (const book of bible) {
    const bookName = book.abbrev || book.book_name || "Unknown";

    for (let c = 0; c < book.chapters.length; c++) {
      const chapterNum = c + 1;
      const chapterVerses = book.chapters[c];

      for (let v = 0; v < chapterVerses.length; v++) {
        const verseNum = v + 1;
        const textRaw = chapterVerses[v];
        if (!textRaw || !textRaw.trim()) continue;

        // Keep original text (important for Scripture Assistant quality)
        let text = textRaw.trim();

        // Remove structured annotations like {word:note}
        text = text.replace(/\{[^}]*:[^}]*}/g, "").trim();

        // Normalize for search
        const normalized = text
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ");

        const tokens = normalized
          .split(/\s+/)
          .filter(Boolean);

        const entry = {
          id,
          book: bookName,
          chapter: chapterNum,
          verse: verseNum,
          text,
          tokens,              // ✅ THIS FIXES YOUR ERROR
        };

        verses.push(entry);

        bookChapterMap[`${bookName}|${chapterNum}|${verseNum}`] = id;

        // Build inverted index
        for (const token of tokens) {
          if (!invertedIndex[token]) invertedIndex[token] = [];
          invertedIndex[token].push(id);
        }

        id++;
      }
    }
  }

  return { verses, invertedIndex, bookChapterMap };
}
