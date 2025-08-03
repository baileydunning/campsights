import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import reducer, {
  fetchCampsites,
  fetchCampsiteById,
  clearError,
  selectCampsites,
  selectLoading,
  selectError,
} from './campsiteSlice'
import { Campsite, CampsitesState } from '../types/Campsite'

vi.mock('../api/Campsites')

const mockCampsite: Campsite = {
  id: '1',
  name: 'Test Site',
  description: 'Test Description',
  lat: 0,
  lng: 0,
  state: 'Test State',
  url: 'https://example.com',
  mapLink: 'https://maps.example.com',
  source: 'BLM',
  elevation: null,
  weather: [],
  directions: '',
  activities: [],
  campgrounds: [],
  wildlife: [],
  fees: '',
  stayLimit: '',
  images: [],
}

const initialState: CampsitesState = {
  campsites: [],
  loading: false,
  error: null,
}

describe('campsiteSlice', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('localStorage caching', () => {
    it('should cache and use campsites in localStorage via thunk', async () => {
      localStorage.clear()
      const mockCampsites = [mockCampsite]
      const { getCampsites } = await import('../api/Campsites')
      ;(getCampsites as any).mockResolvedValueOnce(mockCampsites)

      const dispatch = vi.fn()
      const getState = () => ({ campsites: initialState })
      const result = await fetchCampsites()(dispatch, getState, undefined)
      expect(result.payload).toEqual(mockCampsites)

      const cached = JSON.parse(localStorage.getItem('campsights_campsites')!)
      expect(cached.data).toEqual(mockCampsites)

      ;(getCampsites as any).mockClear()
      const result2 = await fetchCampsites()(dispatch, getState, undefined)
      expect(result2.payload).toEqual(mockCampsites)
    })
  })

  describe('reducers', () => {
    it('should handle clearError', () => {
      const state = { ...initialState, error: 'Some error' }
      const nextState = reducer(state, clearError())
      expect(nextState.error).toBeNull()
    })
  })

  describe('selectors', () => {
    const state = {
      campsites: { ...initialState, campsites: [mockCampsite], loading: true, error: 'err' },
    }
    it('selectCampsites returns campsites', () => {
      expect(selectCampsites(state)).toEqual([mockCampsite])
    })
    it('selectLoading returns loading', () => {
      expect(selectLoading(state)).toBe(true)
    })
    it('selectError returns error', () => {
      expect(selectError(state)).toBe('err')
    })
  })

  describe('extraReducers', () => {
    describe('fetchCampsites', () => {
      it('handles pending', () => {
        const action = { type: fetchCampsites.pending.type }
        const state = reducer(initialState, action)
        expect(state.loading).toBe(true)
        expect(state.error).toBeNull()
      })

      it('handles fulfilled', () => {
        const campsites = [mockCampsite]
        const action = { type: fetchCampsites.fulfilled.type, payload: campsites }
        const state = reducer({ ...initialState, loading: true }, action)
        expect(state.loading).toBe(false)
        expect(state.campsites).toEqual(campsites)
        expect(state.error).toBeNull()
      })

      it('handles rejected', () => {
        const action = { type: fetchCampsites.rejected.type, payload: 'Error' }
        const state = reducer({ ...initialState, loading: true }, action)
        expect(state.loading).toBe(false)
        expect(state.error).toBe('Error')
      })
    })

    describe('fetchCampsiteById', () => {
      it('handles pending', () => {
        const action = { type: fetchCampsiteById.pending.type }
        const state = reducer(initialState, action)
        expect(state.loading).toBe(true)
        expect(state.error).toBeNull()
      })

      it('handles fulfilled', () => {
        const action = { type: fetchCampsiteById.fulfilled.type, payload: mockCampsite }
        const state = reducer({ ...initialState, loading: true }, action)
        expect(state.loading).toBe(false)
        expect(state.campsites).toContain(mockCampsite)
        expect(state.error).toBeNull()
      })

      it('handles rejected', () => {
        const action = { type: fetchCampsiteById.rejected.type, payload: 'Error' }
        const state = reducer({ ...initialState, loading: true }, action)
        expect(state.loading).toBe(false)
        expect(state.error).toBe('Error')
      })
    })
  })
})
