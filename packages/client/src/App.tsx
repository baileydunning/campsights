import React, { Suspense, lazy, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Loading from './components/Loading/Loading'
import SearchBar from './components/SearchBar/SearchBar'
import { fetchCampsites, selectCampsites } from './store/campsiteSlice'
import type { AppDispatch } from './store/store'
import type { Campsite } from './types/Campsite'
import './App.css'

const MapView = lazy(() => import('./components/MapView/MapView'))

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const allCampsites = useSelector(selectCampsites)
  const [filtered, setFiltered] = useState<Campsite[]>([])

  useEffect(() => {
    dispatch(fetchCampsites())
  }, [dispatch])

  useEffect(() => {
    setFiltered(allCampsites)
  }, [allCampsites])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Campsights</h1>
        <h3>Explore Dispersed Campsites on Public Lands</h3>
        <SearchBar campsites={allCampsites} onSearchResults={setFiltered} />
      </header>
      <div className="app-container">
        <main className="main-content">
          <Suspense fallback={<Loading />}>
            <MapView campsites={filtered} />
          </Suspense>
        </main>
      </div>
      <a
        href="https://github.com/baileydunning/campsights"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View on GitHub"
        style={{
          position: 'fixed',
          left: 20,
          bottom: 20,
          zIndex: 2000,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#BDDAB1',
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="#226D52"
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.624-5.475 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      </a>
    </div>
  )
}

export default App
