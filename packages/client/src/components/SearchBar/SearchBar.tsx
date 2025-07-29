import React, { useState, ChangeEvent } from "react";
import type { Campsite } from "../../types/Campsite";

interface SearchBarProps {
  campsites: Campsite[];
  onSearchResults: (results: Campsite[]) => void;
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

const SearchBar: React.FC<SearchBarProps> = ({ campsites, onSearchResults }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setQuery(input);

    const searchWords = input.toLowerCase().split(/\s+/).filter(Boolean);

    const results = campsites.filter((camp) => {
      const flattened = flattenObject(camp);
      return searchWords.every((word) => flattened.includes(word));
    });

    onSearchResults(results);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search by name, state, activities..."
      style={{
        padding: "0.5rem 1rem",
        fontSize: "1rem",
        border: "1px solid #ccc",
        borderRadius: "4px",
        width: "100%",
        maxWidth: "400px",
        outline: "none",
      }}
    />
  );
};

export default SearchBar;