import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CampsitesState } from '../types/Campsite';
import { getCampsites, getCampsiteById } from '../api/Campsites';

export const fetchCampsites = createAsyncThunk(
  'campsites/fetchCampsites',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { campsites: CampsitesState };
    if (state.campsites.campsites.length > 0) {
      return state.campsites.campsites;
    }

    const CACHE_KEY = 'campsights_campsites';
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return data;
        }
      }
      const campsites = await getCampsites();
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: campsites, timestamp: Date.now() }));
      return campsites;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch campsites');
    }
  }
);

export const fetchCampsiteById = createAsyncThunk(
  'campsites/fetchCampsiteById',
  async (id: string, { rejectWithValue }) => {
    const CAMPSITE_CACHE_KEY = `campsights_campsite_${id}`;
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    try {
      const cached = localStorage.getItem(CAMPSITE_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return data;
        }
      }
      const campsite = await getCampsiteById(id);
      localStorage.setItem(CAMPSITE_CACHE_KEY, JSON.stringify({ data: campsite, timestamp: Date.now() }));
      return campsite;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch campsite');
    }
  }
);

const initialState: CampsitesState = {
  campsites: [],
  loading: false,
  error: null,
};

const campsiteSlice = createSlice({
  name: 'campsites',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampsites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampsites.fulfilled, (state, action) => {
        state.loading = false;
        state.campsites = action.payload;
        state.error = null;
      })
      .addCase(fetchCampsites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCampsiteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampsiteById.fulfilled, (state, action) => {
        state.loading = false;
        const campsite = action.payload;
        if (campsite && campsite.id) {
          const existingIndex = state.campsites.findIndex(c => c.id === campsite.id);
          if (existingIndex >= 0) {
            state.campsites[existingIndex] = campsite;
          } else {
            state.campsites.push(campsite);
          }
        }
        state.error = null;
      })
      .addCase(fetchCampsiteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = campsiteSlice.actions;

export const selectCampsites = (state: { campsites: CampsitesState }) => state.campsites.campsites;
export const selectLoading = (state: { campsites: CampsitesState }) => state.campsites.loading;
export const selectError = (state: { campsites: CampsitesState }) => state.campsites.error;

export default campsiteSlice.reducer;