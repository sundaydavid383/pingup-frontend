// Verse.jsx — styled version
// Functionality: UNTOUCHED. Only inline styles replaced with CSS classes.
// Add this import to your component:  import "../../styles/verse.css"

import { useState } from "react";
import axiosBase from "../../utils/axiosBase";
import useVerseVisibility from "../../hooks/useVerseVisibility";
import "../../styles/verse.css"; // ← add this import

export default function Verse({ verse, isChapterVerse, handleVerseSeen }) {
  const [selectedText, setSelectedText] = useState("");

  const ref = useVerseVisibility(
    () => {
      if (isChapterVerse) {
        document
          .getElementById(`v-${verse.book}-${verse.chapter}-${verse.verse}`)
          ?.classList.add("verse-visible");
      }
    },
    (timeSpent) => {
      if (isChapterVerse) {
        document
          .getElementById(`v-${verse.book}-${verse.chapter}-${verse.verse}`)
          ?.classList.remove("verse-visible");
        handleVerseSeen(verse, timeSpent);
      }
    }
  );

  const renderText = verse.text.replace(/\{.*?\}/g, "");

  const handleMouseUp = () => {
    const selection = window.getSelection().toString().trim();
    setSelectedText(selection);
  };

  const handleSaveHighlight = async () => {
    if (!selectedText) return;

    try {
      await axiosBase.post("/api/user/highlight", {
        verse: {
          book: verse.book,
          chapter: verse.chapter,
          verse: verse.verse,
          text: selectedText,
        },
      });
      alert("Verse highlighted successfully!");
      setSelectedText("");
    } catch (err) {
      console.error("Error saving highlight:", err);
    }
  };

  const handleRandomVerseClick = () => {
    if (!isChapterVerse) {
      window.dispatchEvent(
        new CustomEvent("go-to-verse", {
          detail: {
            book: verse.book,
            chapter: verse.chapter,
            verse: verse.verse,
          },
        })
      );
    }
  };

  const safeBookId = verse.book.replace(/\s+/g, "-").toLowerCase();

  return (
    <div
      id={`v-${safeBookId}-${verse.chapter}-${verse.verse}`}
      className={`verse-text-paragraph ${isChapterVerse ? "chapter-verse" : "random-verse"}`}
      ref={isChapterVerse ? ref : null}
      onClick={handleRandomVerseClick}
      onMouseUp={handleMouseUp}
    >
      {/* Reference badge — random/discovery mode only */}
      {!isChapterVerse && (
        <div className="verse-reference-badge">
          {verse.book} {verse.chapter}:{verse.verse}
        </div>
      )}

      <div className="flex">
        {isChapterVerse && (
          <span className="verse-label">{verse.verse}</span>
        )}
        <div>{renderText}</div>
      </div>

      {/* Save highlight button */}
      {selectedText && (
        <button
          className="verse-save-highlight-btn"
          onClick={handleSaveHighlight}
        >
          Save Highlight
        </button>
      )}
    </div>
  );
}
