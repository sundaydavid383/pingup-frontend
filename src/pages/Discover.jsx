import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Users, Search, Sprout, X, ChevronDown, ChevronUp } from "lucide-react";
import UserCard from "../component/UserCard";
import InfiniteScrollTrigger from "../component/InfiniteScrollTrigger";
import CustomDropdown from "../component/shared/CustomDropdown";
import "./discoveries.css";
import { useAuth } from "../context/AuthContext";
import SkeletonUserCard from "../component/skeleton/SkeletonUserCard";
import RefreshButton from "../component/shared/RefreshButton";

const DISCOVER_SCROLL_KEY     = "discover_scroll_position";
const DISCOVER_DATA_KEY       = "discover_cached_data";
const DISCOVER_TIMESTAMP_KEY  = "discover_cached_timestamp";
// Relationship state (isFollowing, connectionStatus) is volatile — cache it
// for only 60 seconds so stale buttons don't linger after actions.
const CACHE_TTL = 60 * 1000;

export default function Discover() {
  const BASE = (import.meta.env.VITE_SERVER || "").replace(/\/$/, "");
  const { user } = useAuth();

  const [input,            setInput]            = useState("");
  const [users,            setUsers]            = useState([]);
  const [hasMore,          setHasMore]          = useState(true);
  const [loadingInitial,   setLoadingInitial]   = useState(false);
  const [loadingMore,      setLoadingMore]      = useState(false);
  const [fetchError,       setFetchError]       = useState(false);
  const [error,            setError]            = useState("");
  const [openDropdownId,   setOpenDropdownId]   = useState(null);
  const [filters,          setFilters]          = useState({ city: "", country: "", occupation: "" });
  const [isRefreshing,     setIsRefreshing]     = useState(false);
  const [isSticky,         setIsSticky]         = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const pageRef      = useRef(1);
  // isFetching ref prevents double-fetches from React strict mode / fast nav
  const isFetching   = useRef(false);
  // isSearchMode: true when user is actively searching/filtering
  const isSearchMode = useRef(false);
  const seedRef = useRef(String(Date.now())); 

  const readToken    = () => localStorage.getItem("token");
  const authHeaders  = () => {
    const t = readToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const normalizeArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.suggestions || data.users || data.results || data.data || [];
  };

  // ── Cache helpers ─────────────────────────────────────────────────────────
  const writeCache = (data) => {
    try {
      sessionStorage.setItem(DISCOVER_DATA_KEY,      JSON.stringify(data));
      sessionStorage.setItem(DISCOVER_TIMESTAMP_KEY, String(Date.now()));
    } catch (_) { /* storage full — ignore */ }
  };

  const readCache = () => {
    try {
      const raw  = sessionStorage.getItem(DISCOVER_DATA_KEY);
      const time = sessionStorage.getItem(DISCOVER_TIMESTAMP_KEY);
      if (!raw || !time) return null;
      // Relationship state is volatile — short TTL
      if (Date.now() - parseInt(time, 10) > CACHE_TTL) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  };

  const clearCache = () => {
    sessionStorage.removeItem(DISCOVER_DATA_KEY);
    sessionStorage.removeItem(DISCOVER_TIMESTAMP_KEY);
  };

  // ── Fetch suggestions (non-search mode) ──────────────────────────────────
  const fetchSuggestions = useCallback(async (forceRefresh = false) => {
    if (isFetching.current) return;

    // Try cache first (only on first page load, not on forced refresh)
    if (!forceRefresh) {
      const cached = readCache();
      if (cached && cached.length > 0) {
        setUsers(cached);
        setLoadingInitial(false);
        pageRef.current = Math.ceil(cached.length / 20);
        setHasMore(true);
        return;
      }
    }

    isFetching.current = true;
    setLoadingInitial(true);
    setFetchError(false);
    setError("");

    try {
      const res     = await axios.get(`${BASE}/api/user/suggestions`, {
        headers: authHeaders(),
        params:  { page: 1, limit: 20, seed: seedRef.current},
      });
      const fetched = normalizeArray(res.data);
      setUsers(fetched);
      writeCache(fetched);
      setHasMore(fetched.length === 20);
      pageRef.current = 1;
    } catch (err) {
      setError("Failed to load suggested users.");
      setFetchError(true);
    } finally {
      setLoadingInitial(false);
      isFetching.current = false;
    }
  }, [BASE]);

  // ── Search ────────────────────────────────────────────────────────────────
  const searchUsers = useCallback(async (isNewSearch = false) => {
    if (isFetching.current) return;

    const currentPage = isNewSearch ? 1 : pageRef.current;

    if (isNewSearch) {
      pageRef.current = 1;
      setHasMore(true);
      setUsers([]);
    }

    const params = new URLSearchParams({
      q:          input,
      city:       filters.city,
      country:    filters.country,
      occupation: filters.occupation,
      page:       currentPage,
      limit:      20,
    });

    isFetching.current = true;
    if (currentPage === 1) setLoadingInitial(true);
    else                   setLoadingMore(true);

    try {
      const res     = await axios.get(`${BASE}/api/user/search?${params}`, {
        headers: authHeaders(),
      });
      const fetched = normalizeArray(res.data);
      if (currentPage === 1) setUsers(fetched);
      else                   setUsers((prev) => [...prev, ...fetched]);
      setHasMore(fetched.length > 0);
      if (fetched.length > 0) {
        pageRef.current = currentPage + 1;
      }
    } catch (_) {
      setFetchError(true);
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
      isFetching.current = false;
    }
  }, [BASE, input, filters]);

  const applySearch = () => {
    isSearchMode.current = true;
    searchUsers(true);
  };

  // ── Infinite scroll load-more ─────────────────────────────────────────────
  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore || loadingInitial || isFetching.current) return;

    if (isSearchMode.current) {
      await searchUsers(false);
      return;
    }

    isFetching.current = true;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const res      = await axios.get(`${BASE}/api/user/suggestions`, {
        headers: authHeaders(),
        params:  { page: nextPage, limit: 20, seed: seedRef.current },
      });
      const more = normalizeArray(res.data);
      if (more.length === 0) {
        setHasMore(false);
        return;
      }
      setUsers((prev) => {
        const seenIds = new Set(prev.map((u) => String(u._id)));
        const newOnes = more.filter((u) => !seenIds.has(String(u._id)));
        const updated = [...prev, ...newOnes];
        writeCache(updated);
        return updated;
      });
      pageRef.current = nextPage;
      setHasMore(more.length === 20);
    } catch (_) {
      setFetchError(true);
    } finally {
      setLoadingMore(false);
      isFetching.current = false;
    }
  }, [hasMore, loadingMore, loadingInitial, BASE, searchUsers]);

  // ── Sticky header ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Persist scroll position ───────────────────────────────────────────────
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(DISCOVER_SCROLL_KEY);
    if (savedScroll) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll, 10)), 120);
    }
  }, []);

  useEffect(() => {
    const onScroll = () =>
      sessionStorage.setItem(DISCOVER_SCROLL_KEY, String(window.scrollY));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    isSearchMode.current = false;
    fetchSuggestions(false);
  }, []);

  // ── Filter change → re-search ─────────────────────────────────────────────
  useEffect(() => {
    const hasFilter = filters.city || filters.country || filters.occupation;
    if (hasFilter) {
      isSearchMode.current = true;
      searchUsers(true);
    }
  }, [filters]);

  // ── Refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    seedRef.current = String(Date.now()); 
    clearCache();                  // bust the cache so fresh data loads
    isSearchMode.current = false;
    setIsRefreshing(true);
    isFetching.current = false;    // allow the fetch to run
    fetchSuggestions(true).finally(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  // ── Clear filters ─────────────────────────────────────────────────────────
  const clearAll = () => {
    setInput("");
    setFilters({ city: "", country: "", occupation: "" });
    isSearchMode.current = false;
    isFetching.current   = false;
    setIsFilterExpanded(false);
    fetchSuggestions(true);
  };

  // ── Optimistic update from UserCard ──────────────────────────────────────
  // When a user follows/unfollows or sends/accepts a connection inside a card,
  // the card calls onUserUpdate with the updated user object.
  // We patch it in state AND in the cache so the button reflects immediately.
  const handleUserUpdate = useCallback((updatedUser) => {
    setUsers((prev) => {
      const next = prev.map((u) =>
        String(u._id) === String(updatedUser._id) ? { ...u, ...updatedUser } : u
      );
      writeCache(next);   // keep cache in sync
      return next;
    });
  }, []);

  const hasActiveFilter = input || filters.city || filters.country || filters.occupation;

  return (
    <div className="discover-page min-h-screen pb-10">
      {/* ── STICKY SEARCH HEADER ── */}
      <div
        id="discover-search-wrapper"
        className={`discover_search_wrapper fixed left-0 right-0 top-0 md:sticky md:top-0 z-30 transition-all duration-300 ${
          isSticky ? "py-1" : "py-2"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 flex flex-col justify-center items-center">
          <div className="discover_search_bar w-[90%]">
            <div className="flex flex-col gap-3">
              {/* Search input row */}
              <div className="max-h-10 relative flex">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search name, location, or occupation…"
                  className="discoveries_iput w-[80%]"
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                />
                <button
                  onClick={applySearch}
                  aria-label="Search"
                  className="discoveries_btn"
                >
                  <Search size={16} />
                </button>

                {hasActiveFilter && (
                  <button
                    onClick={clearAll}
                    className="discoveries_clear_btn hidden md:flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <X size={15} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="discover_filter_toggle md:hidden flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>Filters</span>
                  {(filters.city || filters.country || filters.occupation) && (
                    <span
                      style={{
                        background: "var(--primary-color)",
                        color: "#fff",
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "99px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}
                    >
                      Active
                    </span>
                  )}
                </span>
                {isFilterExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>

              {/* Filter dropdowns */}
              <div
                className={`flex-wrap gap-2 overflow-visible ${
                  isFilterExpanded ? "flex" : "hidden md:flex"
                }`}
              >
                <CustomDropdown
                  id="city"
                  label="City"
                  options={["Ikeja", "Mumbai", "London"]}
                  value={filters.city}
                  onChange={(val) => setFilters((p) => ({ ...p, city: val }))}
                  openDropdownId={openDropdownId}
                  setOpenDropdownId={setOpenDropdownId}
                  setInput={setInput}
                />
                <CustomDropdown
                  id="country"
                  label="Country"
                  options={["Nigeria", "India", "USA", "UK"]}
                  value={filters.country}
                  onChange={(val) => setFilters((p) => ({ ...p, country: val }))}
                  openDropdownId={openDropdownId}
                  setOpenDropdownId={setOpenDropdownId}
                  setInput={setInput}
                />
                <CustomDropdown
                  id="occupation"
                  label="Occupation"
                  options={["Developer", "Designer", "Engineer"]}
                  value={filters.occupation}
                  onChange={(val) => setFilters((p) => ({ ...p, occupation: val }))}
                  openDropdownId={openDropdownId}
                  setOpenDropdownId={setOpenDropdownId}
                  setInput={setInput}
                />

                {hasActiveFilter && (
                  <button
                    onClick={clearAll}
                    className="discover_clear_all_btn md:hidden w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  >
                    <X size={15} />
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="discover-refresh-row">
            <RefreshButton
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-5 discover_content_container">
        <div className="discover-page-head">
          <div className="discover-eyebrow">
            <span>✦</span> People
          </div>
          <h1 className="discover-h1">
            Discover <em>people</em>
          </h1>
          <p className="discover-sub">
            Find and connect with people who share your interests and passions.
          </p>
        </div>

        {!loadingInitial && users.length > 0 && (
          <div className="discover-meta-bar">
            <p className="discover-result-count">
              Showing <strong>{users.length}</strong>{" "}
              {hasActiveFilter ? "results" : "suggested people"}
            </p>
          </div>
        )}

        {loadingInitial && (
          <div className="grid discoveries_grid">
            {Array.from({ length: 9 }).map((_, idx) => (
              <SkeletonUserCard key={idx} />
            ))}
          </div>
        )}

        {!loadingInitial && users.length > 0 && (
          <div className="discoveries_grid pb-20">
            {users.map((userItem) => (
              <UserCard
                key={String(userItem._id)}
                user={userItem}
                onUserUpdate={handleUserUpdate}
              />
            ))}
          </div>
        )}

        {!loadingInitial && users.length === 0 && !error && (
          <div className="disc-empty">
            <div className="disc-empty-orbit">
              <Users size={26} />
            </div>
            <p className="disc-empty-title">No results found</p>
            <p className="disc-empty-text">
              Try different search terms or clear your filters to explore everyone.
            </p>
          </div>
        )}

        {error && !loadingInitial && (
          <div className="disc-empty">
            <p className="disc-empty-title">{error}</p>
          </div>
        )}

        {loadingMore && (
          <div className="disc-loading-more">
            <span className="disc-loading-dot" />
            <span className="disc-loading-dot" />
            <span className="disc-loading-dot" />
            <span style={{ marginLeft: 6 }}>Loading more</span>
          </div>
        )}

        {fetchError && !loadingMore && (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
            <button
              onClick={() =>
                isSearchMode.current ? searchUsers(false) : fetchMore()
              }
              style={{
                padding: "10px 28px",
                background: "var(--primary-color)",
                color: "#fff",
                borderRadius: "10px",
                fontFamily: "'Sora', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(59,92,203,0.3)",
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <InfiniteScrollTrigger
        onReachBottom={fetchMore}
        enabled={hasMore && !loadingInitial}
      />

      <div className="disc-footer">
        <div className="disc-footer-rule" />
        <div className="disc-footer-badge">
          <Sprout size={13} style={{ color: "#16a34a", opacity: 0.8 }} />
          Connect &amp; Grow
        </div>
      </div>
    </div>
  );
}