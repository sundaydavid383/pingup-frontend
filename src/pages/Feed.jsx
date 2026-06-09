import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Megaphone, X, Globe, PenLine } from "lucide-react";
import axios from "axios";
import Loading from "../component/shared/Loading";
import StoriesBar from "../component/StoriesBar";
import { useNavigate } from "react-router-dom";
import PostCard from "../component/PostCard";
import location from "../utils/location";
import { useAuth } from "../context/AuthContext";
import PostViewer from "../component/PostViewer";
import PostWrapper from "../component/shared/PostWrapper";
import MediaViewer from "../component/shared/MediaViewer";
import ShareModal from "../component/ShareModal";
import LiveMapModal from "../component/LiveMapModal";
import PostCardSkeleton from "../component/shared/PostCardSkeleton";
import RightSidebar from "../component/RightSidebar";
import assets from "../assets/assets";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";
import RefreshButton from "../component/shared/RefreshButton";
import CustomAlert from "../component/shared/CustomAlert";
import { EmptyFeed } from "../component/staterep/EmptyFeed";
import CreatePostTrigger from "../component/shared/CreatePostTrigger";
import DailyGuidance from "../component/accountability/DailyGuidance";
// ✅ Use your existing socket from SocketContext
import { useSocket } from "../context/SocketContext";

