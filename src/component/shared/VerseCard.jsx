import { Play, Pause , Clipboard, Check} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


const VerseCard = ({
  verse,
  index,
  isFirst,
  ttsPlaying,
  onToggleSpeak,
}) => {
  const { book, chapter, verse: verseNo, text } = verse;
  const [copied, setCopied] = useState(false)

  const handleCopy = async ()=>{
    const copyText = `${book} ${chapter}:${verseNo}\n\n${text}`;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(()=>setCopied(false), 1500)
    } catch (err) {
        console.error("Copy failed", err)
    }
  }
const navigate = useNavigate();

const handleNavigateToVerse = () => {
  const bookSlug = book.toLowerCase().replace(/\s+/g, "");
  navigate(`/bible/${bookSlug}/${chapter}/${verseNo}`);
};

  return (
<div
  onClick={handleNavigateToVerse}
  className="
    verse-card
    group
    relative
    w-full
    max-w-[650px]
    min-h-[120px]
    rounded-xl
    px-6
    py-5
    shadow-sm
    border
    border-white/10
    bg-[var(--bg-card)]
    transition-[var(--transition-default)]
    hover:shadow-md
    hover:border-[var(--primary)]
  "
>

      {/* Accent bar */}
      <div
        className="
          verse-accent
          absolute
          left-0
          top-4
          bottom-4
          w-[3px]
          rounded-full
          bg-[var(--primary)]
        "
      />

      {/* Reference */}
      <p
        className="
          verse-reference
          mb-1
          text-[11px]
          font-medium
          tracking-wider
          uppercase
        "
      >
        {book} {chapter}:{verseNo}
      </p>

      {/* Verse text */}
      <div className="flex flex-col">
        <p className="text-[15px] leading-relaxed text-[var(--secondary)] font-normal transition-[var(--transition-default)] group-hover:text-[var(--white)]">
          {text}
        </p>

        {isFirst && (
          <button
            className="mt-3 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg hover:bg-indigo-700 transition-[var(--transition-default)] relative z-10"
            onClick={(e) =>{ e.stopPropagation();onToggleSpeak(verse)}}
            title={ttsPlaying ? "Pause" : "Play"}
          >
            {ttsPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        )}
      </div>
      <button
    onClick={(e) => {
    e.stopPropagation();
    handleCopy();
  }}
  title="Copy verse"
  className="
    absolute
    bottom-3
    right-3
    w-9
    h-9
    flex
    items-center
    justify-center
    rounded-full
    bg-white/5
    text-[var(--secondary)]
    hover:bg-[var(--primary)]
    hover:text-white
    transition-[var(--transition-default)]
    z-10
  "
>
  {copied ? <Check size={16} /> : <Clipboard size={16} />}
</button>

    </div>
  );
};

export default VerseCard;
