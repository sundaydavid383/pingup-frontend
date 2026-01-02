import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/ui.css";
import assets from "../assets/assets";
import StoryModal from "./StoryModal";
import StoryViewer from "./StoryViewer";
import "./story.css";
import axios from "../utils/axiosBase";
import { useAuth } from "../context/AuthContext"; // Import Auth context

export default function StoriesBar() {
  const { user: currentUser } = useAuth(); // Access the logged-in user
  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setViewStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [noStories, setNoStories] = useState(false);
  const scrollRef = useRef(null);

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

  /**
   * Filter the list to find the current user's stories
   */
  const myStories = useMemo(() => {
    return stories.filter(s => {
      const sUid = s.user?.userId || s.user?._id || s.user?.id;
      const currentId = currentUser?._id || currentUser?.id;
      return String(sUid) === String(currentId);
    });
  }, [stories, currentUser]);

  const hasMyStory = myStories.length > 0;

  /**
   * Grouping Logic: Exclude current user from the main list 
   * to avoid duplication since they are now the first item.
   */
  const groupedStories = useMemo(() => {
    const userMap = new Map();
    const currentId = currentUser?._id || currentUser?.id;
    
    stories.forEach((story) => {
      const userId = story.user?.userId || story.user?._id || story.user?.id;
      // Skip the current user's stories in the general list
      if (String(userId) !== String(currentId) && !userMap.has(userId)) {
        userMap.set(userId, story);
      }
    });
    
    return Array.from(userMap.values());
  }, [stories, currentUser]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const handleAddStoryClick = (e) => {
    if (e) e.stopPropagation();
    setShowModal(false) || setShowModal(true);
  };

  const handleViewStoryClick = (story) => setViewStory(story);

  return (
    <div className="relative group w-full lg:max-w-2xl mx-auto px-2">
      
      {/* ⬅️ Previous Button */}
      <button 
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-zinc-800/90 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex border border-white/10"
      >
        <ChevronLeft size={20} />
      </button>

      <div 
        ref={scrollRef}
        className="flex items-center gap-4 py-4 overflow-x-auto no-scrollbar scroll-smooth px-2"
      >
        {/* Updated "Your Story" Button */}
        <div className="flex flex-col items-center gap-1.5 min-w-[75px]">
          <div 
            onClick={hasMyStory ? () => handleViewStoryClick(myStories[0]) : handleAddStoryClick}
            className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 
              ${hasMyStory ? 'p-[2.5px] ring-2 ring-blue-500' : 'border-2 border-dashed border-gray-600 bg-zinc-900 hover:bg-zinc-800'}`}
          >
            {hasMyStory ? (
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-zinc-800 story-circle-container">
                <img
                  src={currentUser?.profile_image || currentUser?.profilePicUrl || assets.defaultProfile}
                  className="story-image-fill"
                  alt="Your Story"
                />
              </div>
            ) : (
              <Plus className="w-6 h-6 text-gray-400" />
            )}

            {/* Small add icon overlay when a story already exists */}
            {hasMyStory && (
              <div 
                onClick={handleAddStoryClick}
                className="absolute bottom-0 right-0 bg-blue-600 rounded-full border-2 border-black p-0.5 hover:bg-blue-500 transition-colors"
              >
                <Plus size={12} className="text-white" />
              </div>
            )}
          </div>
          <p className="text-[11px] font-medium text-slate-400">Your Story</p>
        </div>

        {/* Loading Skeletons */}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-[75px] animate-pulse">
            <div className="w-16 h-16 rounded-full bg-zinc-800" />
            <div className="h-2 w-10 bg-zinc-800 rounded" />
          </div>
        ))}

        {/* Display Grouped Stories */}
        {!loading && !fetchError && groupedStories.map((story) => {
          const rawUser = story.user || {};
          const displayName = rawUser.name || rawUser.full_name || rawUser.displayName || "User";
          
          return (
            <div
              key={story._id || story.id}
              onClick={() => handleViewStoryClick(story)}
              className="flex flex-col items-center gap-1.5 min-w-[75px] cursor-pointer group/item"
            >
              <div className="p-[2.5px] rounded-full ring-2 ring-blue-500 transition-transform group-active/item:scale-90">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-black bg-zinc-800 story-circle-container">
                  <img
                    src={rawUser.profile_image || assets.defaultProfile}
                    className="story-image-fill"
                    alt={displayName}
                  />
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-200 truncate w-full text-center">
                {displayName.split(" ")[0]}
              </p>
            </div>
          );
        })}

        {fetchError && <div className="text-red-400 text-xs px-4">Error loading</div>}
        {!loading && noStories && groupedStories.length === 0 && !hasMyStory && (
          <div className="text-zinc-500 text-xs italic px-4">No updates</div>
        )}
      </div>

      {/* ➡️ Next Button */}
      <button 
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-zinc-800/90 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex border border-white/10"
      >
        <ChevronRight size={20} />
      </button>

      {showModal && <StoryModal setShowModal={setShowModal} fetchStories={fetchStories} />}
      
      {viewStory && (
        <StoryViewer 
          viewStory={viewStory} 
          setViewStory={setViewStory} 
          stories={stories} 
          setStories={setStories}
        />
      )}
    </div>
  );
}