// ─── Remove InfiniteScrollTrigger import — we no longer use it ───
// import InfiniteScrollTrigger from "../component/InfiniteScrollTrigger";
// ─── Remove useInView import — replaced by a manual IntersectionObserver ───
// import useInView from "../hooks/useInView";

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
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [currentPost, setCurrentPost] = useState(null);
  const [showLiveMap, setShowLiveMap] = useState(false);
  const [sharesCount, setSharesCount] = useState(0);
  const [alert, setAlert] = useState({ show: false, message: "", type: "info" });
  const [newPostsBanner, setNewPostsBanner] = useState(false);

  const pageRef = useRef(1);
  const sessionIdRef = useRef(null);
  const mainRef = useRef(null);
  // ✅ FIX 1 & 2: loadingMoreRef lives here at the top — one stable ref, never recreated
  const loadingMoreRef = useRef(false);
  // ✅ FIX 5: One sentinel ref for the IntersectionObserver — replaces both
  //    InfiniteScrollTrigger and useInView so only one trigger fires
  const sentinelRef = useRef(null);

  const navigate = useNavigate();
  const showAlert = (message, type = "info") => setAlert({ show: true, message, type });

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );
  const { socket } = useSocket();
  const dedupePosts = (posts = []) => {
    const seen = new Set();
    return Array.isArray(posts)
      ? posts.filter((post) => {
          const id = post?._id?.toString();
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
      : [];
  };

  const getLocation = useCallback(
    async (userId) => {
      if (!userId) return;
      try {
        const { latitude, longitude, city, country } = await location();
        await axios.get(`${BASE}api/user/getlocation`, {
          params: { userId, currentCity: city, country, latitude, longitude },
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("❌ Location error:", err.message);
      }
    },
    [BASE, token]
  );

  // ✅ FIX 1: setLoadingMoreBoth is gone. We update ref AND state inline inside
  //    fetchFeeds itself, so there's no stale-function problem at all.

  const fetchFeeds = useCallback(
    async (reset = false) => {
      // ✅ FIX 2 (part a): Guard uses the ref — never stale
      if (loadingMoreRef.current) return;

      try {
        if (reset) {
          pageRef.current = 1;
          sessionIdRef.current = null;
        }

        // ✅ FIX 1 & 2 (part b): Update BOTH ref and state right here — no helper needed
        if (reset) {
          setLoadingInitial(true);
        } else {
          loadingMoreRef.current = true;  // block re-entry immediately (sync)
          setLoadingMore(true);           // update UI (async)
        }

        const params = { page: pageRef.current, limit: 10 };
        if (!reset && sessionIdRef.current) {
          params.sessionId = sessionIdRef.current;
        }

        const res = await axios.get(`${BASE}api/posts/feed`, {
          params,
          headers: authHeaders,
        });

        const { posts = [], hasMore: backendHasMore, sessionId } = res.data;

        if (sessionId) sessionIdRef.current = sessionId;

        if (reset) {
          setFeeds(dedupePosts(posts));
        } else {
          setFeeds((prev) => dedupePosts([...prev, ...posts]));
        }

        setHasMore(backendHasMore ?? false);
        if (backendHasMore) pageRef.current += 1;

      } catch (err) {
        console.error("Feed fetch error:", err.message);
        if (reset) {
          const cached = localStorage.getItem("springscirclefeeds");
          if (cached) setFeeds(dedupePosts(JSON.parse(cached)));
        }
        setError("Failed to load live feed, showing fallback data.");
        setHasMore(false);
      } finally {
        // ✅ FIX 2 (part c): ALWAYS reset BOTH ref and state in finally
        loadingMoreRef.current = false;
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [authHeaders, BASE]
    // ✅ loadingMoreRef intentionally NOT in deps — refs are stable and never need to be
  );

  // ✅ FIX 5: Single IntersectionObserver — replaces InfiniteScrollTrigger + useInView.
  //    Observes a tiny invisible div at the bottom of the feed list.
  //    Only one thing watches the sentinel, so only one fetch fires per scroll event.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loadingMoreRef.current && !loadingInitial) {
          console.log("👁️ Sentinel visible — fetching more");
          fetchFeeds(false);
        }
      },
      {
        // ✅ Use mainRef.current as root so it watches scroll inside the feed div,
        //    not the window. Without this, the observer fires based on window viewport
        //    and may never trigger inside a scrollable div.
        root: mainRef.current,
        rootMargin: "0px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // Re-run when hasMore or loadingInitial change so the callback has fresh values
  }, [hasMore, loadingInitial, fetchFeeds]);

  // ✅ FIX 3: Socket effect — getSocket now imported correctly at the top of the file
useEffect(() => {
  if (!socket || !user?._id) return;

  const handleNewPost = (data) => {
    if (data?.authorId === user._id?.toString()) return;
    console.log("📡 New post detected:", data);
    setNewPostsBanner(true);
  };

  socket.on("newPostCreated", handleNewPost);
  return () => socket.off("newPostCreated", handleNewPost);
}, [socket, user?._id]);

  const handleShareUpdate = (postId, newCount) => {
    setFeeds((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, sharesCount: newCount } : p))
    );
  };

  const FEED_SCROLL_KEY = "feed_scroll_position";
  const FEED_DATA_KEY = "feed_cached_data";
  const FEED_TIMESTAMP_KEY = "feed_cached_timestamp";
  const CACHE_TTL = 5 * 60 * 1000;
  const JUST_POSTED_KEY = "just_posted";
  const JUST_POSTED_TTL = 60 * 1000;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setNewPostsBanner(false);
    fetchFeeds(true);
  };

  useEffect(() => {
    if (!loadingInitial && isRefreshing) {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [loadingInitial, isRefreshing]);

  // ✅ FIX 4: initializeFeed — fetchFeeds and getLocation added to the ref so the
  //    effect always calls the current version, but we still only re-run on user change.
  //    We do this with a ref trick: store latest callbacks in a ref, call via ref inside
  //    the effect. This avoids stale closures without adding them to the dep array
  //    (which would cause infinite re-runs since fetchFeeds is a new function on each render).
  const fetchFeedsRef = useRef(fetchFeeds);
  const getLocationRef = useRef(getLocation);
  useEffect(() => { fetchFeedsRef.current = fetchFeeds; }, [fetchFeeds]);
  useEffect(() => { getLocationRef.current = getLocation; }, [getLocation]);

  useEffect(() => {
    const initializeFeed = async () => {
      if (!user?._id) return;

      const justPostedRaw = sessionStorage.getItem(JUST_POSTED_KEY);
      if (justPostedRaw) {
        // ✅ Clear BEFORE any async work so re-mounts don't re-pin
        sessionStorage.removeItem(JUST_POSTED_KEY);
        try {
          const { post: newPost, timestamp } = JSON.parse(justPostedRaw);
          if (newPost && Date.now() - timestamp < JUST_POSTED_TTL) {
            await fetchFeedsRef.current(true);
            await getLocationRef.current(user._id);
            return;
          }
        } catch (e) { /* ignore */ }
      }

      const cachedData = sessionStorage.getItem(FEED_DATA_KEY);
      const cachedTime = sessionStorage.getItem(FEED_TIMESTAMP_KEY);
      const isStale = !cachedTime || Date.now() - parseInt(cachedTime) > CACHE_TTL;
      const savedScroll = sessionStorage.getItem(FEED_SCROLL_KEY);

      if (cachedData && !isStale) {
        try {
          const parsed = JSON.parse(cachedData);
          setFeeds(dedupePosts(parsed));
          setLoadingInitial(false);
          if (savedScroll && mainRef.current) {
            mainRef.current.scrollTo({ top: parseInt(savedScroll, 10), behavior: "auto" });
          }
        } catch (e) {
          await fetchFeedsRef.current(true);
        }
      } else {
        await fetchFeedsRef.current(true);
        if (savedScroll && mainRef.current) {
          mainRef.current.scrollTo({ top: parseInt(savedScroll, 10), behavior: "auto" });
        }
      }

      await getLocationRef.current(user._id);
    };

    initializeFeed();
  }, [user?._id]); // ✅ Only user._id — fetchFeeds/getLocation accessed via stable refs

  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;
    const handleScroll = () => {
      sessionStorage.setItem(FEED_SCROLL_KEY, container.scrollTop.toString());
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (feeds?.length > 0) {
      sessionStorage.setItem(FEED_DATA_KEY, JSON.stringify(feeds));
      sessionStorage.setItem(FEED_TIMESTAMP_KEY, Date.now().toString());
    }
  }, [feeds]);

  return (
    <div className="w-full min-h-screen no-scrollbar bg-[var(--off-white)] flex justify-center relative overflow-x-hidden">
      <div className="w-full max-w-[100vw] no-scrollbar flex flex-wrap gap-0 px-0 sm:px-0">
        <main
          ref={mainRef}
          className="page-container flex-1 h-screen overflow-y-scroll py-8 mx-auto box-border overflow-x-hidden
            [&::-webkit-scrollbar]:hidden no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <RefreshButton
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            scrollTargetRef={mainRef}
          />

          {newPostsBanner && (
            <div
              onClick={handleRefresh}
              className="sticky top-2 z-30 mx-auto w-fit cursor-pointer mb-3
                bg-[var(--primary)] text-white text-sm font-semibold
                px-4 py-2 rounded-full shadow-lg flex items-center gap-2
                hover:bg-[var(--primary-dark)] transition-all animate-bounce-once"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              New posts available — tap to refresh
            </div>
          )}

          <StoriesBar />

          {error && (
            <div className="bg-red-100 text-red-600 p-2 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {user && (
            <div className="max-w-[500px] mx-auto px-4">
              <DailyGuidance user={user} />
            </div>
          )}

          <CreatePostTrigger />

          <button
            onClick={() => setShowLiveMap(true)}
            className="fixed bottom-6 right-6 z-40 bg-[var(--primary-color)] text-white p-4 rounded-full shadow-lg"
            title="View Live Map"
          >
            <Globe className="w-5 h-5" />
          </button>

          <div className="space-y-6 py-5 no-scrollbar pb-25 relative max-w-[500px] mx-auto">
            {loadingInitial ? (
              <PostCardSkeleton />
            ) : feeds?.length === 0 ? (
              <EmptyFeed />
            ) : (
              feeds?.map((post, i) => (
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
                      onImageClick={(index) => handleClick("image", index)}
                      onHeaderClick={() => handleClick("header")}
                      sharedBy={post.sharedForMe ? post.sharedBy : null}
                      sharedMessage={post.sharedForMe ? post.sharedMessage : null}
                      showAlert={showAlert}
                    />
                  )}
                </PostWrapper>
              ))
            )}

            {/* ✅ FIX 5: Single sentinel div — the IntersectionObserver above watches this.
                Remove <InfiniteScrollTrigger> entirely. This div is invisible (h-1)
                and sits at the bottom of the list. When it scrolls into view inside
                mainRef, the observer fires fetchFeeds(false). */}
            <div ref={sentinelRef} style={{ height: "1px" }} aria-hidden="true" />
          </div>

          {/* ✅ Remove <InfiniteScrollTrigger> — sentinel above replaces it */}

          {loadingMore && (
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
        </main>

        <RightSidebar sponsors={sponsors} loading={!sponsors} />
        <MediumSidebarToggle sponsors={sponsors} />

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
            onShareSuccess={(newCount) => handleShareUpdate(currentPost._id, newCount)}
          />
        )}
      </div>
    </div>
  );
};

export default Feed;