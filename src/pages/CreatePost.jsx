import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { X, Image, Video as VideoIcon } from "lucide-react";
import CustomAlert from "../component/shared/CustomAlert";
import location from "../utils/location";
import BackButton from "../component/shared/BackButton";
import ProfileAvatar from "../component/shared/ProfileAvatar"

const CreatePost = () => {
  const { user, token } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const abortControllerRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
const [uploadState, setUploadState] = useState(""); 

  const MAX_TEXT_LENGTH = 500;
  const MAX_IMAGES = 4;
  const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
  const MAX_VIDEOS = 1;
  const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB
  const MAX_VIDEO_DURATION = 1040; // seconds

  const showAlert = (message, type = "info") => setAlert({ message, type });

  // Clean and validate text input
  const handleTextChange = (e) => {
    let value = e.target.value.replace(/\n{2,}/g, "\n").trimStart().replace(/\n+$/g, '');
    if (value.length > MAX_TEXT_LENGTH) {
      return showAlert(`Text cannot exceed ${MAX_TEXT_LENGTH} characters.`, "warning");
    }
    setContent(value);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\n{2,}/g, '\n').trim();
    setContent(prev => {
      const cleaned = `${prev}\n${text}`.replace(/\n{2,}/g, '\n').trimStart();
      return cleaned.slice(0, MAX_TEXT_LENGTH);
    });
  };


  const handleImageUpload = (e) => {

      if (videos.length > 0) {
    return showAlert("You cannot upload images while a video is selected. Delete the video first.", "warning");
  }
    const files = Array.from(e.target.files);
    if (images.length + files.length > MAX_IMAGES) {
      return showAlert(`You can only upload up to ${MAX_IMAGES} images.`, "warning");
    }
    for (const file of files) {
      if (file.size > MAX_IMAGE_SIZE) {
        return showAlert(`Image ${file.name} exceeds 15MB.`, "warning");
      }
    }
    setImages([...images, ...files]);
  };

  const handleVideoUpload = (e) => {
      if (images.length > 0) {
    return showAlert("You cannot upload a video while images are selected. Delete the images first.", "warning");
  }

    const files = Array.from(e.target.files);
    if (videos.length + files.length > MAX_VIDEOS) {
      return showAlert("Only 1 video allowed. Delete the existing one using the cancel button.", "warning");

    }

    files.forEach((file) => {
      if (file.size > MAX_VIDEO_SIZE) {
        return showAlert(`Video ${file.name} exceeds 15MB.`, "warning");
      }

      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          return showAlert(`Video ${file.name} exceeds ${MAX_VIDEO_DURATION} seconds.`, "warning");
        } else {
          setVideos(prev => [...prev, file]);
        }
      };
    });
  };

const handleSubmit = async () => {
  if (!content && images.length === 0 && videos.length === 0) {
    return showAlert("Please add content, images, or videos", "warning");
  }

  setLoading(true);
  abortControllerRef.current = new AbortController();

  const isDev = import.meta.env.MODE === "development";

  try {
    if (isDev) console.group("📌 Creating Post");

    if (isDev) console.log("Content:", content);
    if (isDev) console.log("Images:", images.map(f => f.name));
    if (isDev) console.log("Videos:", videos.map(f => f.name));
    if (isDev) console.log("Visibility:", visibility);

    const formData = new FormData();
    formData.append("content", content);
    formData.append("visibility", visibility);

    // Use user's saved location if available
    if (user?.locationCoords) {
      const { coordinates } = user.locationCoords; // [longitude, latitude]
      formData.append(
        "location",
        JSON.stringify({ coords: { type: "Point", coordinates }, city: user.currentCity, country: user.country })
      );
      if (isDev) console.log("Using user's saved location:", user.locationCoords);
    } else {
      if (isDev) console.log("No location available, skipping location.");
    }

    images.forEach(file => formData.append("media", file));
    videos.forEach(file => formData.append("media", file));

    if (isDev) console.log("FormData keys:", Array.from(formData.keys()));

    const res = await axios.post(
      `${import.meta.env.VITE_SERVER}api/posts/add`,
      formData,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortControllerRef.current.signal,
        timeout: 0,
        onUploadProgress: (progressEvent) => {
  if (progressEvent.total) {
    const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
    setUploadProgress(percent);

    if (percent < 100) {
      setUploadState("Uploading...");
    } else {
      setUploadState("Processing...");
    }
  }
},

      }
    );

    if (isDev) console.log("Response status:", res.status, "Data:", res.data);

 if (res.status >= 200 && res.status < 300) {
  showAlert("✅ Post published successfully!", "success");

  setContent(""); 
  setImages([]);
  setVideos([]);
  setVisibility("public");

  // Reset now
  setUploadProgress(0);
  setUploadState("");
}
 else {
      showAlert(res.data.message || "Something went wrong.", "error");
    }

    if (isDev) console.groupEnd();
  } catch (err) {
    if (isDev) console.error("❌ Error creating post:", err);

    setUploadProgress(0);
    setUploadState("");

    if (axios.isCancel(err)) {
      showAlert("❌ Post cancelled.", "warning");
          setUploadProgress(0);
    setUploadState("");
    } else {
      showAlert("Server error. Try again later.", "error");
    }
  } finally {
    setLoading(false);

  }
};




  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6">
      {/* Back button */}
      <BackButton top="2" right="2" />

      {/* Dark overlay when alert is visible */}
      {alert && <div className="fixed inset-0 bg-black/30 z-30"></div>}

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-slate-900 title">Create Post</h1>
        <p className="text-gray-600 mb-4">Share your thoughts with the world</p>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
             <ProfileAvatar
              user={{
                name: user?.name || "User",
                profilePicUrl: user?.profilePicUrl,
                profilePicBackground: user?.profilePicBackground,
              }}
              size={48}
            />
            <div>
              <h2 className="font-semibold">{user.full_name}</h2>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            className="w-full resize-none min-h-20 max-h-60 overflow-y-auto text-sm outline-none placeholder-gray-400 border-b pb-1"
            placeholder="What's on your mind?"
            value={content}
            onChange={handleTextChange}
            onPaste={handlePaste}
          />
          <div className="text-xs text-gray-500 text-right">{content.length}/{MAX_TEXT_LENGTH}</div>

          {/* Visibility */}
          <div className="flex items-center gap-2 mt-2 text-sm">
            <label className="font-semibold text-gray-700">Visibility:</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </div>

