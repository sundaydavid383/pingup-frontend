// BibleReader.jsx
import React, { useState, useEffect, useRef } from "react";
import bible from "../../data/en_kjv.json";
import { flattenBible } from "../../utils/flattenBible";
import "./biblereader.css";
import CustomSelect from "../../component/shared/CustomSelect";
import useVerseVisibility from "../../hooks/useVerseVisibility";
import axiosBase from "../../utils/axiosBase";
import Verse from "../../component/shared/Verse"
import Fuse from "fuse.js";
import { useSwipeable } from "react-swipeable"; //
// Map of short names or abbreviations to full book names
const BOOK_FULL_NAMES = {
  gn: "Genesis",
  ex: "Exodus",
  lv: "Leviticus",
  nm: "Numbers",
  dt: "Deuteronomy",
  js: "Joshua",
  jud: "Judges",
  rt: "Ruth",
  "1sm": "1 Samuel",
  "2sm": "2 Samuel",
  "1kgs": "1 Kings",
  "2kgs": "2 Kings",
  "1ch": "1 Chronicles",
  "2ch": "2 Chronicles",
  ezr: "Ezra",
  ne: "Nehemiah",
  et: "Esther",
  job: "Job",
  ps: "Psalms",
  prv: "Proverbs",
  ec: "Ecclesiastes",
  so: "Song of Solomon",
  is: "Isaiah",
  jr: "Jeremiah",
  lm: "Lamentations",
  ez: "Ezekiel",
  dn: "Daniel",
  ho: "Hosea",
  jl: "Joel",
  am: "Amos",
  ob: "Obadiah",
  jn: "Jonah",
  mi: "Micah",
  na: "Nahum",
  hk: "Habakkuk",
  zp: "Zephaniah",
  hg: "Haggai",
  zc: "Zechariah",
  ml: "Malachi",
  mt: "Matthew",
  mk: "Mark",
  lk: "Luke",
  jo: "John",
  act: "Acts",
  rm: "Romans",
  "1co": "1 Corinthians",
  "2co": "2 Corinthians",
  gl: "Galatians",
  eph: "Ephesians",
  ph: "Philippians",
  cl: "Colossians",
  "1ts": "1 Thessalonians",
  "2ts": "2 Thessalonians",
  "1tm": "1 Timothy",
  "2tm": "2 Timothy",
  tt: "Titus",
  phm: "Philemon",
  hb: "Hebrews",
  jm: "James",
  "1pe": "1 Peter",
  "2pe": "2 Peter",
  "1jo": "1 John",
  "2jo": "2 John",
  "3jo": "3 John",
  jd: "Jude",
  re: "Revelation",
};


