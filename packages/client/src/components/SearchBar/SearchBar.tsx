import React, { useState, ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef } from "react";
import type { Campsite } from "../../types/Campsite";
import "./SearchBar.css";

interface SearchBarProps {
  campsites: Campsite[];
  onSearchResults: (results: Campsite[]) => void;
  onQueryChange?: (query: string) => void;
  initialQuery?: string;
}

const flattenObject = (obj: Record<string, any>): string => {
  return Object.values(obj)
    .flatMap((value) => {
      if (typeof value === "object" && value !== null) {
        return flattenObject(value);
      }
      return String(value);
    })
    .join(" ")
    .toLowerCase();
};

const SearchBar: React.FC<SearchBarProps> = ({ campsites, onSearchResults, onQueryChange, initialQuery = "" }) => {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build the searchable text once per dataset instead of on every keystroke.
  const searchIndex = useMemo(() => campsites.map((camp) => flattenObject(camp)), [campsites]);

  const filter = (input: string) => {
    const searchWords = input.toLowerCase().split(/\s+/).filter(Boolean);
    if (searchWords.length === 0) return campsites;
    return campsites.filter((_, i) => searchWords.every((word) => searchIndex[i].includes(word)));
  };

  // Re-run the current search when the data arrives or changes.
  useEffect(() => {
    onSearchResults(filter(query));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campsites, onSearchResults]);

  const update = (input: string) => {
    setQuery(input);
    onQueryChange?.(input.trim());
    onSearchResults(filter(input));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => update(e.target.value);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && query) {
      e.preventDefault();
      update("");
    }
  };

  const clear = () => {
    update("");
    inputRef.current?.focus();
  };

  return (
    <div className="search-bar">
      <svg className="search-bar__icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search by name, state, activities..."
        aria-label="Search campsites"
        className="search-bar__input"
        autoComplete="off"
        spellCheck={false}
      />
      {query && (
        <button type="button" className="search-bar__clear" onClick={clear} aria-label="Clear search">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