{/* Media Previews */}
{(images.length > 0 || videos.length > 0) && (
  <div className="flex flex-wrap gap-2 mt-2">
    {/* Image Previews */}
    {images.map((img, i) => (
      <div
        key={i}
        className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border border-gray-200"
      >
        <img
          src={URL.createObjectURL(img)}
          alt="Upload"
          className="w-full h-full object-cover"
        />
        <button
          className="absolute top-1 right-1 bg-black/60 p-1 rounded-full z-10"
          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    ))}

    {/* Video Previews */}
    {videos.map((vid, i) => (
      <div
        key={i}
        className="relative w-32 h-20 flex-shrink-0 rounded-md overflow-hidden border border-gray-200"
      >
        <video
          src={URL.createObjectURL(vid)}
          className="w-full h-full object-contain"
          controls
        />
        <button
          className="absolute top-1 right-1 bg-black/60 p-1 rounded-full z-10"
          onClick={() => setVideos(videos.filter((_, idx) => idx !== i))}
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    ))}
  </div>
)}


          {/* Upload & Publish */}
<div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-300">
  {/* Image & Video Upload Icons */}
  <div className="flex gap-2">
    <label
      htmlFor="images"
      className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 transition cursor-pointer border rounded-md"
    >
      <Image className="w-6 h-6" />
    </label>
    <input type="file" id="images" accept="image/*" hidden multiple onChange={handleImageUpload} />

    <label
      htmlFor="videos"
      className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 transition cursor-pointer border rounded-md"
    >
      <VideoIcon className="w-6 h-6" />
    </label>
    <input type="file" id="videos" accept="video/*" hidden multiple onChange={handleVideoUpload} />
  </div>

  {/* Publish Button */}
  {loading && (
  <button
    onClick={() => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setLoading(false);
    }}
    className="ml-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
  >
    Cancel
  </button>
)}
  <button
    onClick={handleSubmit}
    disabled={loading}
    className="btn px-6 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-dark)] transition flex-1 sm:flex-none"
  >
    {loading ? "Publishing..." : "Publish Post"}
  </button>

{uploadProgress > 0 &&  (
  <div className="w-full mt-3 flex flex-col gap-1">
    <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
      {uploadState} 
      {uploadState === "Uploading..." && `${uploadProgress}%`}
      {uploadState === "Processing..." && (
        <svg className="animate-spin h-4 w-4 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      )}
    </p>

    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="bg-blue-500 h-2 transition-all"
        style={{ width: uploadState === "Uploading..." ? `${uploadProgress}%` : "100%" }}
      ></div>
    </div>
  </div>
)}


</div>
        </div>
      </div>

    {alert && (
  <CustomAlert
    message={alert.message}
    type={alert.type}
    onClose={() => setAlert(null)} // <- overlay will disappear immediately
  />
)}


      {/* Media queries to improve responsiveness */}
      <style>{`
        @media (max-width: 640px) {
          textarea { min-height: 100px; }
          .flex-wrap { gap: 4px; }
        }
      `}</style>
    </div>
  );
};

export default CreatePost;