export default function BibleReader() {
  const [allVerses, setAllVerses] = useState([]);
  const [bookNames, setBookNames] = useState([]);
  const [selectedBookName, setSelectedBookName] = useState("");
  const [selectedChapterNumber, setSelectedChapterNumber] = useState(1);
  const [displayedVerses, setDisplayedVerses] = useState([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [verseSeen, setVerseSeen] = useState([]);
  const touchStartX = React.useRef(0);
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);
const [hasSearched, setHasSearched] = useState(false);
const fuseRef = useRef(null);


  useEffect(() => {
    const fetchVerseSeenData = async () => {
      try {

        const response = await axiosBase.get("/api/user/getUserVerseSeen")
        const verseSeenData = response?.data?.verseSeen;
        console.log("Fetched verse seen data:", response);
        setVerseSeen(verseSeenData);
      }
      catch (err) {
        console.error("Error fetching verse seen data:", err);
      }
    }
    fetchVerseSeenData();
  }, []);

  // Initialize flattened Bible and first 3 random verses
  useEffect(() => {
    const { verses } = flattenBible(bible);

    const versesWithFullNames = verses.map((v) => ({
      ...v,
      book: BOOK_FULL_NAMES[v.book] || v.book,
    }));

    setAllVerses(versesWithFullNames);

    const uniqueBooks = [...new Set(versesWithFullNames.map((v) => v.book))];
    setBookNames(uniqueBooks);

    const displayThreeVerses = () => {
      if (verseSeen?.length) {
        // Sort history by totalTimeSeen
        const sorted = [...verseSeen].sort(
          (a, b) => b.totalTimeSeen - a.totalTimeSeen
        );

        // Map top seen verses to full verse objects
        const topVerses = sorted
          .map((v) =>
            versesWithFullNames.find(
              (vv) =>
                vv.book === v.book &&
                vv.chapter === v.chapter &&
                vv.verse === v.verse
            )
          )
          .filter(Boolean);

        // If less than 3, fill with random
        if (topVerses.length >= 3) return topVerses.slice(0, 3);
        return [
          ...topVerses,
          ...getRandomVerses(3 - topVerses.length, versesWithFullNames, topVerses),
        ];
      } else {
        return getRandomVerses(3, versesWithFullNames);
      }
    };

    setDisplayedVerses(displayThreeVerses());
  }, [verseSeen]);

  // Initialize Fuse.js for fuzzy search
useEffect(() => {
  if (allVerses.length) {
    fuseRef.current = new Fuse(allVerses, {
      keys: ["text", "book"],
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 3,
    });
  }
}, [allVerses]);

// Trigger search on button click
const handleSearchClick = () => {
  if (!searchQuery.trim() || !fuseRef.current) return;

  setIsSearching(true);
  setHasSearched(true);
  setSearchResults([]);

  // Small delay to allow loading bar to show (UX polish)
  setTimeout(() => {
    const results = fuseRef.current.search(searchQuery.trim());
    const verses = results.map((r) => r.item);

    setSearchResults(verses.slice(0, 20));
    setIsSearching(false);
  }, 300);
};



  // Helper to pick random verses excluding an optional "exclude" array
  const getRandomVerses = (count, versesArray, exclude = []) => {
    const result = [];
    const available = versesArray.filter((v) =>
      !exclude.some((ex) => ex.book === v.book && ex.chapter === v.chapter && ex.verse === v.verse)
    );

    for (let i = 0; i < count; i++) {
      if (!available.length) break;
      const randomIndex = Math.floor(Math.random() * available.length);
      result.push(available[randomIndex]);
      available.splice(randomIndex, 1); // remove picked verse
    }

    return result;
  };


  const handleBookSelection = (bookName) => {
    setSelectedBookName(bookName);
    setSelectedChapterNumber(1);
    displayChapterVerses(bookName, 1);
  };

  const handleChapterSelection = (chapterNumber) => {
    setSelectedChapterNumber(chapterNumber);
    displayChapterVerses(selectedBookName, chapterNumber);
  };

  const displayChapterVerses = (bookName, chapterNumber) => {
    setIsLoadingVerses(true);

    const chapterVerses = allVerses.filter(
      (v) => v.book === bookName && v.chapter === chapterNumber
    );

    setDisplayedVerses(chapterVerses);

    setTimeout(() => setIsLoadingVerses(false), 300);
  };



  const maximumChapterNumber = selectedBookName
    ? Math.max(
      ...allVerses
        .filter((v) => v.book === selectedBookName)
        .map((v) => v.chapter)
    )
    : 1;

  // Move to next or previous chapter/book
  // Move to next or previous chapter/book — now updates state and logs
  const moveChapter = (direction) => {
    if (!selectedBookName) {
      console.debug("moveChapter: no selectedBookName (we're on random view) - ignoring");
      return;
    }

    const bookIndex = bookNames.indexOf(selectedBookName);
    if (bookIndex === -1) {
      console.warn("moveChapter: selectedBookName not found in bookNames", selectedBookName);
      return;
    }

    let newBook = selectedBookName;
    let newChapter = selectedChapterNumber;

    if (direction === "next") {
      if (selectedChapterNumber < maximumChapterNumber) {
        newChapter = selectedChapterNumber + 1;
      } else if (bookIndex < bookNames.length - 1) {
        newBook = bookNames[bookIndex + 1];
        // compute last chapter of next book
        newChapter = Math.max(...allVerses.filter(v => v.book === newBook).map(v => v.chapter));
        // ensure we go to chapter 1 if something weird occurs
        if (!newChapter || newChapter < 1) newChapter = 1;
      } else {
        console.debug("moveChapter: already at last book and last chapter");
        return;
      }
    } else if (direction === "prev") {
      if (selectedChapterNumber > 1) {
        newChapter = selectedChapterNumber - 1;
      } else if (bookIndex > 0) {
        newBook = bookNames[bookIndex - 1];
        newChapter = Math.max(...allVerses.filter(v => v.book === newBook).map(v => v.chapter));
        if (!newChapter || newChapter < 1) newChapter = 1;
      } else {
        console.debug("moveChapter: already at first book and first chapter");
        return;
      }
    } else {
      console.warn("moveChapter: unknown direction", direction);
      return;
    }

    console.debug("moveChapter ->", { from: `${selectedBookName} ${selectedChapterNumber}`, to: `${newBook} ${newChapter}` });

    // IMPORTANT: update selection state so UI reflects change
    setSelectedBookName(newBook);
    setSelectedChapterNumber(newChapter);
    // update displayed verses
    displayChapterVerses(newBook, newChapter);
  };


  useEffect(() => {
    const handleKey = (e) => {
      if (!selectedBookName) return; // only navigate when reading a chapter
      if (e.key === "ArrowRight") {
        console.debug("keydown -> ArrowRight");
        moveChapter("next");
      }
      if (e.key === "ArrowLeft") {
        console.debug("keydown -> ArrowLeft");
        moveChapter("prev");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedBookName, selectedChapterNumber, allVerses, bookNames]); // include bookNames & allVerses


  const handleVerseSeen = async (verse, timeSpent) => {
    try {
      await axiosBase.post("/api/user/verse-seen", {
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        timeSpent
      });
    } catch (err) {
      console.error("Error saving verse seen:", err);
    }
  };
  const isReadingChapter = !!selectedBookName;


useEffect(() => {
  const handler = (e) => {
    const { book, chapter, verse } = e.detail;

    // 🔴 EXIT SEARCH MODE
    setSearchResults([]);
    setHasSearched(false);
    setSearchQuery("");

    // ✅ Update selectors
    setSelectedBookName(book);
    setSelectedChapterNumber(chapter);

    // ✅ Load chapter verses
    const chapterVerses = allVerses.filter(
      (v) => v.book === book && v.chapter === chapter
    );

    setDisplayedVerses(chapterVerses);

    // ✅ Scroll to exact verse
    setTimeout(() => {
      const el = document.getElementById(`v-${book}-${chapter}-${verse}`);
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        el.classList.add("verse-visible");
      }
    }, 300);
  };

  window.addEventListener("go-to-verse", handler);
  return () => window.removeEventListener("go-to-verse", handler);
}, [allVerses]);








  return (
    <div className="bible-reader-container">
      {/* --- Replace your fixed-header block with this --- */}
     <div className="fixed-header">
  <h2 className="bible-title">Bible Reader</h2>

  {/* Search Bar */}
<div className="search-bar-container">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search for a verse..."
    className="bible-search-input"
  />
  <button onClick={handleSearchClick} className="bible-search-button">
    Search
  </button>
</div>


  {/* Book & Chapter selectors */}
  <div className="selectors">
    <CustomSelect
      options={bookNames}
      value={selectedBookName}
      onChange={handleBookSelection}
      placeholder="Select Book"
    />
    {selectedBookName && (
      <CustomSelect
        options={Array.from({ length: maximumChapterNumber }, (_, index) => index + 1)}
        value={selectedChapterNumber}
        onChange={handleChapterSelection}
        placeholder="Select Chapter"
      />
    )}
  </div>
</div>



      {/* Display verses */}
      {isSearching && (
  <div className="search-loading-bar">
    <div className="search-loading-progress" />
  </div>
)}
     
<div
  className="verses-container"
  onTouchStart={(e) => {
    if (selectedBookName) touchStartX.current = e.touches[0].clientX;
  }}
  onTouchEnd={(e) => {
    if (!selectedBookName) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) moveChapter("next");
    else if (diff < -50) moveChapter("prev");
  }}
>
  {isLoadingVerses ? (
    <div className="verse-skeleton-wrapper">
      {[1, 2, 3, 5, 6, 7, 8].map((i) => (
        <div key={i} className="verse-skeleton">
          <div className="skeleton-line short"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      ))}
    </div>
  ) : searchResults.length > 0 ? (
    // Search results (Verse component styling preserved)
    searchResults.map((v, index) => (
      <Verse
        key={`${v.book}-${v.chapter}-${v.verse}-search-${index}`}
        verse={v}
        isChapterVerse={false}
        handleVerseSeen={handleVerseSeen}
      />
    ))
  ) : hasSearched && !isSearching ? (
    // No search results message
    <p className="text-gray-400 text-center py-8">
      No results found for “{searchQuery}”
    </p>
  ) : displayedVerses.length > 0 ? (
    // Normal chapter / random verses
    displayedVerses.map((v, index) => (
      <Verse
        key={
          isReadingChapter
            ? `${v.book}-${v.chapter}-${v.verse}`
            : `${v.book}-${v.chapter}-${v.verse}-${index}`
        }
        verse={v}
        isChapterVerse={isReadingChapter}
        handleVerseSeen={handleVerseSeen}
      />
    ))
  ) : (
    <p className="text-gray-400 text-center py-8">No verses to display</p>
  )}
</div>



    </div>
  );


}
