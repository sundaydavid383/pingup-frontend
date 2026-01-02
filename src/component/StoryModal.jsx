import { ArrowLeft, TextIcon, Upload, Edit3 } from "lucide-react";
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

  // Background state
  const [backgroundType, setBackgroundType] = useState("gradient");
  const [gradientColors, setGradientColors] = useState(["#4f46e5", "#db2777", "#e11d48"]);
  const [solidColor, setSolidColor] = useState("#4f46e5");

  // Text formatting
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
        formData.append("text_format", JSON.stringify({
          bold,
          italic,
          fontSize,
          textAlign
        }));
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
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-zinc-900 rounded-lg p-3 relative">
        {/* Header */}
        <div className="text-center mb-3 flex items-center justify-between">
          <button onClick={() => setShowModal(false)} className="text-white p-2"><ArrowLeft /></button>
          <h2 className="text-lg font-semibold text-white">New Story</h2>
          <div className="w-10" />
        </div>

        {/* Preview Area */}
        <div
          className="rounded-lg h-38 flex items-center justify-center relative overflow-hidden"
          style={{ background: !media ? getBackgroundCSS() : "#000" }}
        >
          {previewUrl && media && (
            <>
              {media.type.startsWith("image") ? (
                <img src={previewUrl} className="w-full h-full object-contain z-10" alt="Preview" />
              ) : (
                <video src={previewUrl} className="w-full h-full object-contain z-10" controls />
              )}

              {media.type.startsWith("image") && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-3 left-3 z-30 bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold shadow-lg"
                >
                  <Edit3 size={14} /> Edit
                </button>
              )}

              <button
                onClick={() => { setMedia(null); setPreviewUrl(null); }}
                className="absolute top-2 right-2 z-30 bg-black/50 text-white rounded-full p-1"
              >✕</button>
            </>
          )}

          {/* Text overlay */}
          <textarea
            className="absolute inset-0 w-full h-full resize-none focus:outline-none p-4 z-20 text-center flex items-center justify-center"
            placeholder="Type a caption..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              fontWeight: bold ? "bold" : "normal",
              fontStyle: italic ? "italic" : "normal",
              fontSize: fontSize,
              textAlign: textAlign,
              color: "#fff",
              background: "transparent"
            }}
          />
        </div>

        {/* Background Options */}
        {!media && (
          <div className="mt-3">
            <span className="text-white text-sm mb-1 block">Background Type:</span>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setBackgroundType("solid")}
                className={`px-3 py-1 rounded ${backgroundType==='solid' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-white'}`}
              >
                Solid
              </button>
              <button
                onClick={() => setBackgroundType("gradient")}
                className={`px-3 py-1 rounded ${backgroundType==='gradient' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-white'}`}
              >
                Gradient
              </button>
            </div>

            {backgroundType === "solid" && (
              <input
                type="color"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
                className="w-12 h-12 rounded-full border-2 border-white"
              />
            )}

            {backgroundType === "gradient" && (
              <div className="flex flex-col gap-2">
                {/* Gradient preview */}
                <div
                  className="h-6 rounded w-full border border-white"
                  style={{
                    background: `linear-gradient(135deg, ${gradientColors.filter(Boolean).join(", ")})`
                  }}
                />

                <div className="flex gap-2">
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
                      className="w-12 h-12 rounded-full border-2 border-white cursor-pointer"
                    />
                  ))}
                </div>

                {/* Preset gradients */}
                <div className="flex gap-2 mt-1">
                  {presetGradients.map((preset, i) => (
                    <div
                      key={i}
                      className="w-10 h-6 rounded cursor-pointer border-2 border-white"
                      style={{ background: `linear-gradient(135deg, ${preset.join(", ")})` }}
                      onClick={() => setGradientColors(preset)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text formatting */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => setBold(!bold)}
            className={`px-2 py-1 border rounded ${bold ? "border-blue-500" : "border-white"}`}
          >B</button>
          <button
            onClick={() => setItalic(!italic)}
            className={`px-2 py-1 border rounded ${italic ? "border-blue-500" : "border-white"}`}
          >I</button>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="px-2 py-1 border border-white rounded"
          >
            <option value="1rem">Small</option>
            <option value="1.8rem">Medium</option>
            <option value="2.5rem">Large</option>
          </select>
          <select
            value={textAlign}
            onChange={(e) => setTextAlign(e.target.value)}
            className="px-2 py-1 border border-white rounded"
          >
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>

        {/* Stickers / Emojis */}
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {stickers.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setText(text + s)}
              className="text-2xl"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Mode Selectors */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setMode("text")}
            className={`flex-1 p-3 rounded-xl flex justify-center items-center gap-2 ${mode === "text" ? "bg-white text-black" : "bg-zinc-800 text-white"}`}
          >
            <TextIcon size={18} /> Text
          </button>

          <label className={`flex-1 p-3 rounded-xl flex justify-center items-center gap-2 cursor-pointer ${mode === "media" ? "bg-white text-black" : "bg-zinc-800 text-white"}`}>
            <input onChange={handleMediaUpload} type="file" accept="image/*, video/*" className="hidden" />
            <Upload size={18} /> Media
          </label>
        </div>

        <button
          onClick={handleCreateStory}
          className="w-full bg-blue-600 text-white py-4 rounded-xl mt-3 font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          Post Story
        </button>
      </div>

      {/* Image Editor */}
     {isEditing && previewUrl && (
  <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center">
    <div className="text-white text-center">
      Image editing removed temporarily.
      <button
        onClick={() => setIsEditing(false)}
        className="mt-4 px-4 py-2 bg-blue-600 rounded"
      >
        Close
      </button>
    </div>
  </div>
)}

      {loading && <CancellableLoading text="Uploading..." onCancel={() => controller?.abort()} />}
      {alert && <CustomAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  );
};

export default StoryModal;
