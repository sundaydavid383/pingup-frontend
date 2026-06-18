import { useState, useEffect, useMemo } from "react";
import { Trash2, SendHorizonal, X, Smile } from "lucide-react";

const QUICK_EMOJIS = ["😀", "😂", "😍", "👍", "🙏", "🔥", "🎉", "😢", "😮", "❤️"];

/**
 * PROPS:
 * image: File | null
 * setImage: (file: File | null) => void
 * caption: string
 * setCaption: (text: string) => void
 * onSend: () => void   <-- must take NO arguments
 * sending: boolean
 */
export default function ImageComposer({ image, setImage, caption, setCaption, onSend, sending }) {
  const [showViewer, setShowViewer] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  // Create the preview URL once per image, and revoke it when it changes/unmounts
  const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!image || !previewUrl) return null;

  // ✅ This is the actual fix: onSend is ALWAYS called with zero arguments,
  // so a click event can never end up stored as the message's caption text.
  const handleSend = () => {
    if (sending) return;
    onSend();
  };

  return (
    <>
      <div
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-[420px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp z-50 border border-black/5"
        style={{ maxHeight: "80vh" }}
      >
        {/* IMAGE PREVIEW */}
        <div className="relative w-full flex-shrink-0 bg-black">
          <img
            src={previewUrl}
            onClick={() => setShowViewer(true)}
            alt=""
            className="w-full h-auto max-h-[55vh] object-contain cursor-zoom-in"
          />

          <button
            onClick={() => { setImage(null); setCaption(""); }}
            className="absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition"
            title="Remove image"
          >
            <X size={18} />
          </button>
        </div>

        {/* CAPTION ROW */}
        <div className="flex items-end gap-2 p-3 border-t border-black/5">
          <div className="relative flex-1">
            <textarea
              value={caption}
              rows={1}
              autoFocus
              placeholder="Add a caption…"
              onChange={(e) => {
                setCaption(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full resize-none outline-none text-sm px-3 py-2 pr-9 bg-gray-100 rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowEmoji((o) => !o)}
              className="absolute right-2 bottom-2 text-gray-400 hover:text-gray-600"
              title="Add emoji"
            >
              <Smile size={18} />
            </button>

            {showEmoji && (
              <div className="absolute bottom-12 right-0 z-50 bg-white border border-black/10 rounded-xl shadow-lg p-2 grid grid-cols-5 gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { setCaption((v) => (v || "") + emoji); setShowEmoji(false); }}
                    className="text-lg hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Discard */}
          <button
            onClick={() => { setImage(null); setCaption(""); }}
            className="text-gray-400 hover:text-red-500 mb-2"
            title="Discard"
          >
            <Trash2 size={18} />
          </button>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={sending}
            style={{ backgroundColor: "var(--input-primary)" }}
            className="text-[var(--primary)] p-2.5 rounded-full flex items-center justify-center disabled:opacity-60 mb-0.5"
            title="Send"
          >
            {sending ? <Spinner size={22} /> : <SendHorizonal size={22} />}
          </button>
        </div>
      </div>

      {/* FULLSCREEN PREVIEW (tap the image to open) */}
      {showViewer && (
        <div
          className="fixed inset-0 bg-black z-[60] flex items-center justify-center"
          onClick={() => setShowViewer(false)}
        >
          <img src={previewUrl} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}

function Spinner({ size = 18, color = "currentColor" }) {
  return (
    <svg style={{ width: size, height: size }} className="animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke={color} strokeWidth="4" className="opacity-75" strokeLinecap="round" />
    </svg>
  );
}