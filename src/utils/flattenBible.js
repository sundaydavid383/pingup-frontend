// adapted for JSON like: [{ abbrev: "gn", chapters: [["verse1", "verse2", ...], [...]] }]
export function flattenBible(bible) {
  const verses = [];
  const bookChapterMap = {};
  const invertedIndex = {};

  let id = 0;

  for (const book of bible) {
    const bookName = book.abbrev || book.book_name || "Unknown";
    console.log("Bible book abbrev:", bookName);

    for (let c = 0; c < book.chapters.length; c++) {
      const chapterNum = c + 1; // chapter index → 1-based
      const chapterVerses = book.chapters[c];

      for (let v = 0; v < chapterVerses.length; v++) {
        const verseNum = v + 1; // verse index → 1-based
        const textRaw = chapterVerses[v];
        if (!textRaw || !textRaw.trim()) continue;

        let text = textRaw.trim();

        // Remove any text inside [], {}, ()
        text = text.replace(/\[\]|\{\}|\(\)/g, "").trim();

        const entry = {
          id,
          book: bookName,
          chapter: chapterNum,
          verse: verseNum,
          text,
        };

        verses.push(entry);
        bookChapterMap[`${bookName}|${chapterNum}|${verseNum}`] = id;

        // build inverted index
        const words = text
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "") // remove other punctuation
          .split(/\s+/)
          .filter(Boolean);

        for (const w of words) {
          if (!invertedIndex[w]) invertedIndex[w] = [];
          invertedIndex[w].push(id);
        }

        id++;
      }
    }
  }

  return { verses, invertedIndex, bookChapterMap };
}
