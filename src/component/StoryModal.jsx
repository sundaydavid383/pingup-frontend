// src/components/StoryModal.jsx
import { ArrowLeft, Sparkle, TextIcon, Upload } from "lucide-react";
import React, { useState } from "react";
import Loading from "./shared/Loading";
import CustomAlert from "./shared/CustomAlert";
import axios from "../utils/axiosBase";
import { useAuth } from "../context/AuthContext";
import CancellableLoading from "./shared/CancellableLoading";

const StoryModal = ({ setShowModal, fetchStories }) => {
  const bgColors = [
    "linear-gradient(135deg, #4f46e5, #1e40af)",
    "#db2777",
    "#e11d48",
    "#ca8a04",
    "#0d9488",
    "#0f172a",
  ];

  const { user } = useAuth();

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("text"); // 'text' | 'media'
  const [background, setBackground] = useState(bgColors[0]);
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // --- keep media + text independent ---
  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 15; // MB
    const fileSizeInMB = file.size / (1024 * 1024);

    if (fileSizeInMB > maxSize) {
      setAlert({ message: `File exceeds ${maxSize}MB limit.`, type: "error" });
      return;
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setAlert({ message: "Only images and videos are allowed.", type: "error" });
      return;
    }

    // preserve the text — only update media + preview
    setMedia(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMode("media"); // show media preview automatically
  };

  const resetForm = () => {
    setText("");
    setMedia(null);
    setPreviewUrl(null);
    setBackground(bgColors[0]);
    setMode("text");
  };


const [controller, setController] = useState(null);

const handleCreateStory = async () => {
  if (!text.trim() && !media) {
    setAlert({ message: "Please add text or upload media.", type: "error" });
    return;
  }

  if (!user) {
    setAlert({ message: "You must be signed in to post a story.", type: "error" });
    return;
  }

  setLoading(true);

  // create abort controller
  const abortCtrl = new AbortController();
  setController(abortCtrl);

  try {
    const formData = new FormData();
    if (text.trim()) {
      formData.append("content", text.trim());
      formData.append("title", text.trim().slice(0, 60) || "");
    } else formData.append("title", "");

    if (media) formData.append("media", media);
    if (!media && background) formData.append("background_color", background);

    formData.append(
      "user",
      JSON.stringify({
        username: user.username,
        full_name: user.name || user.full_name || user.username,
        profile_image: user.profilePicUrl || user.profile_image || "",
      })
    );

    const token = localStorage.getItem("token");
    const res = await axios.post("/api/stories", formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        "Content-Type": "multipart/form-data",
      },
      signal: abortCtrl.signal, // attach abort signal
    });

    console.log("ths  is what we have has story:", formData)

    fetchStories && (await fetchStories());
    setShowModal(false);
    setAlert({ message: "Story created successfully!", type: "success" });
    resetForm();
  } catch (err) {
    if (err.name === "CanceledError" || err.name === "AbortError") {
      setAlert({ message: "Story creation cancelled.", type: "info" });
    } else {
      setAlert({
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create story.",
        type: "error",
      });
    }
  } finally {
    setLoading(false);
    setController(null);
  }
};


  return (
    <div
      className="fixed inset-0 z-110 min-h-screen bg-black/80 backdrop-blur text-[var(--text-main)] flex items-center justify-center p-4"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-zinc-900 rounded-lg p-4">
        {/* Header */}
        <div className="text-center mb-4 flex items-center justify-between">
          <button
            onClick={() => setShowModal(false)}
            className="text-[var(--text-main)] p-2 cursor-pointer"
            aria-label="Close"
          >
            <ArrowLeft />
          </button>

          <h2 className="text-lg font-semibold">Create Story</h2>
          <span className="w-10" />
        </div>

{/* Preview Area */}
<div
  className="rounded-lg h-96 flex items-center justify-center relative overflow-hidden group"
  style={{ background: !media ? background : "#000" }}
>
  {/* Full media preview if uploaded */}
  {previewUrl && (
    <>
      {media.type.startsWith("image") ? (
        <img
          src={previewUrl}
          alt="Story Preview"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
            mode === "media" ? "opacity-100 z-0" : "opacity-60 z-0"
          }`}
        />
      ) : (
        <video
          src={previewUrl}
          controls={mode === "media"}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
            mode === "media" ? "opacity-100 z-0" : "opacity-60 z-0"
          }`}
        />
      )}

      {/* 🧹 Cancel Button */}
      <button
        onClick={() => {
          setMedia(null);
          setPreviewUrl(null);
        }}
        className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 shadow-lg opacity-90 hover:opacity-100 transition-all duration-200 backdrop-blur-md"
        title="Remove media"
      >
        ✕
      </button>
    </>
  )}

  {/* Text Area (always editable) */}
  <textarea
  className={`absolute inset-0 bg-transparent text-white w-full h-full text-2xl font-bold resize-none focus:outline-none p-10 z-10 flex items-center justify-center text-center ${
    mode === "text" ? "pointer-events-auto" : "pointer-events-none"
  }`}
  placeholder="What's on your mind?"
  onChange={(e) => setText(e.target.value)}
  value={text}
  style={{
    display: 'flex',
    alignItems: 'center', // Vertical centering
    justifyContent: 'center', // Horizontal centering
    textAlign: 'center',
    paddingTop: !media ? '40%' : '20%' // Adjusts vertical start point
  }}
/>

  {/* Text Overlay (visible in media mode if text exists) */}
  {mode === "media" && text.trim() && (
    <div className="absolute inset-0 p-4 text-white text-lg pointer-events-none flex items-end z-20">
      <div className="bg-black/50 rounded-xl p-2 px-3 max-w-full break-words shadow-lg">
        {text}
      </div>
    </div>
  )}

  {/* Thumbnail (visible in text mode if media exists) */}
  {mode === "text" && previewUrl && (
    <div className="absolute bottom-3 right-3 w-20 h-20 rounded overflow-hidden ring ring-white/30 shadow-lg z-20">
      {media.type.startsWith("image") ? (
        <img src={previewUrl} className="w-full h-full object-cover" alt="attached" />
      ) : (
        <video src={previewUrl} className="w-full h-full object-cover" />
      )}
    </div>
  )}
</div>


        {/* Mode Switch */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              // do NOT clear media or text — just switch UI
              setMode("text");
            }}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer ${
              mode === "text" ? "bg-white text-black" : "bg-zinc-800 text-white"
            }`}
          >
            <TextIcon size={18} /> Text
          </button>

          <label
            htmlFor="storyFile"
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer ${
              mode === "media" ? "bg-white text-black" : "bg-zinc-800 text-white"
            }`}
          >
            <input
              id="storyFile"
              onChange={handleMediaUpload}
              type="file"
              accept="image/*, video/*"
              className="hidden"
            />
            <Upload size={18} /> Images/Videos
          </label>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateStory}
          className="btn w-full mt-3 flex items-center justify-center gap-2"
        >
          <Sparkle size={18} /> Create Now
        </button>
      </div>

      {/* Loading and Alerts */}
      {loading && (
  <CancellableLoading
    text="Creating story..."
    onCancel={() => {
      if (controller) controller.abort();
      setLoading(false);
    }}
  />
)}
      {alert && (
        <CustomAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />
      )}
    </div>
  );
};

export default StoryModal;
