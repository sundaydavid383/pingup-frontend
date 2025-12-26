import { useState, useEffect } from "react";
import { Inbox, Plus, XCircle } from "lucide-react";
import "../styles/ui.css";
import assets from "../assets/assets";
import moment from "moment";
import StoryModal from "./StoryModal";
import StoryViewer from "./StoryViewer";
import "./story.css";
import axios from "../utils/axiosBase";

export default function StoriesBar() {
  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setViewStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [noStories, setNoStories] = useState(false);
  const [count, setCount] = useState(window.innerWidth <= 560 ? 3 : 5);

  useEffect(() => {
    const handleResize = () => {
      setCount(window.innerWidth <= 560 ? 3 : 5);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    setFetchError(false);
    setNoStories(false);
    try {
      const res = await axios.get("/api/stories", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data?.stories && res.data.stories.length > 0) {
        setStories(res.data.stories);
      } else {
        setNoStories(true);
        setStories([]);
      }
    } catch (err) {
      console.error("❌ Error fetching stories:", err.message);
      setFetchError(true);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleAddStoryClick = () => setShowModal(true);
  const handleViewStoryClick = (story) => setViewStory(story);

  return (
    <div className="w-[100%] lg:max-w-2xl no-scrollbar overflow-x-auto px-4 min-h-[140px]">
      {loading ? (
        <div className="flex items-center justify-center w-full py-10 text-slate-500">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex flex-col items-center mx-2 relative overflow-hidden">
              <div className="h-44 w-30 bg-gray-300 rounded-lg overflow-hidden animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 py-10">
          {/* Add Story Card */}
          <div
            onClick={handleAddStoryClick}
            className="rounded-lg shadow-sm min-w-24 max-w-24 max-h-36 sm:min-w-30 sm:max-w-30 sm:max-h-44 aspect-[3/4] cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-[var(--input-border)] flex items-center justify-center bg-zinc-900"
          >
            <div className="h-full flex flex-col items-center justify-center p-3 sm:p-4 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--primary)] rounded-full flex items-center justify-center mb-2">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <p className="text-xs font-medium text-slate-300">Add Story</p>
            </div>
          </div>

          {fetchError && (
            <div className="flex flex-col items-center justify-center w-full py-10 text-slate-500">
              <XCircle className="w-8 h-8 mb-2" />
              <p>Failed to fetch stories</p>
            </div>
          )}

          {!fetchError && noStories && (
            <div className="flex flex-col items-center justify-center w-full py-10 text-slate-500">
              <Inbox className="w-8 h-8 mb-2" />
              <p>No stories yet</p>
            </div>
          )}

         {/* 🖼️ Story Cards Mapping in StoriesBar.jsx */}
{!fetchError && !noStories && stories.map((story) => {
  const rawUser = story.user || {};
  const displayName = rawUser.name || rawUser.full_name || rawUser.displayName || "";
  
  return (
    <div
      key={story._id || story.id}
      onClick={() => handleViewStoryClick(story)}
      className="relative rounded-lg shadow min-w-24 max-w-24 h-36 sm:min-w-33 sm:max-w-33 sm:h-44 cursor-pointer transition-all duration-200 active:scale-95 hover:shadow-lg overflow-hidden bg-zinc-800"
    >
      {/* Background Media */}
      {story.media_type === "image" ? (
        <img src={story.media_url} className="h-full w-full object-cover opacity-60 hover:opacity-80 transition" alt="" />
      ) : (
        <video src={story.media_url} className="h-full w-full object-cover opacity-60" />
      )}

      {/* --- ADDED: Text Preview Overlay --- */}
      {story.content && (
        <div className="absolute inset-0 flex items-center justify-center p-2 z-[5] pointer-events-none">
          <p className="text-white text-[10px] sm:text-xs text-center font-medium line-clamp-3 bg-black/30 rounded px-1 backdrop-blur-[2px]">
            {story.content}
          </p>
        </div>
      )}

      {/* --- HEADER: Profile (Circle) + Time --- */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 max-w-[95%]">
        <div className="w-8 h-8 rounded-full ring-2 ring-[var(--primary)] overflow-hidden flex-shrink-0 aspect-square">
          <img
            src={rawUser.profile_image || assets.defaultProfile}
            className="w-full h-full object-cover rounded-full aspect-square"
            alt="pfp"
          />
        </div>
        <p className="text-white text-[9px] font-medium drop-shadow-lg truncate">
          {moment(story.createdAt).fromNow(true)}
        </p>
      </div>

      {/* --- BOTTOM: Display Name --- */}
      <div className="absolute bottom-2 left-0 w-full px-2 z-10">
        <p className="text-white text-[10px] font-semibold truncate drop-shadow-lg">
          {displayName}
        </p>
      </div>
    </div>
  );
})}
        </div>
      )}

      {showModal && <StoryModal setShowModal={setShowModal} fetchStories={fetchStories} />}
      {viewStory && <StoryViewer viewStory={viewStory} setViewStory={setViewStory} stories={stories} />}
    </div>
  );
}