import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import reducer, {
  fetchCampsites,
  postCampsite,
  putCampsite,
  deleteCampsite,
  clearError,
  selectCampsites,
  selectLoading,
  selectError,
} from './campsiteSlice';
import * as api from '../api/Campsites';
import { Campsite, CampsitesState } from '../types/Campsite';

vi.mock('../api/Campsites');

const mockCampsite: Campsite = {
  id: '1',
  name: 'Test Site',
  description: 'Test Description',
  lat: 0,
  lng: 0,
  rating: 0,
  requires_4wd: false,
  last_updated: '',
};

const initialState: CampsitesState = {
  campsites: [],
  loading: false,
  error: null,
};

describe('campsiteSlice', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('reducers', () => {
    it('should handle clearError', () => {
      const state = { ...initialState, error: 'Some error' };
      const nextState = reducer(state, clearError());
      expect(nextState.error).toBeNull();
    });
  });

  describe('selectors', () => {
    const state = { campsites: { ...initialState, campsites: [mockCampsite], loading: true, error: 'err' } };
    it('selectCampsites returns campsites', () => {
      expect(selectCampsites(state)).toEqual([mockCampsite]);
    });
    it('selectLoading returns loading', () => {
      expect(selectLoading(state)).toBe(true);
    });
    it('selectError returns error', () => {
      expect(selectError(state)).toBe('err');
    });
  });

  describe('extraReducers', () => {
    describe('fetchCampsites', () => {
      it('handles pending', () => {
        const action = { type: fetchCampsites.pending.type };
        const state = reducer(initialState, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('handles fulfilled', () => {
        const campsites = [mockCampsite];
        const action = { type: fetchCampsites.fulfilled.type, payload: campsites };
        const state = reducer({ ...initialState, loading: true }, action);
        expect(state.loading).toBe(false);
        expect(state.campsites).toEqual(campsites);
        expect(state.error).toBeNull();
      });

      it('handles rejected', () => {
        const action = { type: fetchCampsites.rejected.type, payload: 'Error' };
        const state = reducer({ ...initialState, loading: true }, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Error');
      });
    });

    describe('postCampsite', () => {
      it('handles pending', () => {
        const action = { type: postCampsite.pending.type };
        const state = reducer(initialState, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('handles fulfilled', () => {
        const action = { type: postCampsite.fulfilled.type, payload: mockCampsite };
        const state = reducer({ ...initialState, loading: true }, action);
        expect(state.loading).toBe(false);
        expect(state.campsites).toContainEqual(mockCampsite);
        expect(state.error).toBeNull();
      });

      it('handles rejected', () => {
        const action = { type: postCampsite.rejected.type, payload: 'Error' };
        const state = reducer({ ...initialState, loading: true }, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Error');
      });
    });

    describe('putCampsite', () => {
      const updatedCampsite = { ...mockCampsite, name: 'Updated' };
      it('handles pending', () => {
        const action = { type: putCampsite.pending.type };
        const state = reducer(initialState, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('handles fulfilled', () => {
        const prevState = { ...initialState, campsites: [mockCampsite], loading: true };
        const action = { type: putCampsite.fulfilled.type, payload: updatedCampsite };
        const state = reducer(prevState, action);
        expect(state.loading).toBe(false);
        expect(state.campsites[0]).toEqual(updatedCampsite);
        expect(state.error).toBeNull();
      });

      it('handles rejected', () => {
        const action = { type: putCampsite.rejected.type, payload: 'Error' };
        const state = reducer({ ...initialState, loading: true }, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Error');
      });
    });

    describe('deleteCampsite', () => {
      it('handles pending', () => {
        const action = { type: deleteCampsite.pending.type };
        const state = reducer(initialState, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('handles fulfilled', () => {
        const prevState = { ...initialState, campsites: [mockCampsite], loading: true };
        const action = { type: deleteCampsite.fulfilled.type, payload: mockCampsite.id };
        const state = reducer(prevState, action);
        expect(state.loading).toBe(false);
        expect(state.campsites).toHaveLength(0);
        expect(state.error).toBeNull();
      });

      it('handles rejected', () => {
        const action = { type: deleteCampsite.rejected.type, payload: 'Error' };
        const state = reducer({ ...initialState, loading: true }, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Error');
      });
    });
  });
});