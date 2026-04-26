import { useState, useEffect, useRef, useCallback } from "react";
import { Megaphone, X, Globe, PenLine} from "lucide-react";
import axios from "axios";
import Loading from "../component/shared/Loading";
import StoriesBar from "../component/StoriesBar";
import { useNavigate } from "react-router-dom";
import PostCard from "../component/PostCard";
import location from "../utils/location";
import { useAuth } from "../context/AuthContext";
import InfiniteScrollTrigger from "../component/InfiniteScrollTrigger";
import PostViewer from "../component/PostViewer";
import useInView from "../hooks/useInView"; // ⬅️ Add this at top
import PostWrapper from "../component/shared/PostWrapper";
import MediaViewer from "../component/shared/MediaViewer";
import ShareModal from "../component/ShareModal";
import LiveMapModal from "../component/LiveMapModal";
import PostCardSkeleton from "../component/shared/PostCardSkeleton";
import RightSidebar from "../component/RightSidebar";
import { runOncePerSession } from "../utils/runOncePerSession";
import assets from "../assets/assets";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";
import RefreshButton from "../component/shared/RefreshButton";
import CustomAlert from "../component/shared/CustomAlert";
import { EmptyFeed } from "../component/staterep/EmptyFeed";
import CreatePostTrigger from "../component/shared/CreatePostTrigger";
import DailyGuidance from "../component/accountability/DailyGuidance";


