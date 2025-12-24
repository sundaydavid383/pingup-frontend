import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Users, Search, Sprout, MapPin, X } from "lucide-react";
import UserCard from "../component/UserCard";
import InfiniteScrollTrigger from "../component/InfiniteScrollTrigger";
import CustomDropdown from "../component/shared/CustomDropdown";
import "./discoveries.css";
import { useAuth } from "../context/AuthContext";
import ErrorAlert from "../component/ErrorAlert";
import SkeletonUserCard from "../component/skeleton/SkeletonUserCard";

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
      setUsers(fetched || []);
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

  useEffect(() => { fetchSuggestions(); }, []);

  const handleUserUpdate = (updatedUser) => {
    setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
      {/* STICKY SEARCH HEADER */}
      <div className={`discover_search_wrapper sticky top-0 z-50 transition-all duration-300 ${isSticky ? 'bg-white/80 backdrop-blur-lg shadow-sm py-2' : 'bg-transparent py-6'}`}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col gap-4">
            {/* SEARCH INPUT WITH ICON INSIDE */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search name, location, or occupation..."
                  className="discoveries_iput w-full pl-5 pr-12 py-3.5"
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                />
                <button
                  onClick={applySearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md active:scale-95"
                >
                  <Search size={18} />
                </button>
              </div>

              {/* CLEAR BUTTON */}
              {(input || filters.city || filters.country || filters.occupation) && (
                <button
                  onClick={() => {
                    setInput("");
                    setFilters({ city: "", country: "", occupation: "" });
                    hasFetched.current = false;
                    fetchSuggestions();
                  }}
                  className="hidden md:flex items-center gap-1 text-gray-500 hover:text-red-500 text-sm font-medium transition-colors"
                >
                  <X size={16} /> Clear
                </button>
              )}
            </div>

            {/* FILTER DROPDOWNS */}
            <div className="flex flex-wrap gap-2 overflow-visible">
              <CustomDropdown
                id="city"
                label="City"
                options={["Ikeja", "Mumbai", "London"]}
                value={filters.city}
                onChange={(val) => setFilters(p => ({ ...p, city: val }))}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />
              <CustomDropdown
                id="country"
                label="Country"
                options={["Nigeria", "India", "USA", "UK"]}
                value={filters.country}
                onChange={(val) => setFilters(p => ({ ...p, country: val }))}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />
              <CustomDropdown
                id="occupation"
                label="Occupation"
                options={["Developer", "Designer", "Engineer"]}
                value={filters.occupation}
                onChange={(val) => setFilters(p => ({ ...p, occupation: val }))}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* USERS GRID */}
      <div className="max-w-6xl mx-auto px-5 mt-4">
        <div className="discoveries_grid">
          {users.map((userItem) => (
            <UserCard key={userItem._id} user={userItem} onUserUpdate={handleUserUpdate} />
          ))}
        </div>

        {loadingInitial && (
          <div className="grid discoveries_grid mt-8">
            {Array.from({ length: 6 }).map((_, idx) => <SkeletonUserCard key={idx} />)}
          </div>
        )}

        {/* LOADING & ERROR STATES */}
        <div className="flex flex-col items-center py-10">
          {loadingMore && <div className="animate-pulse text-blue-600 font-medium">Loading more...</div>}
          {fetchError && (
            <button onClick={() => searchUsers()} className="px-6 py-2 bg-blue-600 text-white rounded-full">
              Retry
            </button>
          )}
          {!loadingInitial && users.length === 0 && (
            <div className="text-gray-400 text-center">
              <Users size={48} className="mx-auto mb-2 opacity-20" />
              <p>No results found</p>
            </div>
          )}
        </div>
      </div>

      <InfiniteScrollTrigger onReachBottom={fetchMore} enabled={hasMore && !loadingInitial} />

      <div className="mt-20 pb-10 text-gray-400 flex flex-col items-center gap-2">
        <Sprout size={24} className="text-green-500 opacity-50" />
        <span className="text-xs uppercase tracking-widest">Connect & Grow</span>
      </div>
    </div>
  );
}