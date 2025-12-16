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


  // ✅ Fetch stories from server
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
  <div className="w-[100%] lg:max-w-2xl no-scrollbar overflow-x-auto px-4 min-h-[120px]">
    {loading ? (
      // shimmer loading
      <div className="flex items-center justify-center w-full py-10 text-slate-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center mx-2 relative overflow-hidden">
            <div className="h-38 w-30 bg-gray-300 rounded-lg overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer"></div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex gap-4 py-10">

        {/* ➕ Add Story Card */}
        <div
          onClick={handleAddStoryClick}
          className="rounded-lg shadow-sm min-w-30 max-w-30 max-h-40 aspect-[3/4]
            cursor-pointer hover:shadow-lg transition-all duration-200 
            border-2 border-dashed border-[var(--input-border)] flex items-center justify-center"
          style={{ background: "var(--hover-gradient)" }}
        >
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="size-10 bg-[var(--primary)] rounded-full flex items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-[var(--text-main)]" />
            </div>
            <p className="text-sm font-medium text-slate-700 text-center">
              Add Story
            </p>
          </div>
        </div>

        {/* ❌ Fetch error */}
        {fetchError && (
          <div className="flex flex-col items-center justify-center w-full py-10 text-slate-500 font-medium">
            <XCircle className="w-8 h-8 mb-2" />
            Failed to fetch stories
          </div>
        )}

        {/* 😢 No stories */}
        {!fetchError && noStories && (
          <div className="flex flex-col items-center  justify-center w-full py-10 text-slate-500 font-medium">
            <Inbox className="w-8 h-8 mb-2 " />
            No stories available
            <div onClick={handleAddStoryClick} className="btn mt-3">create one now</div>
          </div>
        )}

        {/* 🖼️ Story Cards */}
{/* Story Cards */}
{!fetchError &&
 !noStories &&
 stories.map((story) => {
   const isImage = story.media_type === "image";
   const isVideo = story.media_type === "video";

   return (
     <div
       key={story._id || story.id}
       onClick={() => handleViewStoryClick(story)}
       className="relative rounded-lg shadow min-w-33 max-w-33 max-h-42 cursor-pointer transition-all duration-200 active:scale-95 hover:shadow-lg story-gradient overflow-hidden"
     >
       {/* Background media */}
       {isImage && (
         <img
           src={story.media_url}
           alt={story.title}
           loading="lazy"
           className="h-full w-full object-cover opacity-70 hover:opacity-90 transition duration-300"
         />
       )}

       {isVideo && (
         <video
           ref={(el) => (story.videoRef = el)}
           src={story.media_url}
           muted
           playsInline
           preload="metadata" // <-- important: loads metadata and first frame only
           poster={story.thumbnail_url || ""} // optional: use a thumbnail if available
           className="h-full w-full object-cover opacity-70 hover:opacity-90 transition duration-300"
         />
       )}

       {/* User Avatar */}
       <div className="absolute top-1 left-1 z-10">
         <div className="w-10 h-10 rounded-full ring ring-gray-100 shadow overflow-hidden flex items-center justify-center">
           <img
             src={story.user?.profile_image || assets.defaultProfile}
             alt={story.user?.username || "User"}
             className="w-10 h-10 object-cover"
           />
         </div>
       </div>

       {/* Content */}
       {(story.content?.trim() || story.title?.trim()) && (
         <p className="absolute top-18 left-3 z-10 text-[var(--text-main)] text-sm truncate max-w-24">
           {story.content?.trim() || story.title?.trim()}
         </p>
       )}

       {/* Timestamp */}
       <p className="text-[var(--text-main)] absolute bottom-1 right-2 z-10 text-xs">
         {moment(story.createdAt).fromNow()}
       </p>
     </div>
   );
 })}

      </div>
    )}

    {/* Modals */}
    {showModal && (
      <StoryModal
        setShowModal={setShowModal}
        fetchStories={fetchStories}
      />
    )}

    {viewStory && (
      <StoryViewer
        viewStory={viewStory}
        setViewStory={setViewStory}
        stories={stories}
      />
    )}
  </div>
);

}
