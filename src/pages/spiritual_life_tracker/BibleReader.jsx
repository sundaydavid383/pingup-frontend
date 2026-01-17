// BibleReader.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import bible from "../../data/en_kjv.json";
import { flattenBible } from "../../utils/flattenBible";

import { FaSearch, FaBook, FaRocketchat, FaSlidersH} from "react-icons/fa";
import "./biblereader.css";
import CustomSelect from "../../component/shared/CustomSelect";
import axiosBase from "../../utils/axiosBase";
import Verse from "../../component/shared/Verse"
import Fuse from "fuse.js";
import { useSwipeable } from "react-swipeable"; //
import ChapterTTS from "../../component/shared/ChapterTTS";
import BibleControls from "../../component/shared/BibleControls";
import "../../styles/biblecontrols.css"
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
  const [ttsSpeed, setTtsSpeed] = useState(0.7);
  const [moodSearchQuery, setMoodSearchQuery] = useState("");
  const [seeControls, setSeeControls] = useState(false)

  const touchStartX = React.useRef(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [progress, setProgress] = useState(0);
  const fuseRef = useRef(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const searchRef = useRef(null);
  const [selectorsVisible, setSelectorsVisible] = useState(false);
  const selectorsRef = useRef(null);
  const [pendingHighlight, setPendingHighlight] = useState(null);
  const touchStartY = useRef(0);



  const { book, chapter, verse } = useParams();



  const normalizeBookName = (input) => {
    if (!input) return null;

    const key = input.toLowerCase().replace(/\s+/g, "");
    return BOOK_FULL_NAMES[key] || input;
  };



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
        const topVerses = [];
        const seenBookChapters = new Set();

        // ---------- PASS 1: enforce different book+chapter ----------
        for (let v of sorted) {
          const key = `${v.book}:${v.chapter}`;

          if (seenBookChapters.has(key)) continue;

          const fullVerse = allVerses.find(
            vv =>
              vv.book === v.book &&
              vv.chapter === v.chapter &&
              vv.verse === v.verse
          );

          if (fullVerse) {
            topVerses.push(fullVerse);
            seenBookChapters.add(key);
          }

          if (topVerses.length === 3) break;
        }

        // ---------- PASS 2: relax rule if needed ----------
        if (topVerses.length < 3) {
          for (let v of sorted) {
            const alreadyPicked = topVerses.some(
              tv =>
                tv.book === v.book &&
                tv.chapter === v.chapter &&
                tv.verse === v.verse
            );

            if (alreadyPicked) continue;

            const fullVerse = allVerses.find(
              vv =>
                vv.book === v.book &&
                vv.chapter === v.chapter &&
                vv.verse === v.verse
            );

            if (fullVerse) {
              topVerses.push(fullVerse);
            }

            if (topVerses.length === 3) break;
          }
        }


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

  // combining verses to create a chapter text
  const buildChapterText = () => {
    if (!displayedVerses.length) return "";

    return displayedVerses
      .map(v => v.text)
      .join(" ");
  };



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
    setSearchVisible(false)

    // Small delay to allow loading bar to show (UX polish)
    setTimeout(() => {
      const results = fuseRef.current.search(searchQuery.trim());
      const query = searchQuery.trim().toLowerCase();

      const ranked = results
        .map((r) => {
          const text = r.item.text.toLowerCase();
          const book = r.item.book.toLowerCase();

          let boost = 0;

          // Exact phrase match → strongest signal
          if (text.includes(query)) boost -= 0.15;

          // Book name relevance
          if (book.includes(query)) boost -= 0.1;

          // Slight preference for shorter verses
          boost += Math.min(text.length / 1000, 0.1);

          return {
            ...r.item,
            _score: r.score + boost,
          };
        })
        .sort((a, b) => a._score - b._score);

      setSearchResults(ranked.slice(0, 20));
      setIsSearching(false);
    }, 300);
  };

  useEffect(() => {
    if (!allVerses.length) return;
    if (!book || !chapter || !verse) return;

    const normalizedBook = normalizeBookName(book);

    setSelectedBookName(normalizedBook);
    setSelectedChapterNumber(Number(chapter));

    const chapterVerses = allVerses.filter(
      (v) => v.book === normalizedBook && v.chapter === Number(chapter)
    );

    setDisplayedVerses(chapterVerses);

    if (verse) {
      setPendingHighlight({
        book: normalizedBook,
        chapter: Number(chapter),
        verse: Number(verse)
      });
    }
  }, [allVerses, book, chapter, verse]);



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
    exitSearchMode();
    setSelectedBookName(bookName);
    setSelectedChapterNumber(1);
    displayChapterVerses(bookName, 1);
  };
  // 🔴 Exit search mode and return to reading mode
  const exitSearchMode = () => {
    setSearchResults([]);
    setHasSearched(false);
    setSearchQuery("");
  };

  const handleChapterSelection = (chapterNumber) => {
    exitSearchMode();
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
        newChapter = 1;
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
    exitSearchMode();
    setSelectedBookName(newBook);
    setSelectedChapterNumber(newChapter);
    // update displayed verses
    displayChapterVerses(newBook, newChapter);
  };

  let speechBlocked = false;

  const navigateChapter = (direction) => {
    speechBlocked = true;
    window.speechSynthesis.cancel();
    moveChapter(direction);

    setTimeout(() => {
      speechBlocked = false;
    }, 300);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!selectedBookName) return;

      if (e.key === "ArrowRight") {
        navigateChapter("next");
      }

      if (e.key === "ArrowLeft") {
        window.speechSynthesis.cancel();
        navigateChapter("prev");
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
      setPendingHighlight({ book, chapter, verse });
    };

    window.addEventListener("go-to-verse", handler);
    return () => window.removeEventListener("go-to-verse", handler);
  }, [allVerses]);

  useEffect(() => {
    if (!pendingHighlight || !displayedVerses.length) return;

    const { book, chapter, verse } = pendingHighlight;
    const safeBookId = book.replace(/\s+/g, "-").toLowerCase();

    // Wait until the verse exists in the DOM
    const interval = setInterval(() => {
      const el = document.getElementById(`v-${safeBookId}-${chapter}-${verse}`);
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("verse-highlight");

      setTimeout(() => el.classList.remove("verse-highlight"), 3000);

      clearInterval(interval);
      setPendingHighlight(null);
    }, 50);

    return () => clearInterval(interval);
  }, [pendingHighlight, displayedVerses]);


  const controlsRef = useRef(null);
  const ttsRef = useRef(null);

  // Close BibleControls if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        controlsRef.current &&
        !controlsRef.current.contains(event.target)
      ) {
        setSeeControls(false); // ✅ hide the controls
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchVisible(false);
      }
    };


    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [controlsRef]);







  return (
    <div className="bible-reader-container">
      <div className="bible-reader-inner">
        {/* --- Replace your fixed-header block with this --- */}
        <div className="fixed-header">
          <div className="header-inner">
            {/* Left: Title */}
            <h2 className="bible-title"><span>Bible</span> <span>Reader</span></h2>

            {/* Center: Chapter */}
            {selectedBookName && (
              <div className="chapter-center flex items-center gap-3">
                <span className="text-[var(--hover-light)]">
                  {selectedBookName} {selectedChapterNumber}
                </span>
              </div>
            )}


            {/* Right: Search & Selectors */}
            <div className="header-right">
              {/* Search Dropdown */}
              <div className="search-container" ref={searchRef}>
                <FaSearch
                  className="search-toggle-icon"
                  onClick={() => setSearchVisible(prev => !prev)}
                />
                {searchVisible && (
                  <div className="search-dropdown">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search scripture, book, or phrase"
                      className="bible-search-input"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                    />
                    <button
                      onClick={() => handleSearchClick()}
                    >
                      Search
                    </button>
                    {/* Loading bar appears inside dropdown */}
                    {isSearching && (
                      <div className="search-loading-bar">
                        <div className="search-loading-progress" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Book/Chapter Selectors */}
              <div className="selectors-container" ref={selectorsRef}>
                <FaBook
                  className="selectors-toggle-icon"
                  onClick={() => setSelectorsVisible(prev => !prev)}
                />
                {selectorsVisible && (
                  <div className="selectors-dropdown">
                    <CustomSelect
                      options={bookNames}
                      value={selectedBookName}
                      onChange={handleBookSelection}
                      placeholder="Book"
                    />
                    {selectedBookName && (
                      <CustomSelect
                        options={Array.from({ length: maximumChapterNumber }, (_, i) => i + 1)}
                        value={selectedChapterNumber}
                        onChange={handleChapterSelection}
                        placeholder="Chapter"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>




        {isReadingChapter && <>
          <ChapterTTS
            ref={ttsRef}
            text={buildChapterText()}
            speed={ttsSpeed}
            progress={progress}
            setProgress={setProgress} />

            {!seeControls && <div 
            onClick={()=>setSeeControls(prev=>!prev)}
            className="bible_controls_toggler">
              <FaSlidersH/>
            </div>
         }
         {seeControls && <div ref={controlsRef}>
          <BibleControls
            ttsSpeed={ttsSpeed}
            setTtsSpeed={setTtsSpeed}
            // moodSearchQuery={moodSearchQuery}
            // setMoodSearchQuery={setMoodSearchQuery}
            // handleSearchClick={handleSearchClick}
            progress={progress}
            setProgress={setProgress}
            ttsRef={ttsRef}
          /></div>}
        </>}

        <div
          className="verses-container"
          onTouchStart={(e) => {
            if (!selectedBookName) return;
            const touch = e.touches[0];
            touchStartX.current = touch.clientX;
            touchStartY.current = touch.clientY; // add vertical reference
          }}
          onTouchEnd={(e) => {
            if (!selectedBookName) return;
            const touch = e.changedTouches[0];
            const diffX = touchStartX.current - touch.clientX;
            const diffY = touchStartY.current - touch.clientY;

            // Only consider horizontal swipe if horizontal movement is bigger than vertical
            if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
              if (diffX > 0) navigateChapter("next");
              else navigateChapter("prev");
            }
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
          ) : searchResults.length > 0 && hasSearched ? (
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

    </div>
  );


}
