import { useState } from "react";
import { Trash2, SendHorizonal, X } from "lucide-react";

/**
 * PROPS:
 * image: File | null
 * setImage: (file: File | null) => void
 * caption: string
 * setCaption: (text: string) => void
 * onSend: () => void
 * sending: boolean
 */
export default function ImageComposer({ image, setImage, caption, setCaption, onSend, sending }) {
  const [showViewer, setShowViewer] = useState(false);

  if (!image) return null;

  return (
    <>
      {/* IMAGE COMPOSER */}
      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden animate-slideUp">

        {/* IMAGE ROW */}
        <div className="relative w-full flex-shrink-0">
          <BlurImage
            src={URL.createObjectURL(image)}
            onClick={() => setShowViewer(true)}
          />

          {/* CLOSE BUTTON */}
          <button
            onClick={() => { setImage(null); setCaption(""); }}
            className="absolute top-3 right-3 bg-black/60 text-white p-1 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-end gap-2 p-3 border-t">
          {/* Caption with Emoji */}
          <EmojiInput value={caption} setValue={setCaption} />

          {/* Delete */}
          <button
            onClick={() => { setImage(null); setCaption(""); }}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 size={18} />
          </button>

          {/* Send */}
          <button
            onClick={onSend}
            disabled={sending}
            style={{ backgroundColor: "var(--input-primary)" }}
            className="text-white p-2 rounded-full flex items-center justify-center"
          >
            {sending ? <Spinner /> : <SendHorizonal size={16} />}
          </button>
        </div>
      </div>

      {/* FULLSCREEN VIEWER */}
      {showViewer && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={() => setShowViewer(false)}
        >
          <img
            src={URL.createObjectURL(image)}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}

/* ----------------- SUB COMPONENTS ----------------- */

function BlurImage({ src, onClick }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full">
      <img
        src={src}
        onLoad={() => setLoaded(true)}
        onClick={onClick}
        className={`w-full h-auto max-h-[60vh] object-contain cursor-pointer transition duration-300 ${
          loaded ? "blur-0 scale-100" : "blur-md scale-105"
        }`}
        style={{ borderRadius: "0.5rem" }}
      />
    </div>
  );
}

function EmojiInput({ value, setValue }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex-1">
      <textarea
        value={value}
        rows={1}
        placeholder="Add a caption…"
        onChange={(e) => {
          setValue(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
        }}
        className="w-full resize-none outline-none text-sm px-3 py-2 bg-gray-100 rounded-xl"
      />

      <button
        onClick={() => setOpen(o => !o)}
        className="absolute right-2 bottom-2 text-gray-400"
      >
        😊
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 z-50">
          <EmojiPicker
            onEmojiClick={(e) => setValue(v => v + e.emoji)}
            height={320}
            width={280}
          />
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
      />
    </svg>
  );
}
