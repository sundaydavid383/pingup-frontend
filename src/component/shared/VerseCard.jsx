import { Play, Pause, Clipboard, Check } from "lucide-react";
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
    rounded-2xl
    px-7
    py-6
    border
    cursor-pointer
    transition-all
    duration-300
    ease-out
    hover:-translate-y-[3px]
  "
  style={{
    background: 'linear-gradient(160deg, var(--form-bg), var(--bg-light))',
    borderColor: 'rgba(255,255,255,0.08)',
    boxShadow: '0 2px 10px -4px rgba(0,0,0,0.4)',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = 'rgba(var(--primary-rgb),0.4)';
    e.currentTarget.style.boxShadow = '0 20px 40px -16px rgba(var(--primary-rgb),0.35), 0 2px 10px -4px rgba(0,0,0,0.4)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
    e.currentTarget.style.boxShadow = '0 2px 10px -4px rgba(0,0,0,0.4)';
  }}
>

      {/* Accent bar */}
      <div
        className="
          verse-accent
          absolute
          left-0
          top-5
          bottom-5
          w-[3px]
          rounded-full
        "
        style={{
          background: 'linear-gradient(180deg, var(--primary), var(--hover-dark))',
          boxShadow: '0 0 12px rgba(var(--primary-rgb),0.5)',
        }}
      />

      {/* Decorative quotation mark */}
      <span
        aria-hidden="true"
        className="absolute top-2 right-5 select-none pointer-events-none"
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: '3.5rem',
          lineHeight: 1,
          color: 'var(--primary)',
          opacity: 0.08,
        }}
      >
        "
      </span>

      {/* Reference */}
      <div className="flex items-center gap-2.5 mb-3 pl-1">
        <p
          className="verse-reference text-[11px] font-semibold uppercase"
          style={{
            color: 'var(--primary)',
            letterSpacing: '0.14em',
          }}
        >
          {book} {chapter}:{verseNo}
        </p>
        <span
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(90deg, rgba(var(--primary-rgb),0.35), transparent)' }}
        />
      </div>

      {/* Verse text */}
      <div className="flex flex-col pl-1">
        <p
          className="text-[15.5px] leading-[1.7] transition-colors duration-300 group-hover:text-white"
          style={{
            color: 'var(--text-secondary)',
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 400,
          }}
        >
          {text}
        </p>

        {isFirst && (
          <button
            className="mt-4 w-11 h-11 flex items-center justify-center rounded-full text-white relative z-10 transition-all duration-200 hover:scale-[1.08] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--hover-dark))',
              boxShadow: '0 8px 22px -6px rgba(var(--primary-rgb),0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
            onClick={(e) =>{ e.stopPropagation();onToggleSpeak(verse)}}
            title={ttsPlaying ? "Pause" : "Play"}
          >
            {ttsPlaying ? <Pause size={19} /> : <Play size={19} className="ml-0.5" />}
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
    bottom-4
    right-4
    w-9
    h-9
    flex
    items-center
    justify-center
    rounded-full
    transition-all
    duration-200
    z-10
    hover:scale-110
    active:scale-95
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-white/40
  "
  style={{
    background: copied ? 'rgba(var(--primary-rgb),0.16)' : 'rgba(255,255,255,0.04)',
    color: copied ? 'var(--primary)' : 'var(--text-muted)',
    border: `1px solid ${copied ? 'rgba(var(--primary-rgb),0.35)' : 'rgba(255,255,255,0.08)'}`,
  }}
>
  {copied ? <Check size={15} /> : <Clipboard size={15} />}
</button>

    </div>
  );
};

export default VerseCard;