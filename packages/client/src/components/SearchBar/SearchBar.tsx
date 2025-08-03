import React, { useState, ChangeEvent, useEffect } from 'react'
import type { Campsite } from '../../types/Campsite'

interface SearchBarProps {
  campsites: Campsite[]
  onSearchResults: (results: Campsite[]) => void
}

const flattenObject = (obj: Record<string, any>): string => {
  return Object.values(obj)
    .flatMap((value) => {
      if (typeof value === 'object' && value !== null) {
        return flattenObject(value)
      }
      return String(value)
    })
    .join(' ')
    .toLowerCase()
}

const SearchBar: React.FC<SearchBarProps> = ({ campsites, onSearchResults }) => {
  const [query, setQuery] = useState('')

  useEffect(() => {
    onSearchResults(campsites)
  }, [campsites, onSearchResults])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setQuery(input)

    const searchWords = input.toLowerCase().split(/\s+/).filter(Boolean)

    const results = campsites.filter((camp) => {
      const flattened = flattenObject(camp)
      return searchWords.every((word) => flattened.includes(word))
    })

    onSearchResults(results)
  }

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search by name, state, activities..."
      className="search-bar"
      style={{ width: '50vw', height: '25px', outline: 'none' }}
    />
  )
}

export default SearchBar
