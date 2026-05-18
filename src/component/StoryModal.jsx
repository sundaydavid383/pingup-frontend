import { ArrowLeft, TextIcon, Upload, Edit3, Sparkles } from "lucide-react";
import React, { useState } from "react";
import axios from "../utils/axiosBase";
import { useAuth } from "../context/AuthContext";
import CancellableLoading from "./shared/CancellableLoading";
import CustomAlert from "./shared/CustomAlert";

const presetGradients = [
  ["#4f46e5", "#db2777", "#e11d48"],
  ["#0d9488", "#16a34a", "#facc15"],
  ["#be123c", "#9333ea", "#f97316"]
];

const stickers = ["😀", "❤️", "🔥", "✨", "🌈"];

const StoryModal = ({ setShowModal, fetchStories }) => {
  const { user } = useAuth();

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [controller, setController] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [backgroundType, setBackgroundType] = useState("gradient");
  const [gradientColors, setGradientColors] = useState(["#4f46e5", "#db2777", "#e11d48"]);
  const [solidColor, setSolidColor] = useState("#4f46e5");

  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [fontSize, setFontSize] = useState("1.8rem");
  const [textAlign, setTextAlign] = useState("center");

  const getBackgroundCSS = () => {
    if (backgroundType === "gradient") {
      const activeColors = gradientColors.filter(Boolean);
      return activeColors.length === 1
        ? activeColors[0]
        : `linear-gradient(135deg, ${activeColors.join(", ")})`;
    } else {
      return solidColor;
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSizeMB = 15;
    if (file.size / (1024 * 1024) > maxSizeMB) {
      setAlert({ message: `File exceeds ${maxSizeMB}MB limit.`, type: "error" });
      return;
    }
    setMedia(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMode("media");
    if (file.type.startsWith("image/")) setIsEditing(true);
  };

  const onCompleteEdit = (editedImageObject) => {
    const base64Data = editedImageObject.imageBase64;
    setPreviewUrl(base64Data);
    fetch(base64Data)
      .then(res => res.blob())
      .then(blob => {
        setMedia(new File([blob], "edited_story.png", { type: "image/png" }));
      });
    setIsEditing(false);
  };

  const handleCreateStory = async () => {
    if (!text.trim() && !media) {
      setAlert({ message: "Please add text or upload media.", type: "error" });
      return;
    }
    setLoading(true);
    const abortCtrl = new AbortController();
    setController(abortCtrl);
    try {
      const formData = new FormData();
      if (text.trim()) {
        formData.append("content", text.trim());
        formData.append("title", text.trim().slice(0, 60));
        formData.append("text_format", JSON.stringify({ bold, italic, fontSize, textAlign }));
      }
      if (media) formData.append("media", media);
      if (!media) formData.append("background_color", getBackgroundCSS());
      formData.append("user", JSON.stringify({
        username: user.username,
        full_name: user.name || user.full_name,
        profile_image: user.profilePicUrl || user.profile_image || "",
      }));
      await axios.post("/api/stories", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        signal: abortCtrl.signal,
      });
      fetchStories && (await fetchStories());
      setShowModal(false);
    } catch (err) {
      if (err.name !== "CanceledError") setAlert({ message: "Failed to create story.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Playfair+Display:wght@500;600&display=swap');

        .story-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 110;
          background: rgba(5, 10, 30, 0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          animation: overlayIn 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .story-modal-card {
          width: 100%;
          max-width: 420px;
          background: linear-gradient(160deg, rgba(20, 30, 65, 0.97) 0%, rgba(12, 18, 45, 0.99) 100%);
          border: 1px solid rgba(59, 92, 203, 0.22);
          border-radius: 24px;
          padding: 0px 10px;
          position: relative;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 32px 80px rgba(0,0,0,0.6),
            0 0 60px rgba(59, 92, 203, 0.08);
          animation: cardIn 0.32s cubic-bezier(0.22, 1, 0.36, 1);
          font-family: 'DM Sans', sans-serif;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Subtle mesh top accent */
        .story-modal-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59, 92, 203, 0.6), rgba(131, 109, 240, 0.4), transparent);
          border-radius: 24px 24px 0 0;
        }

        /* Header */
        .sm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .sm-back-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(59, 92, 203, 0.12);
          border: 1px solid rgba(59, 92, 203, 0.2);
          color: var(--text-main);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sm-back-btn:hover {
          background: rgba(59, 92, 203, 0.25);
          border-color: rgba(59, 92, 203, 0.45);
          transform: scale(1.05);
        }

        .sm-title {
          font-family: 'Playfair Display', serif;
          font-size: .95rem;
          font-weight: 600;
          color: var(--text-main);
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          column-gap: 4px;
          row-gap: 2px;
        }
        .sm-title-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--primary-color);
          box-shadow: 0 0 8px rgba(59, 92, 203, 0.8);
        }

        /* Preview */
        .sm-preview {
          border-radius: 16px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,92,203,0.1) inset;
        }

        .sm-preview-textarea {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          resize: none;
          background: transparent;
          border: none;
          outline: none;
          padding: 20px;
          z-index: 20;
          color: #fff;
          text-align: center;
          font-family: 'DM Sans', sans-serif;
          text-shadow: 0 1px 8px rgba(0,0,0,0.4);
          caret-color: rgba(255,255,255,0.8);
        }
        .sm-preview-textarea::placeholder {
          color: rgba(255,255,255,0.35);
          font-style: italic;
          font-weight: 300;
        }

        .sm-clear-media {
          position: absolute;
          top: 10px; right: 10px;
          z-index: 30;
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .sm-clear-media:hover { background: rgba(239,68,68,0.6); }

        .sm-edit-btn {
          position: absolute;
          bottom: 10px; left: 10px;
          z-index: 30;
          background: var(--primary-color);
          color: #fff;
          border: none;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: flex; align-items: center; gap: 5px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(59,92,203,0.5);
          transition: all 0.2s ease;
        }
        .sm-edit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(59,92,203,0.65); }

        /* Section label */
        .sm-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(148, 163, 184, 0.6);
          margin-bottom: 8px;
          margin-top: 16px;
          display: block;
        }

        /* Background type pills */
        .sm-type-pills {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }
        .sm-pill {
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          background: rgba(255,255,255,0.05);
          color: var(--text-secondary);
        }
        .sm-pill.active {
          background: rgba(59, 92, 203, 0.18);
          border-color: rgba(59, 92, 203, 0.45);
          color: #a5b8ff;
        }
        .sm-pill:hover:not(.active) { background: rgba(255,255,255,0.08); color: var(--text-main); }

        /* Color pickers row */
        .sm-color-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sm-color-swatch {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.15);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          -webkit-appearance: none;
          overflow: hidden;
          padding: 0;
        }
        .sm-color-swatch:hover { transform: scale(1.12); border-color: rgba(255,255,255,0.45); }

        /* Gradient preview bar */
        .sm-gradient-bar {
          height: 8px;
          border-radius: 8px;
          width: 100%;
          margin-bottom: 10px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* Preset gradient chips */
        .sm-presets {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .sm-preset-chip {
          height: 22px;
          flex: 1;
          border-radius: 6px;
          cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.08);
          transition: all 0.2s ease;
        }
        .sm-preset-chip:hover {
          border-color: rgba(255,255,255,0.35);
          transform: scaleY(1.15);
        }

        /* Text formatting bar */
        .sm-format-bar {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 16px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
        }

        .sm-fmt-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.18s ease;
        }
        .sm-fmt-btn:hover { background: rgba(59,92,203,0.15); color: var(--text-main); border-color: rgba(59,92,203,0.3); }
        .sm-fmt-btn.active { background: rgba(59,92,203,0.22); border-color: rgba(59,92,203,0.5); color: #a5b8ff; }

        .sm-fmt-select {
          height: 32px;
          padding: 0 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-secondary);
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          outline: none;
          transition: all 0.18s ease;
        }
        .sm-fmt-select:hover, .sm-fmt-select:focus {
          background: rgba(59,92,203,0.12);
          border-color: rgba(59,92,203,0.35);
          color: var(--text-main);
        }

        /* Stickers row */
        .sm-stickers {
          display: flex;
          gap: 4px;
          margin-top: 12px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .sm-sticker-btn {
          min-width: 38px; height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 18px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s ease;
        }
        .sm-sticker-btn:hover { background: rgba(59,92,203,0.15); transform: scale(1.12); border-color: rgba(59,92,203,0.3); }

        /* Mode toggle */
        .sm-mode-row {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        .sm-mode-btn {
          flex: 1;
          padding: 11px 0;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.04);
          color: var(--text-secondary);
          transition: all 0.22s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .sm-mode-btn.active {
          background: rgba(59, 92, 203, 0.18);
          border-color: rgba(59, 92, 203, 0.45);
          color: #c7d3ff;
          box-shadow: 0 0 16px rgba(59,92,203,0.15);
        }
        .sm-mode-btn:hover:not(.active) { background: rgba(255,255,255,0.07); color: var(--text-main); }

        /* Post button */
        .sm-post-btn {
          width: 100%;
          margin-top: 14px;
          padding: 14px 0;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--primary-color) 0%, #5b7cf7 100%);
          border: none;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 6px 24px rgba(59, 92, 203, 0.4), 0 0 0 1px rgba(255,255,255,0.06) inset;
          transition: all 0.22s ease;
          position: relative;
          overflow: hidden;
        }
        .sm-post-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .sm-post-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 32px rgba(59, 92, 203, 0.55), 0 0 0 1px rgba(255,255,255,0.1) inset;
        }
        .sm-post-btn:active { transform: translateY(0); }

        /* Divider */
        .sm-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59,92,203,0.2), transparent);
          margin: 14px 0 0;
        }
      `}</style>

      <div className="story-modal-overlay">
        <div className="story-modal-card">

          {/* Header */}
          <div className="sm-header">
            <button onClick={() => setShowModal(false)} className="sm-back-btn">
              <ArrowLeft size={16} />
            </button>
            <span className="sm-title">
              New Story
              <span className="sm-title-dot" />
            </span>
            <div style={{ width: 36 }} />
          </div>

          {/* Preview */}
          <div
            className="sm-preview"
            style={{ background: !media ? getBackgroundCSS() : "#000" }}
          >
            {previewUrl && media && (
              <>
                {media.type.startsWith("image") ? (
                  <img src={previewUrl} style={{ width: "100%", height: "100%", objectFit: "contain", zIndex: 10 }} alt="Preview" />
                ) : (
                  <video src={previewUrl} style={{ width: "100%", height: "100%", objectFit: "contain", zIndex: 10 }} controls />
                )}
                {media.type.startsWith("image") && (
                  <button onClick={() => setIsEditing(true)} className="sm-edit-btn">
                    <Edit3 size={12} /> Edit
                  </button>
                )}
                <button onClick={() => { setMedia(null); setPreviewUrl(null); }} className="sm-clear-media">✕</button>
              </>
            )}
            <textarea
              className="sm-preview-textarea"
              placeholder="What's your story..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                fontWeight: bold ? "bold" : "normal",
                fontStyle: italic ? "italic" : "normal",
                fontSize: fontSize,
                textAlign: textAlign,
              }}
            />
          </div>

          {/* Background Options */}
          {!media && (
            <div>
              <span className="sm-label">Background</span>
              <div className="sm-type-pills">
                <button onClick={() => setBackgroundType("solid")} className={`sm-pill ${backgroundType === "solid" ? "active" : ""}`}>Solid</button>
                <button onClick={() => setBackgroundType("gradient")} className={`sm-pill ${backgroundType === "gradient" ? "active" : ""}`}>Gradient</button>
              </div>

              {backgroundType === "solid" && (
                <div className="sm-color-row">
                  <input type="color" value={solidColor} onChange={(e) => setSolidColor(e.target.value)} className="sm-color-swatch" />
                </div>
              )}

              {backgroundType === "gradient" && (
                <div>
                  <div
                    className="sm-gradient-bar"
                    style={{ background: `linear-gradient(135deg, ${gradientColors.filter(Boolean).join(", ")})` }}
                  />
                  <div className="sm-color-row">
                    {gradientColors.map((color, idx) => (
                      <input
                        key={idx}
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...gradientColors];
                          newColors[idx] = e.target.value;
                          setGradientColors(newColors);
                        }}
                        className="sm-color-swatch"
                      />
                    ))}
                  </div>
                  <div className="sm-presets">
                    {presetGradients.map((preset, i) => (
                      <div
                        key={i}
                        className="sm-preset-chip"
                        style={{ background: `linear-gradient(135deg, ${preset.join(", ")})` }}
                        onClick={() => setGradientColors(preset)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="sm-divider" />

          {/* Text Formatting */}
          <div className="sm-format-bar">
            <button onClick={() => setBold(!bold)} className={`sm-fmt-btn ${bold ? "active" : ""}`} style={{ fontWeight: 800 }}>B</button>
            <button onClick={() => setItalic(!italic)} className={`sm-fmt-btn ${italic ? "active" : ""}`} style={{ fontStyle: "italic" }}>I</button>
            <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="sm-fmt-select">
              <option value="1rem">Small</option>
              <option value="1.8rem">Medium</option>
              <option value="2.5rem">Large</option>
            </select>
            <select value={textAlign} onChange={(e) => setTextAlign(e.target.value)} className="sm-fmt-select">
              <option value="center">Center</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          {/* Stickers */}
          <div className="sm-stickers">
            {stickers.map((s, idx) => (
              <button key={idx} onClick={() => setText(text + s)} className="sm-sticker-btn">{s}</button>
            ))}
          </div>

          {/* Mode Toggles */}
          <div className="sm-mode-row">
            <button onClick={() => setMode("text")} className={`sm-mode-btn ${mode === "text" ? "active" : ""}`}>
              <TextIcon size={15} /> Text
            </button>
            <label className={`sm-mode-btn ${mode === "media" ? "active" : ""}`} style={{ cursor: "pointer" }}>
              <input onChange={handleMediaUpload} type="file" accept="image/*, video/*" style={{ display: "none" }} />
              <Upload size={15} /> Media
            </label>
          </div>

          {/* Post Button */}
          <button onClick={handleCreateStory} className="sm-post-btn">
            <Sparkles size={15} />
            Post Story
          </button>
        </div>

        {/* Image Editor */}
        {isEditing && previewUrl && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: "#fff", textAlign: "center" }}>
              Image editing removed temporarily.
              <button onClick={() => setIsEditing(false)} style={{ display: "block", marginTop: 16, padding: "8px 20px", background: "var(--primary-color)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        )}

        {loading && <CancellableLoading text="Uploading..." onCancel={() => controller?.abort()} />}
        {alert && <CustomAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      </div>
    </>
  );
};

export default StoryModal;