import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Users } from "lucide-react";
import BackButton from "../component/shared/BackButton";
import UserCard from "../component/UserCard";
import InfiniteScrollTrigger from "../component/InfiniteScrollTrigger";
import SkeletonDiscoverGrid from "../component/skeleton/SkeletonDiscoverGrid";
import CustomDropdown from "../component/shared/CustomDropdown";
import "./discoveries.css";
import { useAuth } from "../context/AuthContext";
import ErrorAlert from "../component/ErrorAlert";
import SkeletonUserCard from "../component/skeleton/SkeletonUserCard";
import { Sprout } from "lucide-react";



export default function Discover() {
  const BASE = (import.meta.env.VITE_SERVER || "").replace(/\/$/, "");

  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const {user} = useAuth();
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [error, setError] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [filters, setFilters] = useState({ city: "", country: "", occupation: "" });
  const [noResults, setNoResults] = useState(false);
  const hasFetched = useRef(false);

  const [isSticky, setIsSticky] = useState(false);

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

  /** FETCH FIRST PAGE OF SUGGESTIONS */
const fetchSuggestions = async () => {
  if (hasFetched.current) return;
  hasFetched.current = true;

  setLoadingInitial(true);
  setError("");

  try {
    const res = await axios.get(`${BASE}/api/user/suggestions`, {
      headers: authHeaders(),
      params: {
        page: 1,
        limit: 20,
      },
    });

    const fetched = normalizeArray(res.data);
    setUsers(fetched || []);
    setHasMore(fetched.length === 20);
    setNoResults(!fetched || fetched.length === 0);

    setPage(1);
    pageRef.current = 1;
  } catch (err) {
    console.error("Suggestion fetch failed:", err);
    setError("Failed to load suggested users. Please try again.");
  } finally {
    setLoadingInitial(false);
  }
};



  /** SEARCH USERS WITH FILTERS */
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
      setFetchError(false);

      const res = await axios.get(`${BASE}/api/user/search?${params}`, {
        headers: authHeaders(),
      });

      const fetched = normalizeArray(res.data);

      if (currentPage === 1) setUsers(fetched);
      else setUsers((prev) => [...prev, ...fetched]);

      setHasMore(fetched.length > 0);
      if (fetched.length > 0) {
        setPage(currentPage + 1);
        pageRef.current = currentPage + 1;
      }
    } catch (err) {
      console.error("Search fetch failed:", err);
      setFetchError(true);
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  };

  const applySearch = () => searchUsers(true);

  // Combine filters into input
  useEffect(() => {
    const combined = [filters.city, filters.country, filters.occupation].filter(Boolean).join(", ");
    setInput(combined);
  }, [filters]);

  /** FETCH NEXT PAGE (Infinite Scroll) */
const fetchMore = useCallback(async () => {
  if (!hasMore || loadingMore || loadingInitial) return;

  // If searching, delegate to search logic
  if (input || filters.city || filters.country || filters.occupation) {
    await searchUsers();
    return;
  }

  setLoadingMore(true);
  setFetchError(false);

  try {
    const res = await axios.get(`${BASE}/api/user/suggestions`, {
      headers: authHeaders(),
      params: {
        page: pageRef.current + 1,
        limit: 20,
      },
    });

    const more = normalizeArray(res.data);

    if (more.length === 0) {
      setHasMore(false);
      return;
    }

    setUsers((prev) => [...prev, ...more]);
    pageRef.current += 1;
    setPage(pageRef.current);

    // 👇 stop when backend has no more
    setHasMore(more.length === 20);
  } catch (err) {
    console.error("Failed to load more users", err);
    setFetchError(true);
  } finally {
    setLoadingMore(false);
  }
}, [
  hasMore,
  loadingMore,
  loadingInitial,
  BASE,
  input,
  filters,
]);

  const retryFetch = () => {
    if (input || filters.city || filters.country || filters.occupation) applySearch();
    else fetchMore();
  };

  // Sticky scroll logic
  useEffect(() => {
    const wrapper = document.getElementById("discover-search-wrapper");
    if (!wrapper) return;

    const handleScroll = () => {
      const rect = wrapper.getBoundingClientRect();
      setIsSticky(rect.top <= 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleUserUpdate = (updatedUser) => {
    setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
  };

  const fluidGridStyle = {
    display: "grid",
    gap: "1.5rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    alignItems: "start",
    marginTop: "2rem",
  };

  return (
    <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 py-10">
      {/* <BackButton top="2" right="2" /> */}

      {/* Sticky Search Bar */}
 {/* SEARCH BAR */}
      <div
        id="discover-search-wrapper"
        className="sticky top-0 z-40 mobilenav_intervention backdrop-blur-md bg-white/40 px-5 py-3"
      >
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <div className="w-full flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search by name, location, country, occupation..."
              className="discoveries_iput"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applySearch();
                }
              }}
            />
            <button className="px-4 py-2 btn discoveries_btn" onClick={applySearch}>
              Search
            </button>
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap gap-3 w-full">
            <CustomDropdown
              id="city"
              label="City"
              options={["Ikeja", "Noller", "Mumbai", "London"]}
              value={filters.city}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, city: val }))
              }
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              setInput={setInput}
            />
            <CustomDropdown
              id="country"
              label="Country"
              options={["Nigeria", "India", "USA", "UK"]}
              value={filters.country}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, country: val }))
              }
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              setInput={setInput}
            />
            <CustomDropdown
              id="occupation"
              label="Occupation"
              options={["Developer", "Designer", "Teacher", "Engineer"]}
              value={filters.occupation}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, occupation: val }))
              }
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              setInput={setInput}
            />
          </div>
        </div>
      </div>


      {/* Users Grid */}
{/* Users Grid */}
<div className="mx-auto px-5 discoveries_grid">
  {users.map((userItem) => 
      <UserCard
        key={userItem._id ?? userItem.id}
        user={userItem}
        onUserUpdate={handleUserUpdate}
      />
    
  )}
</div>



      {/* Infinite Scroll Loader + Retry */}
      {(loadingMore || fetchError) && (
        <div className="flex flex-col items-center py-6 space-y-3">
          {loadingMore && (
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
          {fetchError && (
            <button
              onClick={retryFetch}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      <InfiniteScrollTrigger onReachBottom={fetchMore} enabled={hasMore && !loadingInitial} />

      {/* Initial Loading Skeleton */}
    {loadingInitial && (
  <div className="mt-8 grid discoveries_grid">
    {Array.from({ length: 6 }).map((_, idx) => (
      <SkeletonUserCard key={idx} />
    ))}
  </div>
)}

      {/* Error / No Results */}
    {!loadingInitial && (
  <ErrorAlert
    error={error}
    onClose={() => {
      // optional: clear error state in parent
      setError(null);
    }}
    autoHideMs={6000} // optional
  />
)}

      {!loadingInitial && !error && users.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium">No people found</p>
          <p className="text-sm mt-1">Try searching for a different name or location.</p>
        </div>
      )}

      {/* End Note */}
<div className="mt-12 text-sm text-gray-400 flex items-center justify-center gap-2">
  <Sprout size={30} className="text-green-500" />
  <span>Keep connecting — your next inspiration could be one follow away.</span>
</div>

    </div>
  );
}
