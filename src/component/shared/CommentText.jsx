// CommentText.jsx
import { useState } from "react";
import DOMPurify from "dompurify";

export default function CommentText({ text, isEdited, maxChars = 150 }) {
  const [expanded, setExpanded] = useState(false);

  // Check if text is too long
  const isLong = text.length > maxChars;
  const displayedText = !expanded && isLong ? text.slice(0, maxChars) + "..." : text;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 text-[.74rem] break-words">
        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayedText) }} />
        {isEdited && (
          <span className="text-[.65rem] text-gray-400 italic ml-1">edited</span>
        )}
      </div>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-500 hover:underline mt-1 self-start"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
