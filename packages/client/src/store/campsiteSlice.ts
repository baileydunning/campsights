import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Campsite, CampsitesState } from '../types/Campsite';
import { getCampsites, addCampsite } from '../api/Campsites';

// Async thunks for API calls
export const fetchCampsites = createAsyncThunk(
  'campsites/fetchCampsites',
  async (_, { rejectWithValue }) => {
    try {
      const campsites = await getCampsites();
      return campsites;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch campsites');
    }
  }
);

export const postCampsite = createAsyncThunk(
  'campsites/postCampsite',
  async (campsite: Campsite, { rejectWithValue }) => {
    try {
      const newCampsite = await addCampsite(campsite);
      return newCampsite;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add campsite');
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
      // Post campsite
      .addCase(postCampsite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postCampsite.fulfilled, (state, action) => {
        state.loading = false;
        state.campsites.push(action.payload);
        state.error = null;
      })
      .addCase(postCampsite.rejected, (state, action) => {
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