const Feed = () => {
  const { user, token, sponsors } = useAuth();
  const BASE = import.meta.env.VITE_SERVER;

  const [feeds, setFeeds] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedPostIndex, setSelectedPostIndex] = useState(null); // 
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const pageRef = useRef(1);
  const [ref, inView] = useInView();
  const navigate = useNavigate()
  const [currentPost, setCurrentPost] = useState(null)
  const [showLiveMap, setShowLiveMap] = useState(false);
  const [sharesCount, setSharesCount] = useState(0);
  const [alert, setAlert] = useState({ show: false, message: "", type: "info" });
  const showAlert = (message, type = "info") => setAlert({ show: true, message, type });



  const authHeaders = { Authorization: `Bearer ${token}` };

  const getLocation = async (userId) => {
    try {
      const { latitude, longitude, city, country } = await location();
      await axios.get(`${BASE}api/user/getlocation`, {
        params: { userId, currentCity: city, country, latitude, longitude },
        headers: authHeaders,
      });
    } catch (err) {
      console.error("❌ Location error:", err.message);
    }
  };

  const fetchFeeds = useCallback(
    async (reset = false) => {
      if (loadingMore) return;

      try {
        if (reset) pageRef.current = 1;
        reset ? setLoadingInitial(true) : setLoadingMore(true);

        const res = await axios.get(`${BASE}api/posts/feed`, {
          params: { page: pageRef.current, limit: 10 },
          headers: authHeaders,
        });

        const { posts = [], hasMore: backendHasMore } = res.data;

        if (reset) setFeeds(posts);
        else setFeeds((prev) => [...prev, ...posts]);

        setHasMore(backendHasMore);

        if (backendHasMore) pageRef.current += 1;
      } catch (err) {
        console.error("Feed fetch error:", err.message);
        if (reset)
          setFeeds(
            localStorage.getItem("springsconnectfeeds")
              ? JSON.parse(localStorage.getItem("springsconnectfeeds"))
              : assets.dummyPostData
          );
        setError("Failed to load live feed, showing fallback data.");
        setHasMore(false);
      } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [loadingMore, authHeaders, BASE]
  );


  const handleShareUpdate = (postId, newCount) => {
    setFeeds(prev =>
      prev.map(p =>
        p._id === postId ? { ...p, sharesCount: newCount } : p
      )
    );
  };

  // Scroll position persistence keys
  const FEED_SCROLL_KEY = 'feed_scroll_position';
  const FEED_DATA_KEY = 'feed_cached_data';

  // Manual refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeeds(true);
  };

  // Reset refreshing state after loading completes
  useEffect(() => {
    if (!loadingInitial && isRefreshing) {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [loadingInitial, isRefreshing]);



useEffect(() => {
  // runOncePerSession({
  //   key: "springs_connect_feeds",
  //   callback: () => {
      fetchFeeds(true);
      getLocation(user._id);
  
  //   },
  //   debug: false // set to true for logging
  // });
}, []);

// Restore scroll position and cached data on mount (no auto-refresh)
useEffect(() => {
  // Restore scroll position
  const savedScroll = localStorage.getItem(FEED_SCROLL_KEY);
  if (savedScroll) {
    setTimeout(() => window.scrollTo(0, parseInt(savedScroll, 10)), 100);
  }
  
  // Load cached data if available (don't fetch fresh)
  const cachedData = localStorage.getItem(FEED_DATA_KEY);
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      setFeeds(parsed);
      setLoadingInitial(false);
    } catch (e) {
      console.warn('Failed to load cached feed:', e);
      fetchFeeds(true);
    }
  } else {
    // First visit - fetch fresh
    fetchFeeds(true);
  }
  
  getLocation(user._id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// Save scroll position on scroll
useEffect(() => {
  const handleScroll = () => {
    localStorage.setItem(FEED_SCROLL_KEY, window.scrollY.toString());
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Save feed data to cache when it changes
useEffect(() => {
  if (feeds.length > 0) {
    localStorage.setItem(FEED_DATA_KEY, JSON.stringify(feeds));
  }
}, [feeds]);

  useEffect(() => {
    console.log("FEED IDS:", feeds.map((f) => f._id));
  }, [feeds]);



  return (
    <div className="w-full min-h-screen no-scrollbar bg-[var(--off-white)] flex justify-center relative overflow-x-hidden">
      <div className="w-full max-w-[100vw] no-scrollbar flex flex-wrap gap-0 px-0 sm:px-0">
        {/* Main Feed */}
        <main
          className="page-container flex-1 min-h-screen overflow-y-auto py-8 mx-auto box-border overflow-x-hidden
          [&::-webkit-scrollbar]:hidden no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* Refresh Button */}
          <div className="flex justify-end mb-2 px-4">
            <RefreshButton 
              onRefresh={handleRefresh} 
              isRefreshing={isRefreshing}
              label="Refresh"
            />
          </div>
          
          <StoriesBar />

          {error && (
            <div className="bg-red-100 text-red-600 p-2 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {/* Daily Accountability Guidance */}
          {user && (
            <div className="max-w-[500px] mx-auto px-4">
              <DailyGuidance user={user} />
            </div>
          )}

 {/* <p
  className="
    inline-block
    btn
    text-white font-semibold 
    text-sm sm:text-base 
    px-4 py-2 rounded-lg 
    shadow-lg shadow-cyan-200/50
    cursor-pointer
    transform transition-all duration-300
    hover:scale-105 hover:shadow-xl hover:brightness-110
    active:scale-95
    mb-3
    ml-6
    border-2 border-blue-300
  "
  onClick={() => setShowLiveMap(true)}
>
  Live Location <Globe className="ml-4"/>
</p>  */}
<CreatePostTrigger />

          {/* Live Map Floating Button */}
          <button
            onClick={() => setShowLiveMap(true)}
            className="fixed bottom-6 right-6 z-40 bg-[var(--primary-color)] text-white p-4 rounded-full shadow-lg shadow-[var(--primary-color)]/30 hover:shadow-xl hover:shadow-[var(--primary-color)]/40 hover:scale-105 transition-all duration-300 flex items-center gap-2 group"
            title="View Live Map"
          >
            <Globe className="w-5 h-5 group-hover:animate-spin-slow" />
            <span className="hidden md:inline text-sm font-medium">Live Map</span>
          </button>


          <div className="space-y-6 py-5 no-scrollbar pb-25 relative max-w-[500px] mx-auto">
            {loadingInitial ? (
      <PostCardSkeleton />
    ) :    feeds.length === 0 ? (
  <EmptyFeed />
): feeds.map((post, i) => (
  <PostWrapper
  key={post._id}
  index={i}
  post={post}
  onOpenPost={(i) => setSelectedPostIndex(i)}
  onOpenMedia={(mediaIndex) => {
    setCurrentPost(post);
    setViewerOpen(true);
    setViewerIndex(mediaIndex);
    setSelectedMediaIndex(mediaIndex);
  }}
>
  {({ handleClick }) => (
    <PostCard
      post={post}
      setFeeds={setFeeds}
      onShare={() => {
        setCurrentPost(post);
        setShowShareModal(true);
      }}
      // single click on image
      onImageClick={(index) => handleClick("image", index)}
      // double click on header
      onHeaderClick={() => handleClick("header")}
      sharedBy={post.sharedForMe ? post.sharedBy : null}
      sharedMessage={post.sharedForMe ? post.sharedMessage : null}
      showAlert={showAlert}
    />
  )}
</PostWrapper>

            ))}



          </div>

          {hasMore && (
            <InfiniteScrollTrigger onReachBottom={() => fetchFeeds(false)} />
          )}
          {loadingMore && (
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
        </main>

        {/* Sidebar */}
      <RightSidebar sponsors={sponsors} loading={!sponsors} />

        {/* Sidebar toggle (medium screens) */}
  <MediumSidebarToggle sponsors={sponsors} />

        {/* MEDIA VIEWER */}
        {viewerOpen && (
          <MediaViewer
            post={currentPost}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}
        {alert.show && (
  <CustomAlert
    message={alert.message}
    type={alert.type}
    onClose={() => setAlert({ ...alert, show: false })}
  />
)}
        {/* POST VIEWER */}
        {selectedPostIndex !== null && (
          <PostViewer
            feed={feeds}
            currentIndex={selectedPostIndex}
            onClose={() => setSelectedPostIndex(null)}
            onNavigate={(i) => setSelectedPostIndex(i)}
          />
        )}

        <LiveMapModal open={showLiveMap} onClose={() => setShowLiveMap(false)} />


        {showShareModal && currentPost && (
          <ShareModal
            post={currentPost}
            onClose={() => setShowShareModal(false)}
            onShareSuccess={(newCount) =>
              handleShareUpdate(currentPost._id, newCount)
            }
          />
        )}


      </div>
    </div>
  );
};

export default Feed;
