import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import SearchBar from './SearchBar'
import type { Campsite } from '../../types/Campsite'

const mockCampsites: Campsite[] = [
  {
    id: '1',
    name: 'Sunny Camp',
    description: 'A bright and sunny campsite',
    state: 'California',
    activities: ['hiking', 'swimming'],
    url: 'https://example.com/sunny-camp',
    lat: 34.05,
    lng: -118.25,
    mapLink: 'https://maps.example.com/sunny-camp',
    source: 'BLM' as const,
  },
  {
    id: '2',
    name: 'Mountain View',
    description: 'A campsite with a mountain view',
    state: 'Colorado',
    activities: ['skiing', 'hiking'],
    url: 'https://example.com/mountain-view',
    lat: 39.74,
    lng: -104.99,
    mapLink: 'https://maps.example.com/mountain-view',
    source: 'BLM' as const,
  },
]

describe('SearchBar', () => {
  it('renders input with placeholder', () => {
    const onSearchResults = vi.fn()
    const { getByPlaceholderText } = render(
      <SearchBar campsites={mockCampsites} onSearchResults={onSearchResults} />
    )
    expect(getByPlaceholderText('Search by name, state, activities...')).toBeInTheDocument()
  })

  it('calls onSearchResults with all campsites on empty input', () => {
    const onSearchResults = vi.fn()
    render(<SearchBar campsites={mockCampsites} onSearchResults={onSearchResults} />)
    expect(onSearchResults).toHaveBeenCalledWith(mockCampsites)
  })

  it('filters campsites by name', () => {
    const onSearchResults = vi.fn()
    const { getByPlaceholderText } = render(
      <SearchBar campsites={mockCampsites} onSearchResults={onSearchResults} />
    )
    const input = getByPlaceholderText('Search by name, state, activities...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Sunny' } })
    expect(onSearchResults).toHaveBeenLastCalledWith([mockCampsites[0]])
  })

  it('filters campsites by state', () => {
    const onSearchResults = vi.fn()
    const { getByPlaceholderText } = render(
      <SearchBar campsites={mockCampsites} onSearchResults={onSearchResults} />
    )
    const input = getByPlaceholderText('Search by name, state, activities...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Colorado' } })
    expect(onSearchResults).toHaveBeenLastCalledWith([mockCampsites[1]])
  })

  it('filters campsites by activity', () => {
    const onSearchResults = vi.fn()
    const { getByPlaceholderText } = render(
      <SearchBar campsites={mockCampsites} onSearchResults={onSearchResults} />
    )
    const input = getByPlaceholderText('Search by name, state, activities...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'hiking' } })
    expect(onSearchResults).toHaveBeenLastCalledWith(mockCampsites)
  })

  it('filters campsites by multiple words', () => {
    const onSearchResults = vi.fn()
    const { getByPlaceholderText } = render(
      <SearchBar campsites={mockCampsites} onSearchResults={onSearchResults} />
    )
    const input = getByPlaceholderText('Search by name, state, activities...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Mountain hiking' } })
    expect(onSearchResults).toHaveBeenLastCalledWith([mockCampsites[1]])
  })

  it('returns no results if no match', () => {
    const onSearchResults = vi.fn()
    const { getByPlaceholderText } = render(
      <SearchBar campsites={mockCampsites} onSearchResults={onSearchResults} />
    )
    const input = getByPlaceholderText('Search by name, state, activities...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'desert' } })
    expect(onSearchResults).toHaveBeenLastCalledWith([])
  })

  it('input value updates on change', () => {
    const onSearchResults = vi.fn()
    const { getByPlaceholderText } = render(
      <SearchBar campsites={mockCampsites} onSearchResults={onSearchResults} />
    )
    const input = getByPlaceholderText('Search by name, state, activities...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'test' } })
    expect(input.value).toBe('test')
  })
})
