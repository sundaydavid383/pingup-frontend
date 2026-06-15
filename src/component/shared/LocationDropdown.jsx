import React, { useState, useEffect, useRef } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";

const LocationDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync if parent clears the value
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch from Nominatim with debounce
  const fetchSuggestions = (searchText) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchText || searchText.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchText.trim())}` +
          `&format=json` +
          `&addressdetails=1` +
          `&limit=7` +
          `&featuretype=city,town,village,suburb,county,state,country`,
          {
            headers: {
              // Nominatim requires a User-Agent — put your app name here
              'Accept-Language': 'en',
            }
          }
        );
        const data = await res.json();

        // Format each result into a clean readable label
        const formatted = data.map((item) => {
          const a = item.address || {};
          const parts = [
            a.city || a.town || a.village || a.suburb || a.county || a.state_district,
            a.state || a.region,
            a.country,
          ].filter(Boolean);
          return {
            label: parts.join(', ') || item.display_name,
            full: item.display_name,
          };
        });

        // Remove duplicates by label
        const seen = new Set();
        const unique = formatted.filter(({ label }) => {
          if (seen.has(label)) return false;
          seen.add(label);
          return true;
        });

        setSuggestions(unique);
        setOpen(unique.length > 0);
      } catch (err) {
        console.error('Location search error:', err);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400); // 400ms debounce — Nominatim asks you not to send more than 1 req/sec
  };

  const handleSelect = (label) => {
    setQuery(label);
    onChange(label);
    setSuggestions([]);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val); // keep parent in sync as user types
    fetchSuggestions(val);
  };

  return (
    <div className="sf-loc-wrap" ref={wrapRef}>
      <div className="sf-loc-input-row">
        <MapPin size={16} className="sf-loc-icon" />
        <input
          className="sf-loc-input"
          type="text"
          placeholder="Type any city, town or country…"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          autoComplete="off"
        />
        {/* Show spinner while fetching, chevron otherwise */}
        {searching ? (
          <svg className="sf-loc-spinner" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
          </svg>
        ) : (
          <ChevronDown size={15} className={`sf-loc-chevron ${open ? 'sf-loc-chevron-open' : ''}`} />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="sf-loc-dropdown">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`sf-loc-option ${query === s.label ? 'sf-loc-option-selected' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s.label); }}
            >
              <MapPin size={12} className="sf-loc-option-icon" />
              <span>{s.label}</span>
              {query === s.label && <Check size={12} className="sf-loc-check" />}
            </button>
          ))}
        </div>
      )}

      {open && searching && suggestions.length === 0 && (
        <div className="sf-loc-dropdown">
          <div className="sf-loc-searching">Searching…</div>
        </div>
      )}

      {open && !searching && suggestions.length === 0 && query.length >= 2 && (
        <div className="sf-loc-dropdown">
          <div className="sf-loc-searching">No results for "{query}"</div>
        </div>
      )}
    </div>
  );
};

export default LocationDropdown;