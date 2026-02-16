import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { X, Image, Video as VideoIcon, Trash2, Headphones, Youtube, Link, AlertCircle } from "lucide-react";
import CustomAlert from "../component/shared/CustomAlert";
import location from "../utils/location";
import BackButton from "../component/shared/BackButton";
import ProfileAvatar from "../component/shared/ProfileAvatar"
import AudioMessage from "../component/shared/AudioMessage";
import { useNavigate } from "react-router-dom";


const CreatePost = () => {
  const { user, token } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const abortControllerRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState("");
  const [audio, setAudio] = useState(null); // stores the recorded/selected audio
  const [recording, setRecording] = useState(false); // is recording active
  const mediaRecorderRef = useRef(null); // media recorder ref
  const audioChunksRef = useRef([]); // to store audio chunks

  // YouTube embed state
  const [youtubeInput, setYoutubeInput] = useState("");
  const [youtubeError, setYoutubeError] = useState("");
  const [youtubePreview, setYoutubePreview] = useState(null);
  const [youtubeType, setYoutubeType] = useState(null); // 'iframe' or 'url'

  const textareaRef = useRef(null);

  // YouTube validation and extraction functions
  const extractVideoId = (input) => {
    // Handle full YouTube URL
    const urlPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of urlPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const validateYoutubeInput = (input) => {
    if (!input.trim()) return { valid: false, videoId: null, type: null };

    // Check if it's a complete iframe
    const iframeMatch = input.match(/<iframe[^>]*src=["']([^"']*)["'][^>]*>/i);
    if (iframeMatch) {
      const src = iframeMatch[1];
      const videoId = extractVideoId(src);
      if (videoId) {
        return { valid: true, videoId, type: 'iframe' };
      }
    }

    // Check if it's a YouTube URL
    const videoId = extractVideoId(input);
    if (videoId) {
      return { valid: true, videoId, type: 'url' };
    }

    return { valid: false, videoId: null, type: null };
  };

  const getYoutubeEmbedUrl = (videoId) => {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  };

  const handleYoutubeInputChange = (e) => {
    const value = e.target.value;
    setYoutubeInput(value);
    setYoutubeError("");

    if (!value.trim()) {
      setYoutubePreview(null);
      setYoutubeType(null);
      return;
    }

    const validation = validateYoutubeInput(value);
    if (validation.valid) {
      setYoutubePreview({
        videoId: validation.videoId,
        embedUrl: getYoutubeEmbedUrl(validation.videoId),
      });
      setYoutubeType(validation.type);
      setYoutubeError("");
    } else {
      setYoutubePreview(null);
      setYoutubeType(null);
      if (value.trim().length > 0) {
        setYoutubeError("Invalid YouTube URL or embed code");
      }
    }
  };

  const handleRemoveYoutube = () => {
    setYoutubeInput("");
    setYoutubePreview(null);
    setYoutubeError("");
    setYoutubeType(null);
  };


  const MAX_TEXT_LENGTH = 500;
  const MAX_IMAGES = 4;
  const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
  const MAX_VIDEOS = 1;
  const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB
  const MAX_VIDEO_DURATION = 1040; // seconds

  const showAlert = (message, type = "info") => setAlert({ message, type });

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const maxHeight = window.innerHeight * 0.49; // 49vh
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };
  useEffect(() => {
    autoResizeTextarea();
  }, [content]);



  // Clean and validate text input
  const handleTextChange = (e) => {
    let value = e.target.value.replace(/\n{2,}/g, "\n").trimStart().replace(/\n+$/g, '');
    if (value.length > MAX_TEXT_LENGTH) {
      return showAlert(`Text cannot exceed ${MAX_TEXT_LENGTH} characters.`, "warning");
    }
    setContent(value);
    autoResizeTextarea();
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

    if (youtubePreview) {
      return showAlert("You cannot upload images while a YouTube video is selected. Remove the YouTube video first.", "warning");
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

    if (youtubePreview) {
      return showAlert("You cannot upload a video while a YouTube video is selected. Remove the YouTube video first.", "warning");
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
    if (!content && images.length === 0 && videos.length === 0 && !audio && !youtubePreview) {
      return showAlert("Please add content, images, videos, audio, or a YouTube video", "warning");
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
      if (audio) formData.append("media", audio);

      // Add YouTube video data
      if (youtubePreview) {
        formData.append("youtubeVideoId", youtubePreview.videoId);
        formData.append("youtubeEmbedUrl", youtubePreview.embedUrl);
        if (isDev) console.log("YouTube Video ID:", youtubePreview.videoId);
      }

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

        setContent(" ");
        setImages([]);
        setVideos([]);
        setVisibility("public");
        setYoutubeInput("");
        setYoutubePreview(null);
        setYoutubeError("");
        setYoutubeType(null);
        setTimeout(() => {
          navigate("/");
        }, 3000);



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


  const startRecording = async () => {
    if (images.length > 0 || videos.length > 0) {
      return showAlert("You cannot record audio while images or videos are selected. Delete them first.", "warning");
    }
    else if (youtubePreview) {
      return showAlert("You cannot record audio while a YouTube video is selected. Remove it first.", "warning");
    }
    else if (audio) {
      return showAlert("Audio already selected. Remove it first to record new audio.", "warning");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: "audio/webm" });
        setAudio(file);
      };

      mediaRecorder.start();
      setRecording(true);
    }
    catch (err) {
      console.error("❌ Error accessing microphone:", err);
      showAlert("Unable to access microphone.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (youtubePreview) {
      return showAlert("You cannot upload audio while a YouTube video is selected. Remove it first.", "warning");
    }

    if (file.size > 10 * 1024 * 1024) {
      return showAlert("Audio file exceeds 10MB.", "warning");
    }

    setAudio(file);
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

        <div className="relative bg-[var(--really-bright-glass)] rounded-xl shadow-md p-4 sm:p-6 space-y-4 overflow-hidden">

          {/* Blurry background highlight */}
          <div
            className="
    absolute -inset-10
    rounded-full
    blur-[120px]
    opacity-40
    pointer-events-none
    z-0
  "
            style={{
              background: "radial-gradient(circle, rgba(53, 70, 129, 0.3) 0%, rgba(30, 64, 175, 0.25) 40%, rgba(79, 95, 161, 0.3) 70%, transparent 90%)"
            }}
          ></div>


          {/* User Info */}
          <div className="relative z-10 flex items-center gap-3">
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
            ref={textareaRef}
            className="relative z-10 w-full resize-none text-sm outline-none placeholder-gray-400 border-b pb-1 overflow-hidden transition-[height] duration-150"
            style={{ minHeight: "80px", maxHeight: "49vh" }}
            placeholder="What's on your mind?"
            value={content}
            onChange={handleTextChange}
            onPaste={handlePaste}
            disabled={loading}
          />

          <div className="relative z-10 text-xs text-gray-500 text-right">
            {content.length}/{MAX_TEXT_LENGTH}
          </div>
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

          {/* YouTube Embed Input */}
          <div className="relative z-10 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Youtube className="w-5 h-5 text-[var(--primary)]" />
              <span className="text-sm font-medium text-gray-700">Add YouTube Video</span>
            </div>
            <div className={`relative rounded-lg border transition-all duration-200 ${youtubeError ? 'border-red-400 bg-red-50/50' : youtubePreview ? 'border-[var(--primary)] bg-[var(--glassy-white)]' : 'border-[var(--input-border)] bg-[var(--input-bg)]'}`}>
              <div className="flex items-center px-3 py-2">
                <Link className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <input
                  id="youtubeInput"
                  type="text"
                  value={youtubeInput}
                  onChange={handleYoutubeInputChange}
                  placeholder="Paste YouTube URL or embed code (e.g., https://www.youtube.com/watch?v=...)"
                  className="flex-1 bg-transparent outline-none text-sm text-[var(--text-main)] placeholder-gray-400"
                  disabled={loading}
                />
                {youtubePreview && (
                  <button
                    onClick={handleRemoveYoutube}
                    className="ml-2 p-1 rounded-full hover:bg-red-100 transition-colors"
                    title="Remove YouTube video"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>

              {/* Error message */}
              {youtubeError && (
                <div className="flex items-center gap-1 px-3 pb-2 text-xs text-red-500">
                  <AlertCircle className="w-3 h-3" />
                  <span>{youtubeError}</span>
                </div>
              )}
            </div>

            {/* Live YouTube Preview */}
            {youtubePreview && (
              <div className="mt-3 rounded-lg overflow-hidden border border-[var(--primary)]/30 shadow-lg">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={youtubePreview.embedUrl}
                    title="YouTube video preview"
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="px-3 py-2 bg-[var(--bg-light)]/50 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {youtubeType === 'iframe' ? 'Embed code detected' : 'URL detected'}
                  </span>
                  <span className="text-xs text-[var(--primary)] font-medium">
                    Video ID: {youtubePreview.videoId}
                  </span>
                </div>
              </div>
            )}
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
                htmlFor="audioFile"
                className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 transition cursor-pointer border rounded-md"
                title={audio ? "Audio selected" : "Upload audio file"}
              >
                < Headphones className="w-6 h-6" />
              </label>
              <input
                type="file"
                id="audioFile"
                accept="audio/*"
                hidden
                onChange={handleAudioUpload}
              />

              {/* Recording controls */}
              {!recording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 transition border rounded-md"
                  title="Start recording"
                >
                  ⏺
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center w-10 h-10 text-red-500 hover:text-red-700 transition border rounded-md"
                  title="Stop recording"
                >
                  ⏹
                </button>
              )}

              {/* Preview recorded/uploaded audio */}
              {audio && (
                <div className="flex items-center gap-2 mt-1">
                  <AudioMessage msg={{ media_url: URL.createObjectURL(audio) }} />
                  <button onClick={() => setAudio(null)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}

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

              {/* YouTube Button */}
              <button
                onClick={() => {
                  const ytInput = document.getElementById('youtubeInput');
                  if (ytInput) ytInput.focus();
                }}
                className={`flex items-center justify-center w-10 h-10 transition border rounded-md ${youtubePreview ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'text-gray-500 hover:text-gray-700 border-gray-300'}`}
                title="Add YouTube video"
              >
                <Youtube className="w-6 h-6" />
              </button>
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

            {uploadProgress > 0 && (
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