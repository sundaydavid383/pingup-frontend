import { useState } from "react";
import axiosBase from "../../utils/axiosBase";
import useVerseVisibility from "../../hooks/useVerseVisibility"

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

  // Remove all text in curly brackets
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
      setSelectedText(""); // Clear selection after saving
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
  style={{
    position: "relative",
    padding: !isChapterVerse ? "1rem" : undefined,
    cursor: !isChapterVerse ? "pointer" : "default",
  }}
  onClick={handleRandomVerseClick}
  onMouseUp={handleMouseUp}
>

      {!isChapterVerse && (
        <div
          style={{
            display: "inline-block",
            padding: "0.25rem 0.5rem",
            marginBottom: "0.5rem",
            background: "rgba(255, 215, 0, 0.1)", // light gold
            color: "var(--gold)",
            fontWeight: "700",
            borderRadius: "6px",
            boxShadow: "0 3px 6px rgba(0,0,0,0.3)",
          }}
        >
          {verse.book} {verse.chapter}:{verse.verse}
        </div>
      )}
      <div className="flex">
      {isChapterVerse && <span className="verse-label">{verse.verse}</span>}

      <div>{renderText}</div>
      </div>

      {/* Save highlight button */}
      {selectedText && (
        <button
          onClick={handleSaveHighlight}
          style={{
            marginTop: "0.5rem",
            background: "var(--primary)",
            color: "#fff",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save Highlight
        </button>
      )}
    </div>
  );
}

