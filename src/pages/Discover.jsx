import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Users, Search, Sprout, X, ChevronDown, ChevronUp } from "lucide-react";
import UserCard from "../component/UserCard";
import InfiniteScrollTrigger from "../component/InfiniteScrollTrigger";
import CustomDropdown from "../component/shared/CustomDropdown";
import "./discoveries.css";
import { useAuth } from "../context/AuthContext";
import ErrorAlert from "../component/ErrorAlert";
import SkeletonUserCard from "../component/skeleton/SkeletonUserCard";
import RefreshButton from "../component/shared/RefreshButton";

export default function Discover() {
  const BASE = (import.meta.env.VITE_SERVER || "").replace(/\/$/, "");

  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [error, setError] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [filters, setFilters] = useState({ city: "", country: "", occupation: "" });
  const hasFetched = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isSticky, setIsSticky] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const readToken = () => localStorage.getItem("token");
  const authHeaders = () => {
    const t = readToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const normalizeArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.suggestions || data.users || data.results || data.data || [];
  };

  const fetchSuggestions = async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoadingInitial(true);
    setError("");

    try {
      const res = await axios.get(`${BASE}/api/user/suggestions`, {
        headers: authHeaders(),
        params: { page: 1, limit: 20 },
      });
      const fetched = normalizeArray(res.data);
      localStorage.setItem("springsCircleDiscoveredSuggestedUsers", fetched);
      setUsers(fetched || localStorage.getItem("springsCircleDiscoveredSuggestedUsers") || []);
      setHasMore(fetched.length === 20);
      setPage(1);
      pageRef.current = 1;
    } catch (err) {
      setError("Failed to load suggested users.");
    } finally {
      setLoadingInitial(false);
    }
  };

  const searchUsers = async (isNewSearch = false) => {
    if (isNewSearch) {
      setPage(1);
      pageRef.current = 1;
      setHasMore(true);
      setUsers([]);
    }

    const currentPage = pageRef.current;
    const params = new URLSearchParams({
      q: input,
      city: filters.city,
      country: filters.country,
      occupation: filters.occupation,
      page: currentPage,
      limit: 20,
    });

    try {
      if (currentPage === 1) setLoadingInitial(true);
      else setLoadingMore(true);
      const res = await axios.get(`${BASE}/api/user/search?${params}`, {
        headers: authHeaders(),
      });
      const fetched = normalizeArray(res.data);
      if (currentPage === 1) setUsers(fetched);
      else setUsers((prev) => [...prev, ...fetched]);
      setHasMore(fetched.length > 0);
      if (fetched.length > 0) {
        pageRef.current = currentPage + 1;
        setPage(pageRef.current);
      }
    } catch (err) {
      setFetchError(true);
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  };

  const applySearch = () => searchUsers(true);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore || loadingInitial) return;
    if (input || filters.city || filters.country || filters.occupation) {
      await searchUsers();
      return;
    }
    setLoadingMore(true);
    try {
      const res = await axios.get(`${BASE}/api/user/suggestions`, {
        headers: authHeaders(),
        params: { page: pageRef.current + 1, limit: 20 },
      });
      const more = normalizeArray(res.data);
      if (more.length === 0) {
        setHasMore(false);
        return;
      }
      setUsers((prev) => [...prev, ...more]);
      pageRef.current += 1;
      setPage(pageRef.current);
      setHasMore(more.length === 20);
    } catch (err) {
      setFetchError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loadingInitial, input, filters]);

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

 const DISCOVER_SCROLL_KEY = "discover_scroll_position";
  const DISCOVER_DATA_KEY = "discover_cached_data";
  const DISCOVER_TIMESTAMP_KEY = "discover_cached_timestamp";
  const CACHE_TTL = 5 * 60 * 1000;

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(DISCOVER_SCROLL_KEY);
    if (savedScroll) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll, 10)), 100);
    }
    const cached = sessionStorage.getItem(DISCOVER_DATA_KEY);
    const cachedTime = sessionStorage.getItem(DISCOVER_TIMESTAMP_KEY);
    const isStale = !cachedTime || Date.now() - parseInt(cachedTime) > CACHE_TTL;

    if (cached && !isStale) {
      try {
        setUsers(JSON.parse(cached));
        setLoadingInitial(false);
      } catch (e) {
        fetchSuggestions();
      }
    } else {
      fetchSuggestions();
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(DISCOVER_SCROLL_KEY, window.scrollY.toString());
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      sessionStorage.setItem(DISCOVER_DATA_KEY, JSON.stringify(users));
      sessionStorage.setItem(DISCOVER_TIMESTAMP_KEY, Date.now().toString());
    }
  }, [users]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    hasFetched.current = false;
    fetchSuggestions();
  };

  React.useEffect(() => {
    if (!loadingInitial && isRefreshing) {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [loadingInitial, isRefreshing]);

  useEffect(() => {
    if (filters.city || filters.country || filters.occupation) {
      searchUsers(true);
    }
  }, [filters]);

  const handleUserUpdate = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
    );
  };

  const hasActiveFilter =
    input || filters.city || filters.country || filters.occupation;

  return (
    <div className="discover-page min-h-screen pb-10">
      {/* ── STICKY SEARCH HEADER ── */}
      <div
        id="discover-search-wrapper"
        className={`discover_search_wrapper fixed left-0 right-0 top-0 md:sticky md:top-0 z-30 transition-all duration-300 ${isSticky ? "py-1" : "py-2"}`}
      >
        <div className="max-w-6xl mx-auto px-5 flex flex-col justify-center items-center">
          <div className="discover_search_bar w-[90%]">
            <div className="flex flex-col gap-3">
              {/* Search input row */}
  
                <div className="max-h-10 relative flex ">
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
                    className="discoveries_btn "
                  >
                    <Search size={16} />
                  </button>
            

                {/* Desktop clear */}
                {hasActiveFilter && (
                  <button
                    onClick={() => {
                      setInput("");
                      setFilters({ city: "", country: "", occupation: "" });
                      hasFetched.current = false;
                      fetchSuggestions();
                    }}
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
                {isFilterExpanded ? (
                  <ChevronUp size={17} />
                ) : (
                  <ChevronDown size={17} />
                )}
              </button>

              {/* Filter dropdowns */}
              <div
                className={`flex-wrap gap-2 overflow-visible ${isFilterExpanded ? "flex" : "hidden md:flex"}`}
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
                  onChange={(val) =>
                    setFilters((p) => ({ ...p, occupation: val }))
                  }
                  openDropdownId={openDropdownId}
                  setOpenDropdownId={setOpenDropdownId}
                  setInput={setInput}
                />

                {/* Mobile clear all */}
                {hasActiveFilter && (
                  <button
                    onClick={() => {
                      setInput("");
                      setFilters({ city: "", country: "", occupation: "" });
                      hasFetched.current = false;
                      fetchSuggestions();
                      setIsFilterExpanded(false);
                    }}
                    className="discover_clear_all_btn md:hidden w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  >
                    <X size={15} />
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Refresh row */}
          <div className="discover-refresh-row">
                    <RefreshButton 
              onRefresh={handleRefresh} 
              isRefreshing={isRefreshing}
              scrollTargetRef={window.scrollY}  // ← Feed uses a div ref, not window
            />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-5 discover_content_container">
        {/* Page title */}
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

        {/* Result meta */}
        {!loadingInitial && users.length > 0 && (
          <div className="discover-meta-bar">
            <p className="discover-result-count">
              Showing <strong>{users.length}</strong>{" "}
              {hasActiveFilter ? "results" : "suggested people"}
            </p>
          </div>
        )}

        {/* ── Skeleton loaders ── */}
        {loadingInitial && (
          <div className="grid discoveries_grid">
            {Array.from({ length: 9 }).map((_, idx) => (
              <SkeletonUserCard key={idx} />
            ))}
          </div>
        )}

        {/* ── Users grid ── */}
        {!loadingInitial && users.length > 0 && (
          <div className="discoveries_grid pb-20">
            {users.map((userItem) => (
              <UserCard
                key={userItem._id}
                user={userItem}
                onUserUpdate={handleUserUpdate}
              />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loadingInitial && users.length === 0 && (
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

        {/* ── Loading more ── */}
        {loadingMore && (
          <div className="disc-loading-more">
            <span className="disc-loading-dot" />
            <span className="disc-loading-dot" />
            <span className="disc-loading-dot" />
            <span style={{ marginLeft: 6 }}>Loading more</span>
          </div>
        )}

        {/* ── Fetch error retry ── */}
        {fetchError && (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
            <button
              onClick={() => searchUsers()}
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

      {/* ── Footer flourish ── */}
      <div className="disc-footer">
        <div className="disc-footer-rule" />
        <div className="disc-footer-badge">
          <Sprout
            size={13}
            style={{ color: "#16a34a", opacity: 0.8 }}
          />
          Connect &amp; Grow
        </div>
      </div>
    </div>
  );
}
